import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';

import { Header, IconButton, Screen, StateView } from '@/src/shared/components';
import { colors, spacing } from '@/src/shared/theme';
import { createTodo, deleteTodo as deleteTodoRequest, listTodos, updateTodo } from './api';
import { TodoCalendar, TodoCard, TodoEditSheet, TodoEditorSheet } from './components';
import { todoCategories } from './constants';
import { styles } from './styles';
import type { TodoCategory, TodoEditForm, TodoItem } from './types';
import { emptyEditForm, generateCalendarDays, toDateString } from './utils';

export function TodoScreen({ onBack }: { onBack: () => void }) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<TodoCategory>('work');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [editForm, setEditForm] = useState<TodoEditForm>(() => emptyEditForm());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createSheetRef = useRef<BottomSheetModal>(null);
  const editSheetRef = useRef<BottomSheetModal>(null);

  const loadTodos = useCallback(async () => {
    setError(null);
    try {
      const data = await listTodos(activeCategory);
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
    setEditingTodo(null);
    setEditForm(emptyEditForm());
    void loadTodos();
  }, [loadTodos]);

  const calendarDays = useMemo(() => generateCalendarDays(currentDate), [currentDate]);
  const todayString = useMemo(() => toDateString(new Date()), []);
  const filteredTodos = selectedDate ? todos.filter((todo) => todo.due_date === selectedDate) : todos;
  const activeColor = todoCategories.find((item) => item.value === activeCategory)?.color || colors.primary;

  const addTodo = async () => {
    const title = newTitle.trim();
    if (!title) return;

    setSaving(true);
    try {
      await createTodo({
        title,
        category: activeCategory === 'calendar' ? 'work' : activeCategory,
        is_completed: false,
        due_date: selectedDate,
        due_time: editForm.due_time.trim() || null,
        location: editForm.location.trim() || null,
        description: editForm.description.trim() || null,
      });
      setNewTitle('');
      setEditForm(emptyEditForm());
      await loadTodos();
    } catch (err) {
      Alert.alert('新增失败', err instanceof Error ? err.message : '请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = async (todo: TodoItem) => {
    try {
      const updated = await updateTodo(todo.id, { is_completed: !todo.is_completed });
      setTodos((current) => current.map((item) => (item.id === todo.id ? updated : item)));
      setEditingTodo((current) => (current?.id === todo.id ? updated : current));
    } catch (err) {
      Alert.alert('更新失败', err instanceof Error ? err.message : '请稍后重试');
    }
  };

  const closeEditSheet = () => {
    setEditingTodo(null);
    setEditForm(emptyEditForm());
    editSheetRef.current?.dismiss();
  };

  const deleteTodo = (todo: TodoItem) => {
    Alert.alert('删除确认', `确定删除「${todo.title}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTodoRequest(todo.id);
            if (editingTodo?.id === todo.id) closeEditSheet();
            await loadTodos();
          } catch (err) {
            Alert.alert('删除失败', err instanceof Error ? err.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const openEditSheet = (todo: TodoItem) => {
    setEditingTodo(todo);
    setEditForm(emptyEditForm(todo));
    editSheetRef.current?.present();
  };

  const saveDetails = async () => {
    if (!editingTodo) return;
    if (!editForm.title.trim()) {
      Alert.alert('缺少标题', '请填写待办标题');
      return;
    }

    setSaving(true);
    try {
      await updateTodo(editingTodo.id, {
        title: editForm.title.trim(),
        due_date: editForm.due_date.trim() || null,
        due_time: editForm.due_time.trim() || null,
        location: editForm.location.trim() || null,
        description: editForm.description.trim() || null,
      });
      await loadTodos();
      closeEditSheet();
      Alert.alert('保存成功', '待办详情已更新');
    } catch (err) {
      Alert.alert('保存失败', err instanceof Error ? err.message : '请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const updateEditForm = (key: keyof TodoEditForm, value: string) => {
    setEditForm((current) => ({ ...current, [key]: value }));
  };

  const openCreateSheet = () => {
    setNewTitle('');
    createSheetRef.current?.present();
  };

  return (
    <Screen>
      <Header title="待办" action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadTodos(); }} />}
      >
        <View style={styles.categoryTabs}>
          {todoCategories.map((category) => {
            const selected = category.value === activeCategory;
            return (
              <Pressable
                key={category.value}
                onPress={() => {
                  setActiveCategory(category.value);
                  setSelectedDate(null);
                }}
                style={[styles.categoryTab, selected && { backgroundColor: category.color }]}
              >
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
              onSubmitEditing={openCreateSheet}
              style={styles.quickInput}
            />
            <Pressable
              accessibilityRole="button"
              onPress={openCreateSheet}
              disabled={saving || !newTitle.trim()}
              style={[styles.addButton, { backgroundColor: activeColor }, (saving || !newTitle.trim()) && styles.disabled]}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>
        ) : null}

        <StateView loading={loading} error={error} onRetry={loadTodos} />

        {activeCategory === 'calendar' ? (
          <TodoCalendar
            currentDate={currentDate}
            calendarDays={calendarDays}
            todos={todos}
            selectedDate={selectedDate}
            todayString={todayString}
            onPreviousMonth={() => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
            onNextMonth={() => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
            onSelectDate={(date) => setSelectedDate((current) => (current === date ? null : date))}
            onSelectTodo={(_todo, date) => {
              setSelectedDate(date);
            }}
          />
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
                  activeColor={activeCategory === 'calendar' ? (todo.category === 'life' ? colors.success : colors.primary) : activeColor}
                  onToggle={() => void toggleTodo(todo)}
                  onDelete={() => deleteTodo(todo)}
                  onSelect={() => openEditSheet(todo)}
                />
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <Pressable style={styles.fab} onPress={openCreateSheet}>
        <LinearGradient colors={[activeColor, `${activeColor}dd`]} style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>

      <TodoEditorSheet
        bottomSheetRef={createSheetRef}
        activeCategory={activeCategory}
        newTitle={newTitle}
        selectedDate={selectedDate}
        editForm={editForm}
        saving={saving}
        onTitleChange={setNewTitle}
        onSelectedDateChange={setSelectedDate}
        onEditFormChange={updateEditForm}
        onCancel={() => createSheetRef.current?.dismiss()}
        onAdd={async () => {
          await addTodo();
          createSheetRef.current?.dismiss();
        }}
      />

      <TodoEditSheet
        bottomSheetRef={editSheetRef}
        form={editForm}
        saving={saving}
        onChange={updateEditForm}
        onCancel={closeEditSheet}
        onDelete={() => {
          if (editingTodo) deleteTodo(editingTodo);
        }}
        onSave={() => void saveDetails()}
      />
    </Screen>
  );
}
