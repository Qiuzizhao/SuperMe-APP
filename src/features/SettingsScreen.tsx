import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Field, Header, IconButton, PrimaryButton, Screen, StateView } from '@/src/components/ui';
import { useAuth } from '@/src/auth/AuthContext';
import { API_URL, apiRequest } from '@/src/lib/api';
import { colors, radius, spacing } from '@/src/theme';

type FinanceBill = {
  id: number;
  name: string;
  categories: { id: number; name: string; subcategories: { id: number; name: string }[] }[];
};

export function SettingsScreen() {
  const { username, logout } = useAuth();
  const [bills, setBills] = useState<FinanceBill[]>([]);
  const [configsText, setConfigsText] = useState('{}');
  const [newBillName, setNewBillName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [tree, configs] = await Promise.all([
        apiRequest<FinanceBill[]>('/finances/tree/bills'),
        apiRequest<Record<string, unknown>>('/configs/'),
      ]);
      setBills(tree);
      setConfigsText(JSON.stringify(configs, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addBill = async () => {
    if (!newBillName.trim()) return;
    try {
      await apiRequest('/finances/tree/bills', { method: 'POST', body: { name: newBillName.trim() } });
      setNewBillName('');
      await load();
    } catch (err) {
      Alert.alert('新增失败', err instanceof Error ? err.message : '请稍后重试');
    }
  };

  const deleteBill = (bill: FinanceBill) => {
    Alert.alert('删除账本', `确定删除「${bill.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/finances/tree/bills/${bill.id}`, { method: 'DELETE' });
            await load();
          } catch (err) {
            Alert.alert('删除失败', err instanceof Error ? err.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const saveConfigs = async () => {
    try {
      const parsed = JSON.parse(configsText);
      await apiRequest('/configs/', { method: 'POST', body: parsed });
      Alert.alert('已保存', '配置已更新。');
    } catch (err) {
      Alert.alert('保存失败', err instanceof Error ? err.message : '请确认 JSON 格式正确');
    }
  };

  return (
    <Screen>
      <Header title="设置" subtitle="账户、API 和账本配置" />
      <StateView loading={loading} error={error} onRetry={load} />
      {!loading && !error ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
          contentContainerStyle={styles.content}>
          <Card>
            <View style={styles.accountRow}>
              <View style={styles.accountIcon}>
                <Ionicons name="person-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.accountMain}>
                <Text style={styles.sectionTitle}>{username || 'SuperMe'}</Text>
                <Text style={styles.metaText} numberOfLines={2}>{API_URL}</Text>
              </View>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>财务账本</Text>
            <Text style={styles.helperText}>账本用于支出分类。分类和子分类仍由后端现有接口维护。</Text>
            <View style={styles.addRow}>
              <View style={styles.inputWrap}>
                <Field label="新账本名称" value={newBillName} onChangeText={setNewBillName} />
              </View>
              <PrimaryButton label="新增" icon="add" onPress={addBill} />
            </View>
            <FlatList
              data={bills}
              scrollEnabled={false}
              keyExtractor={(item) => String(item.id)}
              ListEmptyComponent={<Text style={styles.metaText}>暂无账本</Text>}
              renderItem={({ item }) => (
                <View style={styles.billRow}>
                  <View style={styles.billMain}>
                    <Text style={styles.billName}>{item.name}</Text>
                    <Text style={styles.billMeta}>{item.categories.length} 个分类</Text>
                  </View>
                  <IconButton name="trash-outline" label="删除账本" color={colors.danger} onPress={() => deleteBill(item)} />
                </View>
              )}
            />
          </Card>

          <Card>
            <Pressable style={styles.advancedHeader} onPress={() => setShowAdvanced((value) => !value)}>
              <View>
                <Text style={styles.sectionTitle}>高级配置</Text>
                <Text style={styles.helperText}>直接编辑后端 configs JSON。格式不正确时不会保存。</Text>
              </View>
              <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={22} color={colors.muted} />
            </Pressable>
            {showAdvanced ? (
              <>
                <Field label="configs" value={configsText} multiline onChangeText={setConfigsText} />
                <PrimaryButton label="保存配置" icon="save-outline" onPress={saveConfigs} />
              </>
            ) : null}
          </Card>

          <PrimaryButton label="退出登录" tone="danger" icon="log-out-outline" onPress={() => void logout()} />
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: 0,
  },
  accountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  accountIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  accountMain: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  helperText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  metaText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  addRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  advancedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  inputWrap: {
    flex: 1,
  },
  billRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  billMain: {
    flex: 1,
  },
  billName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  billMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
});
