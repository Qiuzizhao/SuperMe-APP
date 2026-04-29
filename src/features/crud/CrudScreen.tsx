import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, LayoutAnimation, Pressable } from 'react-native';

import { Header, IconButton, Screen } from '@/src/shared/components';
import { styles } from './styles';
import { createCrudItem, deleteCrudItem, listCrudItems, updateCrudItem } from './api';
import { CrudModulePicker, CrudRecordList, EditModal } from './components';
import type { CrudModuleProps, CrudScreenProps, FormState, RecordItem } from './types';
import { getItemTitle, initialForm, itemMeta, payloadFromForm } from './utils';

export function CrudScreen({
  modules,
  initialModuleKey,
  title = 'SuperMe',
  renderModule,
  subtitle = '选择一个模块开始记录',
}: CrudScreenProps) {
  const [activeKey, setActiveKey] = useState<string | null>(initialModuleKey || null);
  const activeModule = useMemo(() => modules.find((module) => module.key === activeKey) || null, [activeKey, modules]);

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

    if (customModule) return customModule;

    return <CrudModule config={activeModule} siblingModules={modules} onBack={() => handleSetActiveKey(null)} onSwitchModule={handleSetActiveKey} />;
  }

  return <CrudModulePicker modules={modules} title={title} subtitle={subtitle} onSelect={handleSetActiveKey} />;
}

function CrudModule({ config, siblingModules, onBack, onSwitchModule }: CrudModuleProps) {
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
      const data = await listCrudItems(config.endpoint);
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
      if (editing) await updateCrudItem(config.endpoint, editing.id, payload);
      else await createCrudItem(config.endpoint, payload);
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
            await deleteCrudItem(config.endpoint, item.id);
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
    return items.filter((item) => `${getItemTitle(config, item)} ${itemMeta(config, item)}`.toLowerCase().includes(keyword));
  }, [config, items, query]);

  return (
    <Screen>
      <Header title={config.title} subtitle={`${items.length} 条记录 · ${config.subtitle}`} action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />} />

      <CrudRecordList
        config={config}
        items={items}
        filteredItems={filteredItems}
        loading={loading}
        refreshing={refreshing}
        error={error}
        query={query}
        onQueryChange={setQuery}
        onRefresh={() => { setRefreshing(true); void load(); }}
        onRetry={load}
        onEdit={openEdit}
        onDelete={remove}
      />

      <Pressable style={styles.fab} onPress={openCreate}>
        <LinearGradient colors={[`${config.accent}`, `${config.accent}dd`]} style={styles.fabGradient}>
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
