import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateField, Field, Header, IconButton, PrimaryButton, Screen, StateView } from '@/src/components/ui';
import { apiRequest } from '@/src/lib/api';
import { colors, radius, shadow, spacing } from '@/src/theme';

type TodoCategory = 'work' | 'life' | 'calendar';

type TodoItem = {
  id: number;
  title: string;
  description?: string | null;
  category: 'work' | 'life';
  is_completed: boolean;
  due_date?: string | null;
  due_time?: string | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

type EditForm = {
  title: string;
  due_date: string;
  due_time: string;
  location: string;
  description: string;
};

const categories: { label: string; value: TodoCategory; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { label: '工作', value: 'work', icon: 'briefcase-outline', color: colors.primary },
  { label: '生活', value: 'life', icon: 'home-outline', color: colors.success },
  { label: '日历', value: 'calendar', icon: 'calendar-outline', color: colors.warning },
];

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const weekNames = ['日', '一', '二', '三', '四', '五', '六'];

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function generateCalendarDays(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDays = daysInMonth(prevYear, prevMonth);
  const result: { day: number; date: string; currentMonth: boolean }[] = [];

  for (let i = 0; i < firstDay; i += 1) {
    const day = prevDays - firstDay + i + 1;
    result.push({ day, date: toDateString(new Date(prevYear, prevMonth, day)), currentMonth: false });
  }

  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    result.push({ day, date: toDateString(new Date(year, month, day)), currentMonth: true });
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let day = 1; result.length < 42; day += 1) {
    result.push({ day, date: toDateString(new Date(nextYear, nextMonth, day)), currentMonth: false });
  }

  return result;
}

function formatShortDate(value?: string | null) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return year === String(new Date().getFullYear()) ? `${month}-${day}` : value;
}

function dueTag(value?: string | null) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return { label: '今天', style: styles.tagToday };
  if (diffDays === 1) return { label: '明天', style: styles.tagTomorrow };
  if (diffDays < 0) return { label: '过期', style: styles.tagOverdue };
  return null;
}

function emptyEditForm(todo?: TodoItem | null): EditForm {
  return {
    title: todo?.title || '',
    due_date: todo?.due_date || '',
    due_time: todo?.due_time || '',
    location: todo?.location || '',
    description: todo?.description || '',
  };
}

export function TodoScreen({ onBack }: { onBack: () => void }) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<TodoCategory>('work');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [editForm, setEditForm] = useState<EditForm>(() => emptyEditForm());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    setError(null);
    try {
      // If calendar is selected, we might want to fetch all or default to a view. Let's fetch all for calendar to see all tasks on dots.
      const queryCategory = activeCategory === 'calendar' ? '' : `?category=${activeCategory}`;
      const data = await apiRequest<TodoItem[]>(`/todos/${queryCategory}`);
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载待办失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    setLoading(true);
    setSelectedTodo(null);
    setEditForm(emptyEditForm());
    void loadTodos();
  }, [loadTodos]);

  const calendarDays = useMemo(() => generateCalendarDays(currentDate), [currentDate]);
  const todayString = useMemo(() => toDateString(new Date()), []);
  const filteredTodos = selectedDate ? todos.filter((todo) => todo.due_date === selectedDate) : todos;
  const pendingCount = todos.filter((todo) => !todo.is_completed).length;

  const addTodo = async () => {
    const title = newTitle.trim();
    if (!title) return;

    setSaving(true);
    try {
      await apiRequest('/todos/', {
        method: 'POST',
        body: {
          title,
          category: activeCategory === 'calendar' ? 'work' : activeCategory,
          is_completed: false,
          due_date: selectedDate,
        },
      });
      setNewTitle('');
      await loadTodos();
    } catch (err) {
      Alert.alert('新增失败', err instanceof Error ? err.message : '请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = async (todo: TodoItem) => {
    try {
      const updated = await apiRequest<TodoItem>(`/todos/${todo.id}`, {
        method: 'PUT',
        body: { is_completed: !todo.is_completed },
      });
      setTodos((current) => current.map((item) => (item.id === todo.id ? updated : item)));
      setSelectedTodo((current) => (current?.id === todo.id ? updated : current));
    } catch (err) {
      Alert.alert('更新失败', err instanceof Error ? err.message : '请稍后重试');
    }
  };

  const deleteTodo = (todo: TodoItem) => {
    Alert.alert('删除确认', `确定删除「${todo.title}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/todos/${todo.id}`, { method: 'DELETE' });
            if (selectedTodo?.id === todo.id) setSelectedTodo(null);
            await loadTodos();
          } catch (err) {
            Alert.alert('删除失败', err instanceof Error ? err.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const selectTodo = (todo: TodoItem) => {
    if (selectedTodo?.id === todo.id) {
      setSelectedTodo(null);
      setEditForm(emptyEditForm());
      return;
    }
    setSelectedTodo(todo);
    setEditForm(emptyEditForm(todo));
  };

  const saveDetails = async () => {
    if (!selectedTodo) return;
    if (!editForm.title.trim()) {
      Alert.alert('缺少标题', '请填写待办标题');
      return;
    }

    setSaving(true);
    try {
      const updated = await apiRequest<TodoItem>(`/todos/${selectedTodo.id}`, {
        method: 'PUT',
        body: {
          title: editForm.title.trim(),
          due_date: editForm.due_date.trim() || null,
          due_time: editForm.due_time.trim() || null,
          location: editForm.location.trim() || null,
          description: editForm.description.trim() || null,
        },
      });
      setSelectedTodo(updated);
      setEditForm(emptyEditForm(updated));
      await loadTodos();
      Alert.alert('保存成功', '待办详情已更新');
    } catch (err) {
      Alert.alert('保存失败', err instanceof Error ? err.message : '请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const activeColor = categories.find((item) => item.value === activeCategory)?.color || colors.primary;

  const headerSubtitle = useMemo(() => {
    if (activeCategory === 'calendar') {
      return `${todos.length} 项日程 · 日历视图`;
    }
    return `${pendingCount} 项待处理 · ${activeCategory === 'work' ? '工作清单' : '生活清单'}`;
  }, [activeCategory, pendingCount, todos.length]);

  return (
    <Screen>
      <Header
        title="待办"
        subtitle={headerSubtitle}
        action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadTodos(); }} />}>
        <View style={styles.categoryTabs}>
          {categories.map((category) => {
            const selected = category.value === activeCategory;
            return (
              <Pressable
                key={category.value}
                onPress={() => {
                  setActiveCategory(category.value);
                  setSelectedDate(null);
                }}
                style={[styles.categoryTab, selected && { backgroundColor: category.color }]}>
                <Ionicons name={category.icon} size={17} color={selected ? '#fff' : category.color} />
                <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{category.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {activeCategory !== 'calendar' ? (
          <View style={styles.quickAdd}>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder={`添加一个新的${activeCategory === 'life' ? '生活' : '工作'}待办...`}
              placeholderTextColor={colors.faint}
              returnKeyType="done"
              onSubmitEditing={addTodo}
              style={styles.quickInput}
            />
            <Pressable
              accessibilityRole="button"
              onPress={addTodo}
              disabled={saving || !newTitle.trim()}
              style={[styles.addButton, { backgroundColor: activeColor }, (saving || !newTitle.trim()) && styles.disabled]}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>
        ) : null}
        {selectedDate ? (
          <View style={styles.selectedDateRow}>
            <Text style={styles.selectedDateText}>将默认添加至：{selectedDate}</Text>
            <Pressable onPress={() => setSelectedDate(null)} hitSlop={8}>
              <Text style={styles.clearDate}>清除筛选</Text>
            </Pressable>
          </View>
        ) : null}

        <StateView loading={loading} error={error} onRetry={loadTodos} />

        {activeCategory === 'calendar' ? (
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>日历日程</Text>
              <View style={styles.monthControl}>
                <IconButton
                  name="chevron-back"
                  label="上个月"
                  onPress={() => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
                />
                <Text style={styles.monthText}>{currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}</Text>
                <IconButton
                  name="chevron-forward"
                  label="下个月"
                  onPress={() => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
                />
              </View>
            </View>
            <View style={styles.weekRow}>
              {weekNames.map((day) => (
                <Text key={day} style={styles.weekText}>周{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((day) => {
                const dayTodos = todos.filter((todo) => todo.due_date === day.date);
                const isToday = day.date === todayString;
                const isSelected = day.date === selectedDate;
                return (
                  <Pressable
                    key={day.date}
                    onPress={() => setSelectedDate((current) => (current === day.date ? null : day.date))}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected, !day.currentMonth && styles.dayCellMuted]}>
                    <Text style={[styles.dayNumber, isToday && styles.todayNumber, isSelected && styles.selectedDayNumber]}>{day.day}</Text>
                    <View style={styles.dayTodoDots}>
                      {dayTodos.slice(0, 2).map((todo) => (
                        <Pressable
                          key={todo.id}
                          onPress={(event) => {
                            event.stopPropagation();
                            selectTodo(todo);
                            setSelectedDate(day.date);
                          }}
                          style={[styles.dayTodoDot, { backgroundColor: todo.is_completed ? colors.faint : (todo.category === 'life' ? colors.success : colors.primary) }]}
                        />
                      ))}
                      {dayTodos.length > 2 ? <Text style={styles.moreDots}>+{dayTodos.length - 2}</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {!loading && !error && (activeCategory !== 'calendar' || selectedDate) ? (
          <View style={[styles.todoList, activeCategory === 'calendar' && { marginTop: spacing.lg }]}>
            {filteredTodos.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={36} color={colors.faint} />
                <Text style={styles.emptyTitle}>暂无待办事项</Text>
                <Text style={styles.emptyText}>{selectedDate ? '所选日期还没有待办事项' : '今天很轻松，先加一件要处理的事吧'}</Text>
              </View>
            ) : (
              filteredTodos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  selected={selectedTodo?.id === todo.id}
                  activeColor={activeCategory === 'calendar' ? (todo.category === 'life' ? colors.success : colors.primary) : activeColor}
                  editForm={editForm}
                  saving={saving}
                  onToggle={() => void toggleTodo(todo)}
                  onDelete={() => deleteTodo(todo)}
                  onSelect={() => selectTodo(todo)}
                  onChange={(key, value) => setEditForm((current) => ({ ...current, [key]: value }))}
                  onCancel={() => {
                    setSelectedTodo(null);
                    setEditForm(emptyEditForm());
                  }}
                  onSave={saveDetails}
                />
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function TodoCard({
  todo,
  selected,
  activeColor,
  editForm,
  saving,
  onToggle,
  onDelete,
  onSelect,
  onChange,
  onCancel,
  onSave,
}: {
  todo: TodoItem;
  selected: boolean;
  activeColor: string;
  editForm: EditForm;
  saving: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSelect: () => void;
  onChange: (key: keyof EditForm, value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const tag = dueTag(todo.due_date);

  return (
    <View style={[styles.todoCard, selected && { borderColor: activeColor }]}>
      <Pressable onPress={onSelect} style={styles.todoHeader}>
        <Pressable onPress={onToggle} hitSlop={8} style={[styles.checkCircle, todo.is_completed && { backgroundColor: activeColor, borderColor: activeColor }]}>
          {todo.is_completed ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
        </Pressable>
        <View style={styles.todoMain}>
          <Text style={[styles.todoTitle, todo.is_completed && styles.todoCompleted]} numberOfLines={2}>{todo.title}</Text>
          {(todo.due_date || todo.due_time || todo.location) ? (
            <View style={styles.metaRow}>
              {tag ? <Text style={[styles.dueTag, tag.style]}>{tag.label}</Text> : null}
              {todo.due_date || todo.due_time ? (
                <Text style={styles.metaText}>⏰ {formatShortDate(todo.due_date)}{todo.due_time ? ` ${todo.due_time}` : ''}</Text>
              ) : null}
              {todo.location ? <Text style={styles.metaText} numberOfLines={1}>📍 {todo.location}</Text> : null}
            </View>
          ) : null}
        </View>
        <IconButton name="trash-outline" label="删除" color={colors.danger} onPress={onDelete} />
      </Pressable>

      {selected ? (
        <View style={styles.detailForm}>
          <Field label="标题" value={editForm.title} onChangeText={(value) => onChange('title', value)} />
          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <DateField label="日期" value={editForm.due_date} onChangeText={(value) => onChange('due_date', value)} optional />
            </View>
            <View style={styles.formColumn}>
              <Field label="时间" value={editForm.due_time} placeholder="例如：下午2点" onChangeText={(value) => onChange('due_time', value)} />
            </View>
          </View>
          <Field label="地点" value={editForm.location} placeholder="例如：办公室" onChangeText={(value) => onChange('location', value)} />
          <Field
            label="备注说明"
            value={editForm.description}
            placeholder="添加更多详细说明..."
            multiline
            onChangeText={(value) => onChange('description', value)}
          />
          <View style={styles.formActions}>
            <PrimaryButton label="取消" tone="plain" onPress={onCancel} />
            <PrimaryButton label={saving ? '保存中' : '保存修改'} icon="checkmark" disabled={saving} onPress={onSave} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryTab: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    ...shadow,
  },
  categoryText: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '900',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  quickAdd: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  quickInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    ...shadow,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  disabled: {
    opacity: 0.45,
  },
  selectedDateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  selectedDateText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  clearDate: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  todoList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.xs,
    padding: spacing.xl,
    ...shadow,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  todoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadow,
  },
  todoHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  checkCircle: {
    alignItems: 'center',
    borderColor: colors.faint,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  todoMain: {
    flex: 1,
    gap: spacing.xs,
  },
  todoTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  todoCompleted: {
    color: colors.faint,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  dueTag: {
    borderRadius: radius.sm,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagToday: {
    backgroundColor: colors.successSoft,
    color: colors.success,
  },
  tagTomorrow: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
  },
  tagOverdue: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
  },
  detailForm: {
    backgroundColor: colors.surfaceMuted,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.md,
  },
  formRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: spacing.md,
  },
  formColumn: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadow,
  },
  calendarHeader: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  calendarTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  monthControl: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  monthText: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: '900',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekText: {
    color: colors.muted,
    flex: 1,
    fontSize: 11,
    fontWeight: '900',
    paddingBottom: spacing.sm,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
  },
  dayCell: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    minHeight: 58,
    padding: 5,
    width: '14.08%',
  },
  dayCellSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  dayCellMuted: {
    opacity: 0.45,
  },
  dayNumber: {
    alignSelf: 'flex-end',
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 20,
    textAlign: 'center',
    width: 20,
  },
  todayNumber: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    color: '#fff',
    overflow: 'hidden',
  },
  selectedDayNumber: {
    color: colors.primaryDark,
  },
  dayTodoDots: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 'auto',
  },
  dayTodoDot: {
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  moreDots: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
  },
});
