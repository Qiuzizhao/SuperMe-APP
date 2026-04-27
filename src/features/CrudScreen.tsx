import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { Card, DateField, Field, Header, IconButton, PrimaryButton, Screen, SegmentedControl, StateView } from '@/src/components/ui';
import { apiRequest, buildAssetUrl, uploadImage } from '@/src/lib/api';
import { colors, radius, shadow, spacing } from '@/src/theme';
import { FieldConfig, ModuleConfig } from './moduleConfig';

type RecordItem = Record<string, any> & { id: number };
type FormState = Record<string, string>;
type ModuleTile = ModuleConfig & { placeholder?: boolean };

function valueToFormValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function initialForm(config: ModuleConfig, item?: RecordItem): FormState {
  return config.fields.reduce<FormState>((acc, field) => {
    if (item) {
      acc[field.key] = valueToFormValue(item[field.key]);
    } else if (field.defaultValue !== undefined) {
      acc[field.key] = valueToFormValue(field.defaultValue);
    } else if (field.type === 'date') {
      acc[field.key] = today();
    } else {
      acc[field.key] = '';
    }
    return acc;
  }, {});
}

function normalizeValue(field: FieldConfig, value: string) {
  const trimmed = value.trim();
  if (!trimmed && !field.required) return null;
  if (field.type === 'number') {
    const parsed = Number(trimmed || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (field.type === 'boolean') return trimmed === 'true';
  return trimmed;
}

function payloadFromForm(config: ModuleConfig, form: FormState) {
  return config.fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.key] = normalizeValue(field, form[field.key] ?? '');
    return acc;
  }, {});
}

function labelFor(config: ModuleConfig, key: string) {
  const rawLabel = config.fields.find((field) => field.key === key)?.label || key;
  return rawLabel.replace(/\s*(YYYY-MM-DD|YYYY-MM|ISO|1-10|1-5|0-100)\s*/g, '');
}

function displayValue(config: ModuleConfig, key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const field = config.fields.find((item) => item.key === key);
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (field?.options) {
    return field.options.find((option) => option.value === String(value))?.label || String(value);
  }
  if (typeof value === 'number' && (key.includes('amount') || key.includes('price'))) {
    return `¥${value.toFixed(2)}`;
  }
  return String(value);
}

function getItemTitle(config: ModuleConfig, item: RecordItem) {
  const value = item[config.titleField];
  if (value) return String(value);
  return `${config.title} #${item.id}`;
}

function itemMeta(config: ModuleConfig, item: RecordItem) {
  return config.detailFields
    .map((key) => {
      const value = displayValue(config, key, item[key]);
      return value ? `${labelFor(config, key)}：${value}` : null;
    })
    .filter(Boolean)
    .join('  ·  ');
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '🌙 夜深了，早点休息';
  if (hour < 10) return '☀️ 早上好，今天也要元气满满';
  if (hour < 14) return '🍲 中午好，记得好好吃饭';
  if (hour < 18) return '☕ 下午好，喝杯咖啡休息下吧';
  if (hour < 22) return '🌆 晚上好，今天辛苦啦';
  return '🌙 夜深了，早点休息';
};

export function CrudScreen({
  modules,
  initialModuleKey,
  title = 'SuperMe',
  renderModule,
  subtitle = '选择一个模块开始记录',
}: {
  modules: ModuleConfig[];
  initialModuleKey?: string;
  title?: string;
  subtitle?: string;
  renderModule?: (params: {
    module: ModuleConfig;
    siblingModules: ModuleConfig[];
    onBack: () => void;
    onSwitchModule: (key: string) => void;
  }) => React.ReactNode;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(initialModuleKey || null);
  const activeModule = useMemo(() => modules.find((module) => module.key === activeKey) || null, [activeKey, modules]);
  const moduleTiles = useMemo<ModuleTile[]>(() => {
    if (modules.length === 0 || modules.length % 2 === 0) return modules;
    return [...modules, { ...modules[0], key: '__module_placeholder__', placeholder: true }];
  }, [modules]);

  const handleSetActiveKey = (key: string | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveKey(key);
  };

  if (activeModule) {
    const customModule = renderModule?.({
      module: activeModule,
      siblingModules: modules,
      onBack: () => handleSetActiveKey(null),
      onSwitchModule: handleSetActiveKey,
    });

    if (customModule) {
      return customModule;
    }

    return (
      <CrudModule
        config={activeModule}
        siblingModules={modules}
        onBack={() => handleSetActiveKey(null)}
        onSwitchModule={handleSetActiveKey}
      />
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.bentoContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroGreeting}>{title === '日常' ? getGreeting() : title}</Text>
          <Text style={styles.heroDate}>{subtitle}</Text>
        </View>
        <View style={styles.bentoGrid}>
          {modules.map((item) => {
            const isLarge = item.key === 'todos' || item.key === 'finances';
            return (
              <Pressable
                key={item.key}
                onPress={() => handleSetActiveKey(item.key)}
                style={({ pressed }) => [
                  styles.bentoCard,
                  isLarge && styles.bentoCardLarge,
                  pressed && styles.pressed
                ]}
              >
                <LinearGradient
                  colors={[`${item.accent}25`, `${item.accent}05`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.bentoContent}>
                  <View style={[styles.bentoIconWrapper, { backgroundColor: `${item.accent}35` }]}>
                    <Ionicons name={item.icon} size={isLarge ? 32 : 26} color={item.accent} />
                  </View>
                  <View style={styles.bentoTextWrapper}>
                    <Text style={[styles.bentoTitle, isLarge && styles.bentoTitleLarge]}>{item.title}</Text>
                    <Text style={styles.bentoSubtitle} numberOfLines={1}>{item.subtitle || '开始记录'}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

function CrudModule({
  config,
  siblingModules,
  onBack,
  onSwitchModule,
}: {
  config: ModuleConfig;
  siblingModules: ModuleConfig[];
  onBack: () => void;
  onSwitchModule: (key: string) => void;
}) {
  const [items, setItems] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [form, setForm] = useState<FormState>(() => initialForm(config));
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiRequest<RecordItem[]>(config.endpoint);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [config.endpoint]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm(config));
    bottomSheetRef.current?.present();
  };

  const openEdit = (item: RecordItem) => {
    if (config.supportsUpdate === false) {
      Alert.alert('暂不支持编辑', '这个模块当前只能删除后重新创建。');
      return;
    }
    setEditing(item);
    setForm(initialForm(config, item));
    bottomSheetRef.current?.present();
  };

  const save = async () => {
    for (const field of config.fields) {
      if (field.required && !form[field.key]?.trim()) {
        Alert.alert('缺少信息', `请填写${field.label}`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = payloadFromForm(config, form);
      if (editing) {
        await apiRequest(`${config.endpoint.replace(/\/$/, '')}/${editing.id}`, { method: 'PUT', body: payload });
      } else {
        await apiRequest(config.endpoint, { method: 'POST', body: payload });
      }
      bottomSheetRef.current?.dismiss();
      await load();
    } catch (err) {
      Alert.alert('保存失败', err instanceof Error ? err.message : '请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const remove = (item: RecordItem) => {
    Alert.alert('删除确认', `确定删除「${getItemTitle(config, item)}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`${config.endpoint.replace(/\/$/, '')}/${item.id}`, { method: 'DELETE' });
            await load();
          } catch (err) {
            Alert.alert('删除失败', err instanceof Error ? err.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => {
      const haystack = `${getItemTitle(config, item)} ${itemMeta(config, item)}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [config, items, query]);

  return (
    <Screen>
      <Header
        title={config.title}
        subtitle={`${items.length} 条记录 · ${config.subtitle}`}
        action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />}
      />
      {!loading && !error && items.length > 0 ? (
        <View style={styles.searchBox}>
          <Field label="搜索" value={query} placeholder={`搜索${config.title}`} onChangeText={setQuery} />
        </View>
      ) : null}
      <StateView
        loading={loading}
        error={error}
        empty={!loading && (items.length === 0 || filteredItems.length === 0) ? (items.length === 0 ? config.emptyText : '没有匹配的记录') : undefined}
        onRetry={load}
      />
      {!loading && !error ? (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
          renderItem={({ item }) => {
            const imageUrl = buildAssetUrl(item.image_url);
            const renderRightActions = () => (
              <View style={styles.swipeActions}>
                <IconButton name="create-outline" label="编辑" onPress={() => openEdit(item)} />
                <IconButton name="trash-outline" label="删除" color={colors.danger} onPress={() => remove(item)} />
              </View>
            );

            return (
              <Swipeable renderRightActions={renderRightActions} containerStyle={styles.swipeContainer}>
                <Card>
                  <View style={styles.itemRow}>
                    {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.thumb} /> : (
                      <View style={[styles.itemIcon, { backgroundColor: `${config.accent}18` }]}>
                        <Ionicons name={config.icon} size={24} color={config.accent} />
                      </View>
                    )}
                    <Pressable style={styles.itemMain} onPress={() => openEdit(item)}>
                      <View style={styles.itemTitleRow}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{getItemTitle(config, item)}</Text>
                        {config.dateField && item[config.dateField] ? <Text style={styles.badge}>{String(item[config.dateField])}</Text> : null}
                      </View>
                      <Text style={styles.itemDetail} numberOfLines={3}>{itemMeta(config, item) || '点击编辑详情'}</Text>
                    </Pressable>
                  </View>
                </Card>
              </Swipeable>
            );
          }}
        />
      ) : null}

      <Pressable style={styles.fab} onPress={openCreate}>
        <LinearGradient
          colors={[`${config.accent}`, `${config.accent}dd`]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>

      <EditModal
        config={config}
        bottomSheetRef={bottomSheetRef}
        editing={editing}
        form={form}
        saving={saving}
        onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))}
        onClose={() => bottomSheetRef.current?.dismiss()}
        onSave={save}
      />
    </Screen>
  );
}

function EditModal({
  config,
  bottomSheetRef,
  editing,
  form,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  config: ModuleConfig;
  bottomSheetRef: React.RefObject<BottomSheetModal>;
  editing: RecordItem | null;
  form: FormState;
  saving: boolean;
  onChange: (key: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const pickImage = async (field: FieldConfig) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('需要权限', '请允许访问相册后再上传图片。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;

    try {
      const uploaded = await uploadImage(result.assets[0].uri);
      onChange(field.key, uploaded.url);
    } catch (err) {
      Alert.alert('上传失败', err instanceof Error ? err.message : '请稍后重试');
    }
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['85%']}
      index={0}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />}
      backgroundStyle={styles.bottomSheetBg}
      handleIndicatorStyle={styles.bottomSheetIndicator}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modal}>
        <BottomSheetScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle}>{editing ? '编辑记录' : '新增记录'}</Text>
          <Text style={styles.modalSubtitle}>{config.title}</Text>
          <View style={{ height: spacing.lg }} />
          {config.fields.map((field) => {
            if (field.type === 'select' || field.type === 'boolean') {
              const options = field.options || [];
              return (
                <View key={field.key} style={styles.formBlock}>
                  <Text style={styles.label}>{field.label}</Text>
                  <SegmentedControl value={form[field.key] || options[0]?.value || ''} options={options} onChange={(value) => onChange(field.key, value)} />
                </View>
              );
            }

            if (field.type === 'image') {
              const imageUrl = buildAssetUrl(form[field.key]);
              return (
                <View key={field.key} style={styles.formBlock}>
                  <Text style={styles.label}>{field.label}</Text>
                  {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.preview} /> : null}
                  <PrimaryButton label="选择并上传图片" icon="image-outline" tone="plain" onPress={() => pickImage(field)} />
                </View>
              );
            }

            if (field.type === 'date') {
              return (
                <DateField
                  key={field.key}
                  label={labelFor(config, field.key)}
                  value={form[field.key] || ''}
                  onChangeText={(value) => onChange(field.key, value)}
                  optional={!field.required}
                />
              );
            }

            return (
              <Field
                key={field.key}
                label={field.label}
                value={form[field.key] || ''}
                keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
                multiline={field.type === 'multiline'}
                onChangeText={(value) => onChange(field.key, value)}
              />
            );
          })}
        </BottomSheetScrollView>
        <View style={styles.modalFooter}>
          <PrimaryButton label="取消" tone="plain" onPress={onClose} />
          <View style={{ flex: 1 }}>
            <PrimaryButton label={saving ? '保存中' : '保存'} icon="checkmark" disabled={saving} onPress={onSave} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  bentoContainer: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 64 : spacing.xl,
    paddingBottom: spacing.xxl,
  },
  heroSection: {
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  heroGreeting: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  heroDate: {
    fontSize: 15,
    color: colors.textSoft,
    fontWeight: '600',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  bentoCard: {
    width: '47.5%',
    aspectRatio: 1.05,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    backgroundColor: colors.surface,
  },
  bentoCardLarge: {
    width: '100%',
    aspectRatio: 2.1,
  },
  bentoContent: {
    padding: spacing.lg,
    flex: 1,
    justifyContent: 'space-between',
  },
  bentoIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoTextWrapper: {
    gap: 4,
  },
  bentoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  bentoTitleLarge: {
    fontSize: 20,
  },
  bentoSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSoft,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  toolbar: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchBox: {
    paddingHorizontal: spacing.lg,
  },
  list: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: 0,
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  itemIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  itemMain: {
    flex: 1,
    gap: spacing.xs,
  },
  itemTitleRow: {
    gap: spacing.sm,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  itemDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  swipeContainer: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  swipeActions: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  thumb: {
    backgroundColor: colors.border,
    borderRadius: radius.md,
    height: 58,
    width: 58,
  },
  modal: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 68 : spacing.xxl,
    paddingBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  modalContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  modalFooter: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    ...shadow,
    elevation: 8,
    zIndex: 100,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetBg: {
    backgroundColor: colors.surface,
    borderRadius: 24,
  },
  bottomSheetIndicator: {
    backgroundColor: colors.border,
    width: 48,
    height: 6,
    borderRadius: 3,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  formBlock: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  preview: {
    backgroundColor: colors.border,
    borderRadius: radius.md,
    height: 180,
    marginBottom: spacing.md,
    width: '100%',
  },
});
