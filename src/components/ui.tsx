import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { PropsWithChildren, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/src/theme';

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

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.faint}
        style={[styles.input, props.multiline && styles.inputMultiline]}
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
}: {
  label: string;
  value?: string;
  onChangeText: (value: string) => void;
  mode?: 'date' | 'month' | 'year' | 'week';
  placeholder?: string;
  optional?: boolean;
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
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable onPress={openPicker} style={({ pressed }) => [styles.input, styles.dateInput, pressed && styles.pressed]}>
        <Text style={[styles.dateInputText, !selectedValue && styles.dateInputPlaceholder]}>{selectedValue || placeholder || (mode === 'year' ? '选择年份' : mode === 'month' ? '选择月份' : mode === 'week' ? '选择周' : '选择日期')}</Text>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 9999,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonPlain: {
    backgroundColor: colors.primarySoft,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPlainText: {
    color: colors.primary,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconButtonSoft: {
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow,
  },
  field: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    color: colors.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  inputMultiline: {
    minHeight: 108,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  dateInput: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  dateInputPlaceholder: {
    color: colors.faint,
  },
  pickerOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pickerPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    maxWidth: 360,
    padding: spacing.lg,
    width: '100%',
    ...shadow,
  },
  pickerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekText: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  dayCell: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: radius.md,
    justifyContent: 'center',
    width: '14.285%',
  },
  dayCellText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  dayCellMuted: {
    color: colors.faint,
  },
  todayCell: {
    backgroundColor: colors.primarySoft,
  },
  pickerCellSelected: {
    backgroundColor: colors.text,
  },
  pickerCellTextSelected: {
    color: '#fff',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  monthCell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    minHeight: 48,
    justifyContent: 'center',
    width: '30%',
  },
  monthCellText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  pickerFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  segmented: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  segment: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 9999,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    ...shadow,
  },
  segmentSelected: {
    backgroundColor: colors.text,
  },
  segmentText: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '800',
  },
  segmentTextSelected: {
    color: '#fff',
  },
  state: {
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
