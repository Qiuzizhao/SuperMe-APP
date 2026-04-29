import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Field, FormSheet, PrimaryButton, StateView } from '@/src/shared/components';
import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../_shared/styles';
import { Item, ScreenShell, SectionCard, SelectPills, Tag, confirmRemove, useItems } from '../_shared/ReplicatedScreens';
import { Detail, groupByDate } from '../_shared/logHelpers';
import { createTeaching, deleteTeaching, listTeachings, updateTeaching } from './api';

const courseTypes = ['科学', '信息', '课1', '课2', '劳动', '社团', '代课'];
const ratingLabels: Record<number, string> = { 5: '🌟 极佳', 4: '✨ 良好', 3: '👍 一般', 2: '⚠️ 较差', 1: '🆘 糟糕' };
const effectRatingOptions = [
  { value: '5', label: '🌟 极佳' },
  { value: '4', label: '✨ 良好' },
  { value: '3', label: '👍 一般' },
  { value: '2', label: '⚠️ 较差' },
  { value: '1', label: '🆘 糟糕' },
];
const emptyForm = { class_name: '', course_type: '科学', content: '', practice_content: '', effect_rating: '3', unexpected: '', reflection: '' };

export function TeachingScreen({ onBack }: { onBack: () => void }) {
  const { items, loading, refreshing, setRefreshing, error, load } = useItems<Item>(listTeachings);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState(emptyForm);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const groups = useMemo(() => groupByDate(items, (item) => item.created_at), [items]);

  const closeSheet = () => {
    setEditingItem(null);
    setForm(emptyForm);
    bottomSheetRef.current?.dismiss();
  };

  const openCreateSheet = () => {
    setEditingItem(null);
    setForm(emptyForm);
    bottomSheetRef.current?.present();
  };

  const openEditSheet = (item: Item) => {
    setEditingItem(item);
    setForm({
      class_name: item.class_name || '',
      course_type: item.course_type || '科学',
      content: item.content || '',
      practice_content: item.practice_content || '',
      effect_rating: String(item.effect_rating || 3),
      unexpected: item.unexpected || '',
      reflection: item.reflection || '',
    });
    bottomSheetRef.current?.present();
  };

  const save = async () => {
    if (!form.class_name.trim() || !form.content.trim()) return;
    const payload = {
      class_name: form.class_name.trim(),
      course_type: form.course_type,
      content: form.content.trim(),
      practice_content: form.practice_content.trim() || null,
      effect_rating: Number(form.effect_rating),
      unexpected: form.unexpected.trim() || null,
      reflection: form.reflection.trim() || null,
    };
    if (editingItem) await updateTeaching(editingItem.id, payload);
    else await createTeaching(payload);
    closeSheet();
    await load();
  };

  const remove = async () => {
    if (!editingItem) return;
    confirmRemove('课堂日志', async () => {
      await deleteTeaching(editingItem.id);
      closeSheet();
      await load();
    });
  };

  return (
    <ScreenShell title="课堂日志" subtitle="课堂、练习和复盘" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <StateView loading={loading} error={error} onRetry={load} />
        {groups.map((group) => (
          <View key={group.date} style={styles.group}>
            <Text style={styles.groupTitle}>{group.isToday ? '📅 今天' : `📅 ${group.date}`}</Text>
            {group.items.map((item) => {
              const isOpen = expanded === item.id;
              return (
                <Pressable key={item.id} onPress={() => setExpanded((cur) => (cur === item.id ? null : item.id))} onLongPress={() => openEditSheet(item)} delayLongPress={350}>
                  <SectionCard>
                    <View style={styles.rowTop}>
                      <View style={styles.flex}>
                        <View style={styles.rowWrap}>
                          <Text style={styles.itemTitle}>{item.class_name}</Text>
                          <Tag label={item.course_type} tone="blue" />
                          <Tag label={ratingLabels[item.effect_rating] || '👍 一般'} tone="purple" />
                        </View>
                        <Text style={styles.metaText} numberOfLines={1}>{item.content}</Text>
                      </View>
                      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={22} color={colors.muted} />
                    </View>
                    {isOpen ? (
                      <View style={styles.detailBlock}>
                        <Detail label="上课内容" value={item.content} />
                        <Detail label="完成练习" value={item.practice_content} tone="green" />
                        <Detail label="突发意外" value={item.unexpected} tone="red" />
                        <Detail label="教学反思" value={item.reflection} tone="blue" />
                      </View>
                    ) : null}
                  </SectionCard>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={openCreateSheet}>
        <LinearGradient colors={['#10B981', '#047857']} style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>

      <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.modalContent}>
        <Text style={styles.sheetTitle}>{editingItem ? '编辑课堂日志' : '记录课堂日志'}</Text>
        <View style={{ height: spacing.lg }} />
        <Field label="授课班级" value={form.class_name} placeholder="例如：高二3班" onChangeText={(value) => setForm((cur) => ({ ...cur, class_name: value }))} />
        <Text style={styles.formLabel}>效果评分</Text>
        <View style={styles.pills}>
          {effectRatingOptions.map((option) => {
            const selected = form.effect_rating === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setForm((cur) => ({ ...cur, effect_rating: option.value }))}
                style={[styles.pill, selected && { backgroundColor: '#7E22CE', borderColor: '#7E22CE' }]}
              >
                <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.formLabel}>课程类型</Text>
        <SelectPills value={form.course_type} options={courseTypes} onChange={(value) => setForm((cur) => ({ ...cur, course_type: value }))} accent="#4F46E5" />
        <Field label="上课内容" value={form.content} multiline placeholder="今天讲了哪些核心知识点？" onChangeText={(value) => setForm((cur) => ({ ...cur, content: value }))} />
        <Field label="完成练习" value={form.practice_content} multiline placeholder="学生做了哪些练习题？" onChangeText={(value) => setForm((cur) => ({ ...cur, practice_content: value }))} />
        <Field label="突发意外" value={form.unexpected} multiline placeholder="计划外情况" onChangeText={(value) => setForm((cur) => ({ ...cur, unexpected: value }))} />
        <Field label="教学反思" value={form.reflection} multiline placeholder="后续要改进什么？" onChangeText={(value) => setForm((cur) => ({ ...cur, reflection: value }))} />
        <View style={styles.formActions}>
          {editingItem ? <PrimaryButton label="删除" tone="danger" onPress={() => void remove()} /> : null}
          <PrimaryButton label="取消" tone="plain" onPress={closeSheet} />
          <View style={{ flex: 1 }}>
            <PrimaryButton label={editingItem ? '保存修改' : '保存'} icon="save-outline" disabled={!form.class_name.trim() || !form.content.trim()} onPress={() => void save()} />
          </View>
        </View>
      </FormSheet>
    </ScreenShell>
  );
}
