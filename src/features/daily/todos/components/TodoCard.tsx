import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, Text, View } from 'react-native';

import { styles } from '../styles';
import type { TodoItem } from '../types';
import { dueTag, formatShortDate } from '../utils';

const DELETE_WIDTH = 92;

export function TodoCard({
  todo,
  activeColor,
  onToggle,
  onDelete,
  onSelect,
}: {
  todo: TodoItem;
  activeColor: string;
  onToggle: () => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const tag = dueTag(todo.due_date);
  const translateX = useRef(new Animated.Value(0)).current;
  const opened = useRef(false);

  const animateTo = useCallback((value: number) => {
    Animated.spring(translateX, {
      toValue: value,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start(() => {
      opened.current = value !== 0;
    });
  }, [translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderMove: (_, gestureState) => {
          const base = opened.current ? -DELETE_WIDTH : 0;
          const next = Math.max(-DELETE_WIDTH, Math.min(0, base + gestureState.dx));
          translateX.setValue(next);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -40 || (opened.current && gestureState.dx < 20)) animateTo(-DELETE_WIDTH);
          else animateTo(0);
        },
        onPanResponderTerminate: () => animateTo(opened.current ? -DELETE_WIDTH : 0),
      }),
    [animateTo, translateX],
  );

  return (
    <View style={styles.todoCard}>
      <Pressable style={styles.todoDeleteAction} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.todoDeleteText}>删除</Text>
      </Pressable>
      <Animated.View style={[styles.todoCardSurface, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <Pressable onLongPress={onSelect} delayLongPress={350} style={styles.todoHeader}>
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
        </Pressable>
      </Animated.View>
    </View>
  );
}
