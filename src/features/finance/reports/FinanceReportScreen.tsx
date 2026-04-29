import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Header, IconButton, Screen, SegmentedControl, StateView } from '@/src/shared/components';
import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../styles';
import type { FinanceItem, ReportType } from '../shared/types';
import { currentMonthValue, currentWeekValue, todayDate, weekRange } from '../shared/utils';
import { fetchReportFinances } from './api';
import { FinanceCalendarView } from './components/FinanceCalendarView';
import { FinanceReport } from './components/FinanceReport';
import { PeriodPickerSheet } from './components/PeriodPickerSheet';
import { buildMonthCalendar, formatReportTitle } from './utils';

export function FinanceReportScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [viewMode, setViewMode] = useState<'report' | 'calendar'>('report');
  const [finances, setFinances] = useState<FinanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [reportWeek, setReportWeek] = useState(currentWeekValue());
  const [reportMonth, setReportMonth] = useState(currentMonthValue());
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [customStartDate, setCustomStartDate] = useState(() => `${currentMonthValue()}-01`);
  const [customEndDate, setCustomEndDate] = useState(todayDate());
  const [expenseChartLevel, setExpenseChartLevel] = useState<'category' | 'subcategory'>('category');
  const [chartType, setChartType] = useState<'donut' | 'area'>('donut');
  const [selectedReportCategory, setSelectedReportCategory] = useState<string | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const loadFinances = useCallback(async () => {
    setError(null);
    try {
      setFinances(await fetchReportFinances());
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载账单失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadFinances();
  }, [loadFinances]);

  useEffect(() => {
    setSelectedReportCategory(null);
  }, [activeTab, reportType, reportWeek, reportMonth, reportYear, customStartDate, customEndDate, expenseChartLevel]);

  const periodFinances = useMemo(() => finances.filter((item) => {
    const date = item.transaction_date || '';
    if (!date) return false;
    if (reportType === 'weekly') {
      const range = weekRange(reportWeek);
      return range ? date >= range.start && date <= range.end : false;
    }
    if (reportType === 'yearly') return date.startsWith(reportYear);
    if (reportType === 'custom') return (!customStartDate || date >= customStartDate) && (!customEndDate || date <= customEndDate);
    return date.startsWith(reportMonth);
  }), [customEndDate, customStartDate, finances, reportMonth, reportType, reportWeek, reportYear]);
  const tabFinances = useMemo(() => periodFinances.filter((item) => item.transaction_type === activeTab), [periodFinances, activeTab]);
  const totalExpense = useMemo(() => periodFinances.filter((item) => item.transaction_type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0), [periodFinances]);
  const totalIncome = useMemo(() => periodFinances.filter((item) => item.transaction_type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0), [periodFinances]);
  const filteredTotalAmount = tabFinances.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const groupKey = useCallback((item: FinanceItem) => {
    if (activeTab === 'expense') {
      if (expenseChartLevel === 'subcategory') return item.subcategory || item.category || '未分类';
      return item.category || item.bill || '未分类';
    }
    return item.category || '未分类';
  }, [activeTab, expenseChartLevel]);

  const categoryData = useMemo(() => {
    const grouped = new Map<string, { value: number; count: number; parent?: string }>();
    tabFinances.forEach((item) => {
      const key = groupKey(item);
      const parent = expenseChartLevel === 'subcategory' ? item.category || item.bill || undefined : item.bill || item.category || undefined;
      const current = grouped.get(key) || { value: 0, count: 0, parent };
      grouped.set(key, { value: current.value + Number(item.amount || 0), count: current.count + 1, parent: current.parent });
    });
    return [...grouped.entries()]
      .map(([name, data]) => ({ name, value: data.value, count: data.count, parent: data.parent }))
      .sort((a, b) => b.value - a.value);
  }, [expenseChartLevel, groupKey, tabFinances]);

  const calendarData = useMemo(() => buildMonthCalendar(reportMonth, periodFinances, activeTab), [activeTab, periodFinances, reportMonth]);
  const dailyAverage = calendarData.activeDays > 0 ? filteredTotalAmount / calendarData.activeDays : 0;

  if (loading || error) {
    return (
      <Screen>
        <Header title="报表" action={<IconButton name="chevron-back" label="返回" soft onPress={onBack} />} />
        <StateView loading={loading} error={error} onRetry={loadFinances} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="财务报表"
        subtitle={formatReportTitle(reportType, reportWeek, reportMonth, reportYear, customStartDate, customEndDate)}
        action={<IconButton name="chevron-back" label="返回" soft onPress={onBack} />}
      />
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        <SegmentedControl 
          value={viewMode} 
          onChange={(value) => setViewMode(value as 'report' | 'calendar')} 
          options={[
            { label: '报表分析', value: 'report' },
            { label: '日历视图', value: 'calendar' }
          ]} 
        />
      </View>
      <ScrollView
        contentContainerStyle={[styles.financeContent, { paddingTop: 0 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadFinances(); }} tintColor={colors.primary} />}
      >
        <Pressable 
          onPress={() => setMonthPickerOpen(true)}
          style={({ pressed }) => [
            styles.bentoCardLarge, 
            { backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 64, aspectRatio: undefined, height: 'auto', marginBottom: spacing.xs },
            pressed && styles.pressed
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={[styles.bentoIconWrapper, { backgroundColor: colors.primary + '15', width: 40, height: 40, borderRadius: 14 }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ gap: 2 }}>
              <Text style={{ fontSize: 12, color: colors.textSoft, fontWeight: '700' }}>当前统计周期</Text>
              <Text style={{ fontSize: 16, color: colors.text, fontWeight: '900' }}>{formatReportTitle(reportType, reportWeek, reportMonth, reportYear, customStartDate, customEndDate)}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        {viewMode === 'report' ? (
          <FinanceReport
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            reportMonth={reportMonth}
            totalExpense={totalExpense}
            totalIncome={totalIncome}
            expenseChartLevel={expenseChartLevel}
            setExpenseChartLevel={setExpenseChartLevel}
            chartType={chartType}
            setChartType={setChartType}
            categoryData={categoryData}
            selectedReportCategory={selectedReportCategory}
            setSelectedReportCategory={setSelectedReportCategory}
            filteredTotalAmount={filteredTotalAmount}
          />
        ) : (
          <FinanceCalendarView
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            calendarData={calendarData}
            totalAmount={filteredTotalAmount}
            dailyAverage={dailyAverage}
            reportMonth={reportMonth}
          />
        )}
      </ScrollView>
      <PeriodPickerSheet
        visible={monthPickerOpen}
        reportType={reportType}
        reportWeek={reportWeek}
        reportMonth={reportMonth}
        reportYear={reportYear}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onClose={() => setMonthPickerOpen(false)}
        onConfirm={(next: { type: ReportType; week: string; month: string; year: string; start: string; end: string }) => {
          setReportType(next.type);
          setReportWeek(next.week);
          setReportMonth(next.month);
          setReportYear(next.year);
          setCustomStartDate(next.start);
          setCustomEndDate(next.end);
          setMonthPickerOpen(false);
        }}
      />
    </Screen>
  );
}
