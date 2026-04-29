import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import {
  Alert,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { styles } from './styles';

import { Header, IconButton, Screen } from '@/src/shared/components';
import { apiRequest } from '@/src/shared/api';
import { colors } from '@/src/shared/theme';

export type Item = Record<string, any> & { id: number };

export const today = () => new Date().toISOString().slice(0, 10);
export const compactDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
export const money = (value: unknown) => `￥${Number(value || 0).toFixed(2)}`;
export const safeNoteText = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (!value) return '';
  if (typeof value === 'object' && 'uri' in (value as Record<string, unknown>)) {
    return String((value as { uri?: unknown }).uri || '');
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const MOOD_IMAGES = {
  5: require('../../../../assets/images/emojis/5.png'),
  4: require('../../../../assets/images/emojis/4.png'),
  3: require('../../../../assets/images/emojis/3.png'),
  2: require('../../../../assets/images/emojis/2.png'),
  1: require('../../../../assets/images/emojis/1.png'),
};

export function useItems<T extends Item>(source: string | (() => Promise<T[]>)) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = typeof source === 'function' ? await source() : await apiRequest<T[]>(source);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [source]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return { items, setItems, loading, refreshing, setRefreshing, error, load };
}

export function ScreenShell({ title, subtitle, onBack, children }: { title: string; subtitle?: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <Screen>
      <Header title={title} subtitle={subtitle} action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />} />
      {children}
    </Screen>
  );
}

export function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Tag({ label, tone = 'gray' }: { label: string; tone?: 'gray' | 'blue' | 'green' | 'red' | 'purple' | 'orange' }) {
  return <Text style={[styles.tag, styles[`tag_${tone}`]]}>{label}</Text>;
}

export function confirmRemove(label: string, onConfirm: () => void) {
  Alert.alert('删除确认', `确定删除「${label}」吗？`, [
    { text: '取消', style: 'cancel' },
    { text: '删除', style: 'destructive', onPress: onConfirm },
  ]);
}

export function SelectPills({ value, options, onChange, accent = colors.primary }: { value: string; options: ({ label: string; value: string } | string)[]; onChange: (value: string) => void; accent?: string }) {
  return (
    <View style={styles.pills}>
      {options.map((opt) => {
        const optValue = typeof opt === 'string' ? opt : opt.value;
        const optLabel = typeof opt === 'string' ? opt : opt.label;
        const selected = optValue === value;
        return (
          <Pressable key={optValue} onPress={() => onChange(optValue)} style={[styles.pill, selected && { backgroundColor: accent, borderColor: accent }]}>
            <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{optLabel}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TextArea(props: React.ComponentProps<typeof BottomSheetTextInput>) {
  const { value, onChangeText, onBlur, ...rest } = props;
  const [localValue, setLocalValue] = useState(value == null ? '' : String(value));
  const localValueRef = useRef(localValue);
  const composingRef = useRef(false);
  const InputComponent = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;

  useEffect(() => {
    if (composingRef.current) return;
    const nextValue = value == null ? '' : String(value);
    localValueRef.current = nextValue;
    setLocalValue(nextValue);
  }, [value]);

  const syncText = (text: string) => {
    localValueRef.current = text;
    setLocalValue(text);
  };

  const inputProps: Record<string, unknown> = {
    ...rest,
    value: localValue,
    placeholderTextColor: colors.faint,
    multiline: true,
    scrollEnabled: false,
    textAlignVertical: 'top',
    style: [styles.input, styles.textArea, props.style],
    onChangeText: (text: string) => {
      if (Platform.OS === 'web' && composingRef.current) {
        localValueRef.current = text;
        return;
      }
      syncText(text);
      onChangeText?.(text);
    },
    onBlur: (event: unknown) => {
      composingRef.current = false;
      onChangeText?.(localValueRef.current);
      onBlur?.(event as never);
    },
  };

  if (Platform.OS === 'web') {
    inputProps.onCompositionStart = () => {
      composingRef.current = true;
    };
    inputProps.onCompositionEnd = (event: any) => {
      composingRef.current = false;
      const text = String(event?.currentTarget?.value ?? event?.target?.value ?? localValueRef.current);
      syncText(text);
      onChangeText?.(text);
    };
  }

  return <InputComponent {...inputProps} />;
}

export const moodOptions = [
  { level: 5, emoji: MOOD_IMAGES[5], label: '开心' },
  { level: 4, emoji: MOOD_IMAGES[4], label: '不错' },
  { level: 3, emoji: MOOD_IMAGES[3], label: '平静' },
  { level: 2, emoji: MOOD_IMAGES[2], label: '低落' },
  { level: 1, emoji: MOOD_IMAGES[1], label: '生气' },
];

export function moodByLevel(level: number) {
  return moodOptions.find((item) => item.level === level) || moodOptions[2];
}
