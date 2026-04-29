import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { DateField, Field, FormSheet, PrimaryButton, SegmentedControl, StateView } from '@/src/shared/components';
import { spacing } from '@/src/shared/theme';
import { styles } from '../_shared/styles';
import { Item, ScreenShell, confirmRemove, today, useItems } from '../_shared/ReplicatedScreens';
import { GroupedLogList, groupByDate } from '../_shared/logHelpers';
import { createWorkLog, deleteWorkLog, listWorkLogs, updateWorkLog } from './api';

export function WorkLogScreen({ onBack }: { onBack: () => void }) {
  const createWorkLogForm = () => ({ record: '', activity_name: '', event_date: today(), event_time: '', location: '', notes: '' });
  const getWorkLogFormFromItem = (item: Item) => {
    const eventDate = String(item.event_time || '').slice(0, 10);
    const eventTime = String(item.event_time || '').slice(11, 16);
    return {
      record: item.record || '',
      activity_name: item.activity_name || '',
      event_date: eventDate || today(),
      event_time: eventTime,
      location: item.location || '',
      notes: item.notes || '',
    };
  };
  const [type, setType] = useState('daily');
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>(() => listWorkLogs(type));
  const [form, setForm] = useState(createWorkLogForm);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const groups = useMemo(() => groupByDate(items, (item) => item.event_time || item.created_at), [items]);
  const save = async () => {
    if (!form.record.trim()) return;
    const payload = {
      log_type: type,
      record: form.record.trim(),
      activity_name: form.activity_name.trim() || null,
      event_time: form.event_date ? `${form.event_date}T${form.event_time || '00:00'}` : null,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
    };
    if (editingItem) await updateWorkLog(editingItem.id, payload);
    else await createWorkLog(payload);
    setForm(createWorkLogForm());
    bottomSheetRef.current?.dismiss();
    setEditingItem(null);
    await load();
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm(createWorkLogForm());
    bottomSheetRef.current?.present();
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setForm(getWorkLogFormFromItem(item));
    bottomSheetRef.current?.present();
  };

  const closeModal = () => {
    bottomSheetRef.current?.dismiss();
    setEditingItem(null);
    setForm(createWorkLogForm());
  };

  const remove = async () => {
    if (!editingItem) return;
    confirmRemove(editingItem.activity_name || editingItem.record || '工作日志', async () => {
      await deleteWorkLog(editingItem.id);
      closeModal();
      await load();
    });
  };

  return (
    <ScreenShell title="工作日志" subtitle="日常工作与活动安排" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <SegmentedControl value={type} onChange={setType} options={[{ label: '日常记录', value: 'daily' }, { label: '活动记录', value: 'activity' }]} />
        
        <StateView loading={loading} error={error} onRetry={load} />
        <GroupedLogList groups={groups} onLongPress={openEdit} />
      </ScrollView>

      <Pressable style={styles.fab} onPress={openCreate}>
        <LinearGradient
          colors={['#0EA5E9', '#1D4ED8']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>

      <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
        <Text style={styles.sheetTitle}>{editingItem ? "编辑工作日志" : "记录工作日志"}</Text>
        <View style={{ height: spacing.lg }} />
        <Field label="活动名" value={form.activity_name} placeholder={type === 'activity' ? '例如：家长会、教研活动' : '例如：备课、批改作业'} onChangeText={(value) => setForm((cur) => ({ ...cur, activity_name: value }))} />
        <View style={styles.formRow}>
          <View style={styles.flex}>
            <DateField label="日期" value={form.event_date} onChangeText={(value) => setForm((cur) => ({ ...cur, event_date: value }))} />
          </View>
          <View style={styles.flex}>
            <Field label="时间" value={form.event_time} placeholder="HH:mm" onChangeText={(value) => setForm((cur) => ({ ...cur, event_time: value }))} />
          </View>
        </View>
        <Field label="地点" value={form.location} placeholder="会议室 / 高二3班" onChangeText={(value) => setForm((cur) => ({ ...cur, location: value }))} />
        <Field label="记录" value={form.record} multiline placeholder="记录今天的工作内容..." onChangeText={(value) => setForm((cur) => ({ ...cur, record: value }))} />
        <Field label="备注" value={form.notes} multiline placeholder="补充说明" onChangeText={(value) => setForm((cur) => ({ ...cur, notes: value }))} />
        <View style={styles.formActions}>
          {editingItem ? <PrimaryButton label="删除" tone="danger" onPress={() => void remove()} /> : null}
          <PrimaryButton label="取消" tone="plain" onPress={closeModal} />
          <View style={{ flex: 1 }}>
            <PrimaryButton label={editingItem ? "保存修改" : "保存"} icon="save-outline" disabled={!form.record.trim()} onPress={() => void save()} />
          </View>
        </View>
      </FormSheet>
    </ScreenShell>
  );
}
