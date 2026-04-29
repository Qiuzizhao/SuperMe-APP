import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Field, FormSheet, PrimaryButton, SegmentedControl, StateView } from '@/src/shared/components';
import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../_shared/styles';
import { Item, ScreenShell, SectionCard, Tag, confirmRemove, useItems } from '../_shared/ReplicatedScreens';
import { createReading, deleteReading, listReadings, updateReading } from './api';

const readingStatus = { to_read: '想读', reading: '在读', finished: '已读' };

export function ReadingScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>(listReadings);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ title: '', author: '', status: 'to_read', rating: '5', notes: '' });
  const stats = { total: items.length, reading: items.filter((i) => i.status === 'reading').length, finished: items.filter((i) => i.status === 'finished').length };
  const open = (item?: Item) => {
    setEditing(item || null);
    setForm({ title: item?.title || '', author: item?.author || '', status: item?.status || 'to_read', rating: String(item?.rating || 5), notes: item?.notes || '' });
    bottomSheetRef.current?.present();
  };
  const save = async () => {
    if (editing) await updateReading(editing.id, { title: form.title.trim(), author: form.author.trim() || null, status: form.status, rating: form.status === 'finished' ? Number(form.rating) : null, notes: form.notes.trim() || null });
    else await createReading({ title: form.title.trim(), author: form.author.trim() || null, status: form.status, rating: form.status === 'finished' ? Number(form.rating) : null, notes: form.notes.trim() || null });
    bottomSheetRef.current?.dismiss();
    await load();
  };

  const remove = async () => {
    if (!editing) return;
    confirmRemove(editing.title, async () => {
      await deleteReading(editing.id);
      bottomSheetRef.current?.dismiss();
      await load();
    });
  };

  return (
    <ScreenShell title="阅读" subtitle="腹有诗书气自华" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <SectionCard style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: spacing.xl }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '800', marginBottom: 4 }}>总藏书量</Text>
            <Text style={{ fontSize: 28, color: colors.text, fontWeight: '900' }}>{stats.total}</Text>
          </View>
          <View style={{ width: 1, height: 40, backgroundColor: colors.border, opacity: 0.5 }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '800', marginBottom: 4 }}>正在阅读</Text>
            <Text style={{ fontSize: 28, color: colors.primary, fontWeight: '900' }}>{stats.reading}</Text>
          </View>
          <View style={{ width: 1, height: 40, backgroundColor: colors.border, opacity: 0.5 }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.success, fontWeight: '800', marginBottom: 4 }}>已读完</Text>
            <Text style={{ fontSize: 28, color: colors.success, fontWeight: '900' }}>{stats.finished}</Text>
          </View>
        </SectionCard>
        <StateView loading={loading} error={error} onRetry={load} />
        {items.map((item) => (
          <Pressable key={item.id} onLongPress={() => open(item)}>
            <SectionCard>
              <View style={styles.rowTop}>
                <View style={styles.flex}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.metaText}>{item.author || '未知作者'}</Text>
                  <View style={styles.tagRow}>
                    <Tag label={readingStatus[item.status as keyof typeof readingStatus] || item.status} tone={item.status === 'finished' ? 'green' : item.status === 'reading' ? 'blue' : 'orange'} />
                    {item.status === 'finished' && item.rating ? <Tag label={'★'.repeat(Number(item.rating)) + '☆'.repeat(5 - Number(item.rating))} tone="orange" /> : null}
                  </View>
                  {item.notes ? <Text style={styles.bodyText}>{item.notes}</Text> : null}
                </View>
              </View>
            </SectionCard>
          </Pressable>
        ))}
      </ScrollView>
      
      <Pressable style={styles.fab} onPress={() => open()}>
        <LinearGradient
          colors={['#8B5CF6', '#4338CA']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>

      <ReadingModal bottomSheetRef={bottomSheetRef} editing={editing} form={form} setForm={setForm} save={save} remove={remove} />
    </ScreenShell>
  );
}

function ReadingModal({ bottomSheetRef, editing, form, setForm, save, remove }: any) {
  return (
    <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
      <Text style={styles.sheetTitle}>{editing ? '编辑书籍' : '录入新书籍'}</Text>
      <View style={{ height: spacing.lg }} />
      <Field label="书名" value={form.title} onChangeText={(value) => setForm((cur: any) => ({ ...cur, title: value }))} />
      <Field label="作者" value={form.author} onChangeText={(value) => setForm((cur: any) => ({ ...cur, author: value }))} />
      <SegmentedControl value={form.status} onChange={(value) => setForm((cur: any) => ({ ...cur, status: value }))} options={Object.entries(readingStatus).map(([value, label]) => ({ value, label }))} />
      {form.status === 'finished' ? <SegmentedControl value={form.rating} onChange={(value) => setForm((cur: any) => ({ ...cur, rating: value }))} options={[1, 2, 3, 4, 5].map((value) => ({ label: `${value}星`, value: String(value) }))} /> : null}
      <Field label="笔记" value={form.notes} multiline onChangeText={(value) => setForm((cur: any) => ({ ...cur, notes: value }))} />
      <View style={styles.formActions}>
        {editing ? <PrimaryButton label="删除" tone="danger" onPress={remove} /> : null}
        <PrimaryButton label="取消" tone="plain" onPress={() => bottomSheetRef.current?.dismiss()} />
        <View style={{ flex: 1 }}>
          <PrimaryButton label={editing ? '保存修改' : '确认录入'} icon="checkmark" disabled={!form.title.trim()} onPress={() => void save()} />
        </View>
      </View>
    </FormSheet>
  );
}
