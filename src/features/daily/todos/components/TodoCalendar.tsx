import { Pressable, Text, View } from 'react-native';

import { IconButton } from '@/src/shared/components';
import { colors } from '@/src/shared/theme';
import { monthNames, weekNames } from '../constants';
import { styles } from '../styles';
import type { TodoItem } from '../types';

export function TodoCalendar({
  currentDate,
  calendarDays,
  todos,
  selectedDate,
  todayString,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
  onSelectTodo,
}: {
  currentDate: Date;
  calendarDays: { day: number; date: string; currentMonth: boolean }[];
  todos: TodoItem[];
  selectedDate: string | null;
  todayString: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: string) => void;
  onSelectTodo: (todo: TodoItem, date: string) => void;
}) {
  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>日历日程</Text>
        <View style={styles.monthControl}>
          <IconButton name="chevron-back" label="上个月" onPress={onPreviousMonth} />
          <Text style={styles.monthText}>{currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}</Text>
          <IconButton name="chevron-forward" label="下个月" onPress={onNextMonth} />
        </View>
      </View>
      <View style={styles.weekRow}>
        {weekNames.map((day) => <Text key={day} style={styles.weekText}>周{day}</Text>)}
      </View>
      <View style={styles.calendarGrid}>
        {calendarDays.map((day) => {
          const dayTodos = todos.filter((todo) => todo.due_date === day.date);
          const isToday = day.date === todayString;
          const isSelected = day.date === selectedDate;
          return (
            <Pressable
              key={day.date}
              onPress={() => onSelectDate(day.date)}
              style={[styles.dayCell, isSelected && styles.dayCellSelected, !day.currentMonth && styles.dayCellMuted]}
            >
              <Text style={[styles.dayNumber, isToday && styles.todayNumber, isSelected && styles.selectedDayNumber]}>{day.day}</Text>
              <View style={styles.dayTodoDots}>
                {dayTodos.slice(0, 2).map((todo) => (
                  <Pressable
                    key={todo.id}
                    onPress={(event) => {
                      event.stopPropagation();
                      onSelectTodo(todo, day.date);
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
  );
}
