import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Card, Header, Screen, SegmentedControl, StateView } from '@/src/components/ui';
import { apiRequest } from '@/src/lib/api';
import { colors, radius, spacing } from '@/src/theme';
import { CrudScreen } from './CrudScreen';
import { financeModules } from './moduleConfig';

type FinanceItem = {
  id: number;
  amount: number;
  transaction_type: 'income' | 'expense';
  category?: string | null;
  transaction_date: string;
  belong_month?: string | null;
};

export function FinanceDashboard() {
  const [mode, setMode] = useState('records');

  if (mode === 'analysis') {
    return (
      <Screen>
        <Header title="财务分析" subtitle="按月份查看收入、支出和结余" />
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { label: '账务', value: 'records' },
            { label: '分析', value: 'analysis' },
          ]}
        />
        <IncomeAnalysis />
      </Screen>
    );
  }

  return (
    <Screen>
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { label: '账务', value: 'records' },
          { label: '分析', value: 'analysis' },
        ]}
      />
      <View style={styles.flex}>
        <CrudScreen modules={financeModules} title="财务" subtitle="账单、订阅和资产归物" />
      </View>
    </Screen>
  );
}

function IncomeAnalysis() {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await apiRequest<FinanceItem[]>('/finances/?limit=1000'));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const grouped = new Map<string, { month: string; income: number; expense: number }>();
    for (const item of items) {
      const month = item.belong_month || item.transaction_date?.slice(0, 7) || '未归属';
      const current = grouped.get(month) || { month, income: 0, expense: 0 };
      if (item.transaction_type === 'income') current.income += Number(item.amount || 0);
      if (item.transaction_type === 'expense') current.expense += Number(item.amount || 0);
      grouped.set(month, current);
    }
    return Array.from(grouped.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [items]);

  const totals = useMemo(
    () => rows.reduce(
      (acc, row) => ({
        income: acc.income + row.income,
        expense: acc.expense + row.expense,
      }),
      { income: 0, expense: 0 },
    ),
    [rows],
  );

  if (loading || error || rows.length === 0) {
    return <StateView loading={loading} error={error} empty={!loading ? '暂无账单可分析' : undefined} onRetry={load} />;
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.month}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Card>
          <Text style={styles.summaryTitle}>总览</Text>
          <View style={styles.metrics}>
            <Metric label="收入" value={totals.income} tone="success" />
            <Metric label="支出" value={totals.expense} tone="danger" />
            <Metric label="结余" value={totals.income - totals.expense} tone={totals.income >= totals.expense ? 'primary' : 'warning'} />
          </View>
        </Card>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      renderItem={({ item }) => {
        const balance = item.income - item.expense;
        return (
          <Card>
            <Text style={styles.month}>{item.month}</Text>
            <View style={styles.metrics}>
              <Metric label="收入" value={item.income} tone="success" />
              <Metric label="支出" value={item.expense} tone="danger" />
              <Metric label="结余" value={balance} tone={balance >= 0 ? 'primary' : 'warning'} />
            </View>
          </Card>
        );
      }}
    />
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'success' | 'danger' | 'primary' | 'warning' }) {
  const palette = {
    success: [colors.success, colors.successSoft],
    danger: [colors.danger, colors.dangerSoft],
    primary: [colors.primary, colors.primarySoft],
    warning: [colors.warning, colors.warningSoft],
  }[tone];

  return (
    <View style={[styles.metric, { backgroundColor: palette[1] }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: palette[0] }]}>¥{value.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: 0,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  month: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    borderRadius: radius.md,
    flex: 1,
    padding: spacing.md,
  },
  metricLabel: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
});
