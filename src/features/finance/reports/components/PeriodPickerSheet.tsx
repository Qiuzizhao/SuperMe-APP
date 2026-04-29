import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DateField, PrimaryButton, SegmentedControl } from '@/src/shared/components';
import { colors, radius, spacing } from '@/src/shared/theme';
import { styles } from '../../styles';
import type { ReportType } from '../../shared/types';
import { currentMonthValue, todayDate, weekRange } from '../../shared/utils';

export function PeriodPickerSheet({
  visible,
  reportType,
  reportWeek,
  reportMonth,
  reportYear,
  customStartDate,
  customEndDate,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  reportType: ReportType;
  reportWeek: string;
  reportMonth: string;
  reportYear: string;
  customStartDate: string;
  customEndDate: string;
  onClose: () => void;
  onConfirm: (next: { type: ReportType; week: string; month: string; year: string; start: string; end: string }) => void;
}) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [draftType, setDraftType] = useState<ReportType>(reportType);
  const [draftWeek, setDraftWeek] = useState(reportWeek);
  const [draftMonth, setDraftMonth] = useState(reportMonth);
  const [draftYear, setDraftYear] = useState(reportYear);
  const [draftStart, setDraftStart] = useState(customStartDate);
  const [draftEnd, setDraftEnd] = useState(customEndDate);

  useEffect(() => {
    if (visible) {
      setDraftType(reportType);
      setDraftWeek(reportWeek);
      setDraftMonth(reportMonth);
      setDraftYear(reportYear);
      setDraftStart(customStartDate);
      setDraftEnd(customEndDate);
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, reportType, reportWeek, reportMonth, reportYear, customStartDate, customEndDate]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const modes: { label: string; value: ReportType }[] = [
    { label: '周', value: 'weekly' },
    { label: '月', value: 'monthly' },
    { label: '年', value: 'yearly' },
    { label: '自定义', value: 'custom' },
  ];
  const weeks = buildWeekPickerRows(draftWeek);
  const yearStart = Math.max(2000, Math.floor((Number(draftYear) - 2024) / 12) * 12 + 2024);
  const years = Array.from({ length: 12 }, (_, index) => String(yearStart + index));
  const sheetBigTitle = draftType === 'weekly' || draftType === 'monthly' ? draftYear + '年'
    : draftType === 'yearly' ? years[0] + '年-' + years[years.length - 1] + '年'
      : '选择时间范围';

  const shiftBackward = () => {
    if (draftType === 'weekly') setDraftWeek(shiftWeekValue(draftWeek, -4));
    else if (draftType === 'yearly') setDraftYear(String(Number(draftYear) - 12));
    else setDraftYear(String(Number(draftYear) - 1));
  };
  const shiftForward = () => {
    if (draftType === 'weekly') setDraftWeek(shiftWeekValue(draftWeek, 4));
    else if (draftType === 'yearly') setDraftYear(String(Number(draftYear) + 12));
    else setDraftYear(String(Number(draftYear) + 1));
  };
  const commit = () => {
    const range = weekRange(draftWeek);
    const nextMonth = draftType === 'weekly' && range ? range.start.slice(0, 7)
      : draftType === 'yearly' ? draftYear + '-01'
        : draftType === 'custom' ? (draftStart || todayDate()).slice(0, 7)
          : draftMonth;
    const nextYear = draftType === 'monthly' ? draftMonth.slice(0, 4)
      : draftType === 'weekly' && range ? range.start.slice(0, 4)
        : draftType === 'custom' ? (draftStart || todayDate()).slice(0, 4)
          : draftYear;
    onConfirm({ type: draftType, week: draftWeek, month: nextMonth, year: nextYear, start: draftStart, end: draftEnd });
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['75%', '90%']}
      index={0}
      onChange={handleSheetChanges}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />}
      backgroundStyle={styles.bottomSheetBg}
      handleIndicatorStyle={styles.bottomSheetIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.financeContent}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
          <Text style={styles.sheetTitle}>选择时间范围</Text>
        </View>

        <SegmentedControl 
          value={draftType} 
          onChange={(value) => setDraftType(value as ReportType)} 
          options={modes} 
        />

        {draftType !== 'custom' ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text }}>{sheetBigTitle}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Pressable onPress={shiftBackward} style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceMuted, justifyContent: 'center', alignItems: 'center' }, pressed && styles.pressed]}>
                <Ionicons name="chevron-up" size={24} color={colors.text} />
              </Pressable>
              <Pressable onPress={shiftForward} style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceMuted, justifyContent: 'center', alignItems: 'center' }, pressed && styles.pressed]}>
                <Ionicons name="chevron-down" size={24} color={colors.text} />
              </Pressable>
            </View>
          </View>
        ) : null}

        {draftType === 'weekly' ? (
          <View style={{ gap: spacing.sm }}>
            {weeks.map((week) => (
              <Pressable 
                key={week.value} 
                onPress={() => setDraftWeek(week.value)} 
                style={({ pressed }) => [
                  { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: draftWeek === week.value ? colors.primary + '15' : colors.surfaceMuted, borderWidth: 1, borderColor: draftWeek === week.value ? colors.primary : 'transparent' },
                  pressed && styles.pressed
                ]}
              >
                <Text style={{ fontSize: 16, fontWeight: '800', color: draftWeek === week.value ? colors.primary : colors.text }}>{week.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {draftType === 'monthly' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {Array.from({ length: 12 }, (_, index) => {
              const month = String(index + 1).padStart(2, '0');
              const monthValue = draftYear + '-' + month;
              const selected = draftMonth === monthValue;
              const future = monthValue > currentMonthValue();
              return (
                <Pressable 
                  key={monthValue} 
                  disabled={future} 
                  onPress={() => setDraftMonth(monthValue)} 
                  style={({ pressed }) => [
                    { width: '31%', aspectRatio: 1.5, borderRadius: radius.xl, backgroundColor: selected ? colors.primary : colors.surfaceMuted, justifyContent: 'center', alignItems: 'center', opacity: future ? 0.4 : 1 },
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={{ fontSize: 18, fontWeight: '800', color: selected ? colors.surface : colors.text }}>{index + 1}月</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {draftType === 'yearly' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {years.map((yearValue) => {
              const selected = draftYear === yearValue;
              const future = yearValue > String(new Date().getFullYear());
              return (
                <Pressable 
                  key={yearValue} 
                  disabled={future} 
                  onPress={() => setDraftYear(yearValue)} 
                  style={({ pressed }) => [
                    { width: '31%', aspectRatio: 1.5, borderRadius: radius.xl, backgroundColor: selected ? colors.primary : colors.surfaceMuted, justifyContent: 'center', alignItems: 'center', opacity: future ? 0.4 : 1 },
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={{ fontSize: 18, fontWeight: '800', color: selected ? colors.surface : colors.text }}>{yearValue}年</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {draftType === 'custom' ? (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}><DateField label="开始时间" value={draftStart} onChangeText={setDraftStart} /></View>
            <View style={{ flex: 1 }}><DateField label="结束时间" value={draftEnd} onChangeText={setDraftEnd} /></View>
          </View>
        ) : null}

        <View style={styles.formActions}>
          <PrimaryButton label="取消" tone="plain" onPress={() => bottomSheetRef.current?.dismiss()} />
          <View style={{ flex: 1 }}>
            <PrimaryButton label="确定" icon="checkmark" onPress={commit} />
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function formatDateCN(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function shiftWeekValue(value: string, deltaWeeks: number) {
  const range = weekRange(value);
  const start = range ? parseDateValue(range.start) : new Date();
  start.setDate(start.getDate() + deltaWeeks * 7);
  return weekStringForReport(start);
}

function weekStringForReport(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function buildWeekPickerRows(centerWeek: string) {
  return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const value = shiftWeekValue(centerWeek, offset);
    const range = weekRange(value);
    const weekNo = Number(value.split('-W')[1]);
    const relation = offset === 0 ? '本周' : offset === -1 ? '上周' : `第${weekNo}周`;
    return {
      value,
      label: range ? `${formatDateCN(range.start)}-${formatDateCN(range.end)}（${relation}）` : value,
    };
  });
}
