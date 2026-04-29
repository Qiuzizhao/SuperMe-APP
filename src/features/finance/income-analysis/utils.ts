import type { FinanceItem } from '../shared/types';
import { getTagHexColor } from '../shared/utils';
import type { CategoryAggregates, CategoryStats, IncomeConfig, IncomeTotals, ProjectionStats } from './types';

export function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function getMonthsDiff(startStr: string, endStr: string) {
  if (!startStr || !endStr) return 1;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  return Math.max(1, months);
}

export function getBaseDate(incomes: FinanceItem[]) {
  if (!incomes || incomes.length === 0) return new Date().toISOString().slice(0, 10);
  let earliest = incomes[0].belong_month || incomes[0].transaction_date;
  incomes.forEach((item) => {
    const date = item.belong_month || item.transaction_date;
    if (date && date < earliest) earliest = date;
  });
  return earliest;
}

function incomeFlags(configs: IncomeConfig, category: string) {
  return {
    isNet: configs.finance_income_net_cats.includes(category),
    isTotal: configs.finance_income_total_cats.includes(category),
    isGross: configs.finance_income_gross_cats.includes(category),
  };
}

export function buildNetStats(incomes: FinanceItem[], configs: IncomeConfig, month: string): IncomeTotals {
  const cutoff = `${month}-31`;
  return incomes.reduce<IncomeTotals>((stats, item) => {
    const date = item.belong_month || item.transaction_date;
    if (date > cutoff) return stats;
    const { isNet, isTotal, isGross } = incomeFlags(configs, item.category || '');
    const amount = Number(item.amount || 0);
    if (isNet || isTotal || isGross) stats.grossTotal += amount;
    if (isNet || isTotal) stats.totalIncome += amount;
    if (isNet) stats.netTotal += amount;
    return stats;
  }, { netTotal: 0, totalIncome: 0, grossTotal: 0 });
}

export function buildProjectionStats(incomes: FinanceItem[], configs: IncomeConfig, projectionMonth: string): ProjectionStats {
  const baseDate = getBaseDate(incomes);
  const cutoff = `${projectionMonth}-31`;
  const totalMonths = getMonthsDiff(baseDate, cutoff);
  const totals = buildNetStats(incomes, configs, projectionMonth);
  const avgMonthlyNet = totals.netTotal / totalMonths;
  const avgMonthlyTotal = totals.totalIncome / totalMonths;
  const avgMonthlyGross = totals.grossTotal / totalMonths;

  return {
    avgMonthlyNet,
    avgMonthlyTotal,
    avgMonthlyGross,
    annualNetProjection: avgMonthlyNet * 12,
    annualTotalProjection: avgMonthlyTotal * 12,
    annualGrossProjection: avgMonthlyGross * 12,
    totalMonths,
  };
}

export function buildCategoryStats(incomes: FinanceItem[], configs: IncomeConfig, categoryEndMonths: Record<string, string>, currentMonth: string): CategoryStats {
  const baseDate = getBaseDate(incomes);
  const stats: CategoryStats = {};

  configs.finance_income_categories.forEach((category) => {
    const cutoffMonth = categoryEndMonths[category] || currentMonth;
    const cutoff = `${cutoffMonth}-31`;
    const totalMonths = getMonthsDiff(baseDate, cutoff);
    const actual = incomes.reduce((sum, item) => {
      const date = item.belong_month || item.transaction_date;
      return item.category === category && date <= cutoff ? sum + Number(item.amount || 0) : sum;
    }, 0);
    const avg = actual / totalMonths;
    stats[category] = { actual, avg, projection: avg * 12, currentMonth: cutoffMonth };
  });

  return stats;
}

export function buildCategoryAggregates(configs: IncomeConfig, categoryStats: CategoryStats): CategoryAggregates {
  let avgNet = 0;
  let avgTotal = 0;
  let avgGross = 0;

  configs.finance_income_categories.forEach((category) => {
    const avg = categoryStats[category]?.avg || 0;
    avgGross += avg;
    if (configs.finance_income_net_cats.includes(category)) {
      avgNet += avg;
      avgTotal += avg;
    } else if (configs.finance_income_total_cats.includes(category)) {
      avgTotal += avg;
    }
  });

  return {
    avgNet,
    avgTotal,
    avgGross,
    annualNet: avgNet * 12,
    annualTotal: avgTotal * 12,
    annualGross: avgGross * 12,
  };
}

export function buildTrendChartData(incomes: FinanceItem[], configs: IncomeConfig, chartMonth: string, filterCategory: string | null) {
  const monthlyMap = new Map<string, number>();
  const cutoff = `${chartMonth}-31`;

  incomes.forEach((item) => {
    const dateStr = item.belong_month || item.transaction_date;
    if (dateStr > cutoff) return;
    const category = item.category || '';
    if (filterCategory && category !== filterCategory) return;
    if (!filterCategory && !configs.finance_income_net_cats.includes(category)) return;
    const month = dateStr.slice(0, 7);
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(item.amount || 0));
  });

  const trend = Array.from(monthlyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }));
  if (trend.length === 0) return { labels: ['无数据'], datasets: [{ data: [0] }] };

  return {
    labels: trend.map((item) => `${item.month.slice(5, 7)}月`),
    datasets: [{
      data: trend.map((item) => item.total),
      color: (opacity = 1) => filterCategory ? getTagHexColor(filterCategory) : `rgba(37, 99, 235, ${opacity})`,
      strokeWidth: 3,
    }],
  };
}
