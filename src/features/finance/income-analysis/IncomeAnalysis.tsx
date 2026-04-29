import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Header, IconButton, Screen, StateView } from '@/src/shared/components';
import { normalizeIncomeConfig } from '@/src/shared/utils/incomeConfig';
import { styles } from '../styles';
import type { FinanceItem } from '../shared/types';
import { fetchIncomeConfigs, fetchIncomeRecords } from './api';
import { CategoryAggregateStats, CategoryDetailStats, IncomeStatsSection, IncomeTrendChart } from './components';
import type { IncomeConfig } from './types';
import {
  buildCategoryAggregates,
  buildCategoryStats,
  buildNetStats,
  buildProjectionStats,
  buildTrendChartData,
  getBaseDate,
  getCurrentMonth,
} from './utils';

const defaultIncomeConfig: IncomeConfig = {
  finance_income_categories: [],
  finance_income_net_cats: [],
  finance_income_total_cats: [],
  finance_income_gross_cats: [],
};

export function IncomeAnalysis({ onBack }: { onBack: () => void }) {
  const [incomes, setIncomes] = useState<FinanceItem[]>([]);
  const [configs, setConfigs] = useState<IncomeConfig>(defaultIncomeConfig);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const [netStatsMonth, setNetStatsMonth] = useState(currentMonth);
  const [projectionMonth, setProjectionMonth] = useState(currentMonth);
  const [chartMonth, setChartMonth] = useState(currentMonth);
  const [categoryEndMonths, setCategoryEndMonths] = useState<Record<string, string>>({});
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [incomeData, configData] = await Promise.all([fetchIncomeRecords(), fetchIncomeConfigs()]);
      const normalizedConfigs = normalizeIncomeConfig(configData) as IncomeConfig;
      const nextIncomes = Array.isArray(incomeData) ? incomeData : [];
      const initialCategoryMonths: Record<string, string> = {};

      normalizedConfigs.finance_income_categories.forEach((category) => {
        initialCategoryMonths[category] = currentMonth;
      });

      setIncomes(nextIncomes);
      setConfigs({ ...defaultIncomeConfig, ...normalizedConfigs });
      setCategoryEndMonths((prev) => Object.keys(prev).length > 0 ? prev : initialCategoryMonths);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  const baseDate = useMemo(() => getBaseDate(incomes), [incomes]);
  const netStats = useMemo(() => buildNetStats(incomes, configs, netStatsMonth), [configs, incomes, netStatsMonth]);
  const projectionStats = useMemo(() => buildProjectionStats(incomes, configs, projectionMonth), [configs, incomes, projectionMonth]);
  const categoryStats = useMemo(() => buildCategoryStats(incomes, configs, categoryEndMonths, currentMonth), [categoryEndMonths, configs, currentMonth, incomes]);
  const categoryAggregates = useMemo(() => buildCategoryAggregates(configs, categoryStats), [categoryStats, configs]);
  const chartData = useMemo(() => buildTrendChartData(incomes, configs, chartMonth, filterCategory), [chartMonth, configs, filterCategory, incomes]);

  if (loading || error) {
    return (
      <Screen>
        <Header title="收入分析" action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />} />
        <StateView loading={loading} error={error} onRetry={load} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="收入分析"
        subtitle={`最早记录：${baseDate.slice(0, 7).replace('-', '年')}月  |  统计月数：${projectionStats.totalMonths} 个月`}
        action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <IncomeStatsSection
          title="🐷 实发到账统计"
          month={netStatsMonth}
          onMonthChange={setNetStatsMonth}
          cards={[
            { label: '到手总额', value: netStats.netTotal, note: '仅含到手类别', featured: 'green' },
            { label: '总收入 (含福利)', value: netStats.totalIncome },
            { label: '全包总额', value: netStats.grossTotal },
          ]}
        />

        <IncomeStatsSection
          title="📈 未来年度预估"
          month={projectionMonth}
          onMonthChange={setProjectionMonth}
          cards={[
            { label: '年度到手预估', value: projectionStats.annualNetProjection, note: '到手月均 * 12', featured: 'blue' },
            { label: '年度总收入预估', value: projectionStats.annualTotalProjection },
            { label: '年度全包预估', value: projectionStats.annualGrossProjection },
          ]}
          smallCards={[
            { label: '月均到手', value: projectionStats.avgMonthlyNet },
            { label: '月均总收入', value: projectionStats.avgMonthlyTotal },
            { label: '月均全包', value: projectionStats.avgMonthlyGross },
          ]}
        />

        <CategoryDetailStats
          configs={configs}
          categoryStats={categoryStats}
          onCategoryMonthChange={(category, month) => setCategoryEndMonths((prev) => ({ ...prev, [category]: month }))}
        />

        <CategoryAggregateStats aggregates={categoryAggregates} />

        <IncomeTrendChart
          configs={configs}
          chartMonth={chartMonth}
          filterCategory={filterCategory}
          chartData={chartData}
          onChartMonthChange={setChartMonth}
          onFilterCategoryChange={setFilterCategory}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}
