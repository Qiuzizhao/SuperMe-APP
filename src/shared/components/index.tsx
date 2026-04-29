import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';

import { colors } from '@/src/shared/theme';

export function Screen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.screen, { paddingTop: insets.top }]}>{children}</View>;
}

export function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  tone?: 'primary' | 'danger' | 'plain';
}) {
  const plain = tone === 'plain';
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={disabled ? undefined : handlePress}
      style={({ pressed }) => [
        styles.button,
        tone === 'danger' && styles.buttonDanger,
        plain && styles.buttonPlain,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}>
      {icon ? <Ionicons name={icon} size={18} color={plain ? colors.primary : '#fff'} /> : null}
      <Text style={[styles.buttonText, plain && styles.buttonPlainText]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  name,
  onPress,
  color = colors.primary,
  label,
  soft,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  label?: string;
  soft?: boolean;
}) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.iconButton, soft && styles.iconButtonSoft, pressed && styles.pressed]}>
      <Ionicons name={name} size={21} color={color} />
    </Pressable>
  );
}

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function FormSheet({
  bottomSheetRef,
  children,
  snapPoints = ['85%'],
  contentStyle,
}: PropsWithChildren<{
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  snapPoints?: string[];
  contentStyle?: object;
}>) {
  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={0}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />}
      backgroundStyle={styles.bottomSheetBg}
      handleIndicatorStyle={styles.bottomSheetIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={[styles.sheetContent, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export function SheetTextInput({ value, onChangeText, onBlur, sheet = true, ...props }: TextInputProps & { sheet?: boolean }) {
  const [localValue, setLocalValue] = useState(value == null ? '' : String(value));
  const localValueRef = useRef(localValue);
  const composingRef = useRef(false);
  const InputComponent = sheet && Platform.OS !== 'web' ? BottomSheetTextInput : TextInput;

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

  const commitText = (text: string) => {
    syncText(text);
    onChangeText?.(text);
  };

  const inputProps: TextInputProps & Record<string, unknown> = {
    ...props,
    value: localValue,
    onChangeText: (text: string) => {
      if (Platform.OS === 'web' && composingRef.current) {
        localValueRef.current = text;
        return;
      }
      syncText(text);
      onChangeText?.(text);
    },
    onBlur: (event) => {
      composingRef.current = false;
      onChangeText?.(localValueRef.current);
      onBlur?.(event);
    },
  };

  if (Platform.OS === 'web') {
    inputProps.onCompositionStart = () => {
      composingRef.current = true;
    };
    inputProps.onCompositionEnd = (event: any) => {
      composingRef.current = false;
      const text = String(event?.currentTarget?.value ?? event?.target?.value ?? localValueRef.current);
      commitText(text);
    };
  }

  return <InputComponent {...inputProps} />;
}

export function Field({ label, sheet = true, ...props }: TextInputProps & { label: string; sheet?: boolean }) {
  const multilineScrollEnabled = props.multiline ? false : props.scrollEnabled;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <SheetTextInput
        placeholderTextColor={colors.faint}
        style={[styles.input, props.multiline && styles.inputMultiline]}
        sheet={sheet}
        scrollEnabled={multilineScrollEnabled}
        {...props}
      />
    </View>
  );
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function yearString(date: Date) {
  return String(date.getFullYear());
}

function weekString(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${pad(week)}`;
}

function parsePickerDate(value?: string, mode: 'date' | 'month' | 'year' | 'week' = 'date') {
  const now = new Date();
  if (!value) return now;
  if (mode === 'year') {
    const y = Number(value);
    if (!isNaN(y)) return new Date(y, 0, 1);
    return now;
  }
  if (mode === 'week' && value.includes('-W')) {
    const [y, w] = value.split('-W').map(Number);
    if (y && w) return new Date(y, 0, 1 + (w - 1) * 7);
    return now;
  }
  const parts = value.split('-').map(Number);
  if (mode === 'month' && parts.length >= 2 && parts[0] && parts[1]) return new Date(parts[0], parts[1] - 1, 1);
  if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) return new Date(parts[0], parts[1] - 1, parts[2]);
  return now;
}

function buildCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: { date: Date; currentMonth: boolean }[] = [];

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    cells.push({ date: new Date(year, month - 1, prevDays - i), currentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), currentMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, cells.length - firstWeekday - daysInMonth + 1), currentMonth: false });
  }
  return cells;
}

export function DateField({
  label,
  value,
  onChangeText,
  mode = 'date',
  placeholder,
  optional,
  compact,
}: {
  label: string;
  value?: string;
  onChangeText: (value: string) => void;
  mode?: 'date' | 'month' | 'year' | 'week';
  placeholder?: string;
  optional?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parsePickerDate(value, mode));
  const selectedValue = value || '';
  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const today = new Date();

  const openPicker = () => {
    setViewDate(parsePickerDate(value, mode));
    setOpen(true);
  };

  const chooseDate = (date: Date) => {
    if (mode === 'year') onChangeText(yearString(date));
    else if (mode === 'week') onChangeText(weekString(date));
    else if (mode === 'month') onChangeText(monthString(date));
    else onChangeText(dateString(date));
    setOpen(false);
  };

  return (
    <View style={compact ? styles.fieldCompact : styles.field}>
      {!compact && <Text style={styles.fieldLabel}>{label}</Text>}
      <Pressable onPress={openPicker} style={({ pressed }) => [styles.input, compact && styles.inputCompact, styles.dateInput, pressed && styles.pressed]}>
        <Text style={[styles.dateInputText, compact && styles.dateInputTextCompact, !selectedValue && styles.dateInputPlaceholder]}>{selectedValue || placeholder || (mode === 'year' ? '选择年份' : mode === 'month' ? '选择月份' : mode === 'week' ? '选择周' : '选择日期')}</Text>
        <Ionicons name="calendar-outline" size={compact ? 16 : 20} color={colors.primary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerPanel} onPress={(event) => event.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <IconButton name="chevron-back" label="上一个" soft onPress={() => setViewDate((date) => new Date(date.getFullYear() - (mode === 'year' ? 12 : (mode === 'month' ? 1 : 0)), date.getMonth() - (mode === 'date' || mode === 'week' ? 1 : 0), 1))} />
              <Text style={styles.pickerTitle}>
                {mode === 'year' ? `${viewDate.getFullYear() - 4} - ${viewDate.getFullYear() + 7}` : (mode === 'month' ? `${viewDate.getFullYear()}年` : `${viewDate.getFullYear()}年 ${viewDate.getMonth() + 1}月`)}
              </Text>
              <IconButton name="chevron-forward" label="下一个" soft onPress={() => setViewDate((date) => new Date(date.getFullYear() + (mode === 'year' ? 12 : (mode === 'month' ? 1 : 0)), date.getMonth() + (mode === 'date' || mode === 'week' ? 1 : 0), 1))} />
            </View>
            {mode === 'year' ? (
              <View style={styles.monthGrid}>
                {Array.from({ length: 12 }, (_, index) => {
                  const y = viewDate.getFullYear() - 4 + index;
                  const date = new Date(y, 0, 1);
                  const yValue = yearString(date);
                  const selected = selectedValue === yValue;
                  return (
                    <Pressable key={yValue} onPress={() => chooseDate(date)} style={[styles.monthCell, selected && styles.pickerCellSelected]}>
                      <Text style={[styles.monthCellText, selected && styles.pickerCellTextSelected]}>{y}年</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : mode === 'month' ? (
              <View style={styles.monthGrid}>
                {Array.from({ length: 12 }, (_, index) => {
                  const date = new Date(viewDate.getFullYear(), index, 1);
                  const monthValue = monthString(date);
                  const selected = selectedValue === monthValue;
                  return (
                    <Pressable key={monthValue} onPress={() => chooseDate(date)} style={[styles.monthCell, selected && styles.pickerCellSelected]}>
                      <Text style={[styles.monthCellText, selected && styles.pickerCellTextSelected]}>{index + 1}月</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <>
                <View style={styles.weekRow}>
                  {['日', '一', '二', '三', '四', '五', '六'].map((item) => <Text key={item} style={styles.weekText}>{item}</Text>)}
                </View>
                <View style={styles.dayGrid}>
                  {days.map(({ date, currentMonth }) => {
                    const dayValue = mode === 'week' ? weekString(date) : dateString(date);
                    const selected = selectedValue === dayValue;
                    const isToday = dayValue === (mode === 'week' ? weekString(today) : dateString(today));
                    return (
                      <Pressable key={dateString(date)} onPress={() => chooseDate(date)} style={[styles.dayCell, selected && styles.pickerCellSelected, isToday && !selected && styles.todayCell]}>
                        <Text style={[styles.dayCellText, !currentMonth && styles.dayCellMuted, selected && styles.pickerCellTextSelected]}>{date.getDate()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
            <View style={styles.pickerFooter}>
              {optional ? <PrimaryButton label="清空" tone="plain" onPress={() => { onChangeText(''); setOpen(false); }} /> : null}
              <PrimaryButton label={mode === 'year' ? '今年' : mode === 'month' ? '本月' : mode === 'week' ? '本周' : '今天'} tone="plain" onPress={() => chooseDate(new Date())} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        const handlePress = () => {
          if (!selected && Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onChange(option.value);
        };
        return (
          <Pressable
            key={option.value}
            onPress={handlePress}
            style={[styles.segment, selected && styles.segmentSelected]}>
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.input, styles.dateInput, pressed && styles.pressed]}>
        <Text style={[styles.dateInputText, !selected && styles.dateInputPlaceholder]}>{selected?.label || placeholder || '请选择'}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.pickerPanel} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.pickerTitle}>{label}</Text>
            <View style={styles.optionList}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [styles.optionRow, isSelected && styles.optionRowSelected, pressed && styles.pressed]}>
                    <Text style={styles.optionRowText}>{option.label}</Text>
                    {isSelected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.pickerFooter}>
              <PrimaryButton label="关闭" tone="plain" onPress={() => setOpen(false)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function StateView({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: string;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.stateText}>正在加载</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.state}>
        <Ionicons name="alert-circle-outline" size={34} color={colors.warning} />
        <Text style={styles.stateTitle}>加载失败</Text>
        <Text style={styles.stateText}>{error}</Text>
        {onRetry ? <PrimaryButton label="重试" onPress={onRetry} tone="plain" /> : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.state}>
        <Ionicons name="file-tray-outline" size={34} color={colors.faint} />
        <Text style={styles.stateTitle}>暂无记录</Text>
        <Text style={styles.stateText}>{empty}</Text>
      </View>
    );
  }
  return null;
}
