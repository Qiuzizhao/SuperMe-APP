import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { DateField, Field, FormSheet, PrimaryButton, StateView } from '@/src/shared/components';
import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../../daily/_shared/styles';
import { confirmRemove, Item, money, ScreenShell, SectionCard, SelectPills, Tag, today, useItems } from '../../daily/_shared/ReplicatedScreens';
import { createSubscription, deleteSubscription, listSubscriptions, updateSubscription } from './api';

const cycles = [
  { label: '每月', value: 'monthly', factor: 1 },
  { label: '每季度', value: 'quarterly', factor: 1 / 3 },
  { label: '每年', value: 'yearly', factor: 1 / 12 },
];

export function SubscriptionScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>(listSubscriptions);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ name: '', amount: '', cycle: 'monthly', next_billing_date: today(), category: '', notes: '', is_active: 'true' });
  const monthlyTotal = items.filter((item) => item.is_active).reduce((sum, item) => sum + Number(item.amount || 0) * (cycles.find((cycle) => cycle.value === item.cycle)?.factor || 0), 0);

  const reset = () => {
    setEditing(null);
    setForm({ name: '', amount: '', cycle: 'monthly', next_billing_date: today(), category: '', notes: '', is_active: 'true' });
    bottomSheetRef.current?.dismiss();
  };
  const save = async () => {
    if (!form.name.trim() || Number(form.amount) <= 0) return;
    const payload = { name: form.name.trim(), amount: Number(form.amount), cycle: form.cycle, next_billing_date: form.next_billing_date, category: form.category.trim() || null, notes: form.notes.trim() || null, is_active: form.is_active === 'true' };
    if (editing) await updateSubscription(editing.id, payload);
    else await createSubscription(payload);
    reset();
    await load();
  };

  const openForm = (item?: Item) => {
    if (item) {
      setEditing(item);
      setForm({ name: item.name || '', amount: String(item.amount || ''), cycle: item.cycle || 'monthly', next_billing_date: item.next_billing_date || today(), category: item.category || '', notes: item.notes || '', is_active: item.is_active ? 'true' : 'false' });
    } else {
      setEditing(null);
      setForm({ name: '', amount: '', cycle: 'monthly', next_billing_date: today(), category: '', notes: '', is_active: 'true' });
    }
    bottomSheetRef.current?.present();
  };
  const remove = async () => {
    if (!editing) return;
    confirmRemove(editing.name, async () => {
      await deleteSubscription(editing.id);
      bottomSheetRef.current?.dismiss();
      await load();
    });
  };

  return (
    <ScreenShell title="订阅" subtitle={`每月订阅总额 ${money(monthlyTotal)}`} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <StateView loading={loading} error={error} onRetry={load} />
        {items.map((item) => (
          <Pressable key={item.id} onLongPress={() => openForm(item)}>
            <SectionCard>
              <View style={styles.rowTop}>
                <View style={styles.flex}>
                  <View style={styles.rowWrap}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Tag label={item.is_active ? '已启用' : '已停用'} tone={item.is_active ? 'green' : 'gray'} />
                    {item.category ? <Tag label={item.category} tone="blue" /> : null}
                  </View>
                  <Text style={styles.metaText}>{cycles.find((cycle) => cycle.value === item.cycle)?.label || item.cycle} · 下次扣费 {item.next_billing_date}</Text>
                  {item.notes ? <Text style={styles.bodyText}>{item.notes}</Text> : null}
                </View>
                <View style={{ justifyContent: 'center', alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: colors.danger }}>{money(item.amount)}</Text>
                </View>
              </View>
            </SectionCard>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => openForm()}>
        <LinearGradient
          colors={['#F43F5E', '#BE123C']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>

      <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
        <Text style={styles.sheetTitle}>{editing ? '编辑订阅' : '新增订阅'}</Text>
        <View style={{ height: spacing.lg }} />
        <Field label="订阅名称" value={form.name} placeholder="如：Spotify 家庭版" onChangeText={(value) => setForm((cur) => ({ ...cur, name: value }))} />
        <View style={styles.formRow}>
          <View style={styles.flex}>
            <Field label="金额" value={form.amount} keyboardType="decimal-pad" onChangeText={(value) => setForm((cur) => ({ ...cur, amount: value }))} />
          </View>
          <View style={styles.flex}>
            <DateField label="下次扣费日期" value={form.next_billing_date} onChangeText={(value) => setForm((cur) => ({ ...cur, next_billing_date: value }))} />
          </View>
        </View>
        <Text style={styles.formLabel}>周期</Text>
        <SelectPills value={form.cycle} onChange={(value) => setForm((cur) => ({ ...cur, cycle: value }))} options={cycles} accent="#0D9488" />
        <Text style={styles.formLabel}>状态</Text>
        <SelectPills value={form.is_active} onChange={(value) => setForm((cur) => ({ ...cur, is_active: value }))} options={[{ label: '启用', value: 'true' }, { label: '停用', value: 'false' }]} accent="#0D9488" />
        <Field label="分类" value={form.category} placeholder="视频 / 音乐 / 软件" onChangeText={(value) => setForm((cur) => ({ ...cur, category: value }))} />
        <Field label="备注" value={form.notes} multiline onChangeText={(value) => setForm((cur) => ({ ...cur, notes: value }))} />
        <View style={styles.formActions}>
          {editing ? <PrimaryButton label="删除" icon="trash-outline" tone="danger" onPress={remove} /> : null}
          <PrimaryButton label="取消" tone="plain" onPress={() => bottomSheetRef.current?.dismiss()} />
          <View style={{ flex: 1 }}>
            <PrimaryButton label={editing ? '保存修改' : '新增订阅'} icon="save-outline" disabled={!form.name.trim() || Number(form.amount) <= 0} onPress={() => void save()} />
          </View>
        </View>
      </FormSheet>
    </ScreenShell>
  );
}
