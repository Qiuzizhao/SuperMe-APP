import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { DateField, Field, FormSheet, PrimaryButton, StateView } from '@/src/shared/components';
import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../../daily/_shared/styles';
import { confirmRemove, Item, money, ScreenShell, SectionCard, SelectPills, Tag, today, useItems } from '../../daily/_shared/ReplicatedScreens';
import { createAsset, deleteAsset, listAssets, updateAsset } from './api';

const assetCategories = ['数码产品', '家用电器', '衣物鞋包', '交通工具', '家具家居', '其他'];
const assetStatus = {
  in_use: '在用',
  idle: '闲置',
  sold: '已售出',
  discarded: '已丢弃',
  retired: '已淘汰',
};

function assetStats(item: Item) {
  const purchase = new Date(item.purchase_date);
  const current = new Date();
  purchase.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  const daysUsed = Math.max(0, Math.floor((current.getTime() - purchase.getTime()) / 86400000));
  const actualDailyCost = Number(item.price || 0) / Math.max(1, daysUsed);
  return { daysUsed, actualDailyCost };
}

type AssetItem = Item & ReturnType<typeof assetStats>;

export function AssetScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>(listAssets);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ name: '', category: assetCategories[0], price: '', purchase_date: today(), lifespan_type: 'years', lifespan_value: '3', status: 'in_use', notes: '' });
  const processed: AssetItem[] = items.map((item) => ({ ...item, ...assetStats(item) }));
  const dashboard = processed.reduce((acc, item) => {
    if (['in_use', 'idle'].includes(item.status)) {
      acc.totalOriginal += Number(item.price || 0);
      acc.totalDailyCost += item.actualDailyCost;
    }
    return acc;
  }, { totalOriginal: 0, totalDailyCost: 0 });

  const open = (item?: Item) => {
    if (item) {
      setEditing(item);
      let lifespanType = 'days';
      let lifespanValue = String(item.expected_lifespan_days || 1);
      if (item.expected_lifespan_days % 365 === 0) {
        lifespanType = 'years';
        lifespanValue = String(item.expected_lifespan_days / 365);
      } else if (item.expected_lifespan_days % 30 === 0) {
        lifespanType = 'months';
        lifespanValue = String(item.expected_lifespan_days / 30);
      }
      setForm({ name: item.name || '', category: item.category || assetCategories[0], price: String(item.price || ''), purchase_date: item.purchase_date || today(), lifespan_type: lifespanType, lifespan_value: lifespanValue, status: item.status || 'in_use', notes: item.notes || '' });
    } else {
      setEditing(null);
      setForm({ name: '', category: assetCategories[0], price: '', purchase_date: today(), lifespan_type: 'years', lifespan_value: '3', status: 'in_use', notes: '' });
    }
    bottomSheetRef.current?.present();
  };
  const save = async () => {
    const factor = form.lifespan_type === 'years' ? 365 : form.lifespan_type === 'months' ? 30 : 1;
    const payload = { name: form.name.trim(), category: form.category, price: Number(form.price), purchase_date: form.purchase_date, expected_lifespan_days: Math.max(1, Number(form.lifespan_value || 1) * factor), status: form.status, notes: form.notes.trim() || null };
    if (editing) await updateAsset(editing.id, payload);
    else await createAsset(payload);
    bottomSheetRef.current?.dismiss();
    await load();
  };

  return (
    <ScreenShell title="归物" subtitle="掌控个人资产和每日持有成本" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <View style={styles.statsGrid}>
          <Stat label="资产总计" value={money(dashboard.totalOriginal)} subValue={`每日总成本: ${money(dashboard.totalDailyCost)}/天`} />
        </View>
        <StateView loading={loading} error={error} onRetry={load} />
        {processed.map((item) => (
          <Pressable key={item.id} onLongPress={() => open(item)}>
            <SectionCard>
              <View style={styles.rowTop}>
                <View style={styles.flex}>
                  <View style={styles.rowWrap}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Tag label={item.category} />
                    <Tag label={assetStatus[item.status as keyof typeof assetStatus] || item.status} tone={item.status === 'in_use' ? 'green' : 'orange'} />
                  </View>
                  <View style={[styles.rowWrap, { marginTop: 12, gap: 12 }]}>
                    <Text style={styles.metricValue}>{money(item.price)}</Text>
                    <Text style={styles.metaText}>•</Text>
                    <Text style={styles.metricValue}>{item.daysUsed} 天</Text>
                    <Text style={styles.metaText}>•</Text>
                    <Text style={styles.metricValue}>{money(item.actualDailyCost)}/天</Text>
                  </View>
                  {item.notes ? <Text style={[styles.bodyText, { marginTop: 8 }]} >{item.notes}</Text> : null}
                </View>
              </View>
            </SectionCard>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => open()}>
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>

      <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
        <Text style={styles.sheetTitle}>{editing ? '编辑资产' : '录入新资产'}</Text>
        <View style={{ height: spacing.lg }} />
        <Field label="物品名称" value={form.name} onChangeText={(value) => setForm((cur) => ({ ...cur, name: value }))} />
        <Text style={styles.formLabel}>分类</Text>
        <SelectPills value={form.category} options={assetCategories} onChange={(value) => setForm((cur) => ({ ...cur, category: value }))} accent="#CA8A04" />
        <Text style={styles.formLabel}>状态</Text>
        <SelectPills value={form.status} options={Object.keys(assetStatus).map((key) => ({ label: assetStatus[key as keyof typeof assetStatus], value: key }))} onChange={(value) => setForm((cur) => ({ ...cur, status: value }))} accent="#CA8A04" />
        <View style={styles.formRow}>
          <View style={styles.flex}>
            <Field label="购入价格" value={form.price} keyboardType="decimal-pad" onChangeText={(value) => setForm((cur) => ({ ...cur, price: value }))} />
          </View>
          <View style={styles.flex}>
            <DateField label="购入日期" value={form.purchase_date} onChangeText={(value) => setForm((cur) => ({ ...cur, purchase_date: value }))} />
          </View>
        </View>
        <View style={styles.formRow}>
          <View style={styles.flex}>
            <Field label="预计寿命数值" value={form.lifespan_value} keyboardType="number-pad" onChangeText={(value) => setForm((cur) => ({ ...cur, lifespan_value: value }))} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.formLabel}>寿命单位</Text>
            <SelectPills value={form.lifespan_type} onChange={(value) => setForm((cur) => ({ ...cur, lifespan_type: value }))} options={[{ label: '年', value: 'years' }, { label: '月', value: 'months' }, { label: '天', value: 'days' }]} accent="#CA8A04" />
          </View>
        </View>
        <Field label="备注" value={form.notes} multiline onChangeText={(value) => setForm((cur) => ({ ...cur, notes: value }))} />
        <View style={styles.formActions}>
          {editing && (
            <PrimaryButton label="删除" tone="danger" onPress={() => confirmRemove(editing.name, async () => { await deleteAsset(editing.id); bottomSheetRef.current?.dismiss(); await load(); })} />
          )}
          <PrimaryButton label="取消" tone="plain" onPress={() => bottomSheetRef.current?.dismiss()} />
          <View style={{ flex: 1 }}>
            <PrimaryButton label={editing ? '保存修改' : '确认录入'} icon="checkmark" disabled={!form.name.trim()} onPress={() => void save()} />
          </View>
        </View>
      </FormSheet>
    </ScreenShell>
  );
}

function Stat({ label, value, danger, subValue }: { label: string; value: string; danger?: boolean; subValue?: string }) {
  return (
    <SectionCard style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, danger && { color: colors.danger }]}>{value}</Text>
      {subValue ? <Text style={[styles.metaText, { marginTop: 2 }]}>{subValue}</Text> : null}
    </SectionCard>
  );
}
