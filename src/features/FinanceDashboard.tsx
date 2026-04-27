import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, RefreshControl, StyleSheet, Text, View, ScrollView, TextInput, Pressable, Dimensions } from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';

import { DateField, Header, IconButton, PrimaryButton, Screen, SegmentedControl, StateView } from '@/src/components/ui';
import { apiRequest } from '@/src/lib/api';
import { colors, radius, spacing, shadow } from '@/src/theme';
import { CrudScreen } from './CrudScreen';
import { financeModules } from './moduleConfig';
import { normalizeIncomeConfig } from '../utils/incomeConfig';
import { AssetScreen, SubscriptionScreen } from './ReplicatedScreens';

const screenWidth = Dimensions.get('window').width;

type FinanceItem = {
  id: number;
  amount: number;
  transaction_type: 'income' | 'expense';
  bill?: string | null;
  bill_id?: number | null;
  category?: string | null;
  category_id?: number | null;
  subcategory?: string | null;
  subcategory_id?: number | null;
  description?: string | null;
  transaction_date: string;
  belong_month?: string | null;
  created_at?: string;
};

type FinanceSubcategory = {
  id: number;
  name: string;
};

type FinanceCategory = {
  id: number;
  name: string;
  subcategories: FinanceSubcategory[];
};

type FinanceBill = {
  id: number;
  name: string;
  categories: FinanceCategory[];
};

const getTagHexColor = (tag: string) => {
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
};

const getTagSoftColor = (tag: string) => {
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 95%)`;
};

const extendedFinanceModules = [
  ...financeModules,
  {
    key: 'finance_report',
    title: '财务报表',
    subtitle: '收支占比与趋势',
    endpoint: '',
    fields: [],
    titleField: '',
    detailFields: [],
    icon: 'bar-chart-outline' as any,
    accent: '#10B981',
    emptyText: '',
  },
  {
    key: 'income_analysis',
    title: '收入分析',
    subtitle: '图表与数据统计',
    endpoint: '',
    fields: [],
    titleField: '',
    detailFields: [],
    icon: 'pie-chart-outline' as any,
    accent: '#2563EB',
    emptyText: '',
  }
];

export function FinanceDashboard() {
  return (
    <CrudScreen
      modules={extendedFinanceModules}
      title="财务"
      subtitle="账单、报表、资产与分析"
      renderModule={({ module, onBack }) => {
        if (module.key === 'finances') return <FinanceRecordsScreen onBack={onBack} />;
        if (module.key === 'subscriptions') return <SubscriptionScreen onBack={onBack} />;
        if (module.key === 'guiwu') return <AssetScreen onBack={onBack} />;
        if (module.key === 'finance_report') return <FinanceReportScreen onBack={onBack} />;
        if (module.key === 'income_analysis') return <IncomeAnalysis onBack={onBack} />;
        return null;
      }}
    />
  );
}

function currentWeekValue() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function evaluateAmountExpression(value: string) {
  try {
    const sanitized = value.replace(/[^-()\d/*+.]/g, '');
    if (!sanitized) return '';
    const result = Function(`"use strict"; return (${sanitized});`)();
    const numeric = Number(result);
    if (!Number.isFinite(numeric)) return value;
    return numeric.toFixed(2);
  } catch {
    return value;
  }
}

function formatCurrency(value: number) {
  return `￥${Number(value || 0).toFixed(2)}`;
}

function weekRange(value: string) {
  const [yearRaw, weekRaw] = value.split('-W');
  const year = Number(yearRaw);
  const week = Number(weekRaw);
  if (!year || !week) return null;
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const day = simple.getDay();
  const start = new Date(simple);
  if (day <= 4) start.setDate(simple.getDate() - simple.getDay() + 1);
  else start.setDate(simple.getDate() + 8 - simple.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: todayString(start), end: todayString(end) };
}

function todayString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function FinanceRecordsScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [finances, setFinances] = useState<FinanceItem[]>([]);
  const [expenseTree, setExpenseTree] = useState<FinanceBill[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [billObj, setBillObj] = useState<FinanceBill | null>(null);
  const [categoryObj, setCategoryObj] = useState<FinanceCategory | null>(null);
  const [subcategoryObj, setSubcategoryObj] = useState<FinanceSubcategory | null>(null);
  const [incomeCategory, setIncomeCategory] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(todayDate());
  const [belongMonth, setBelongMonth] = useState(currentMonthValue());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editBillObj, setEditBillObj] = useState<FinanceBill | null>(null);
  const [editCategoryObj, setEditCategoryObj] = useState<FinanceCategory | null>(null);
  const [editSubcategoryObj, setEditSubcategoryObj] = useState<FinanceSubcategory | null>(null);
  const [editIncomeCategory, setEditIncomeCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTransactionDate, setEditTransactionDate] = useState(todayDate());
  const [editBelongMonth, setEditBelongMonth] = useState(currentMonthValue());
  const [reportType, setReportType] = useState('monthly');
  const [expenseChartLevel, setExpenseChartLevel] = useState('category');
  const [chartType, setChartType] = useState('proportion');
  const [proportionType, setProportionType] = useState('pie'); // 'pie' | 'list'
  const [trendType, setTrendType] = useState('line'); // 'line' | 'bar'
  const [reportWeek, setReportWeek] = useState(currentWeekValue());
  const [reportMonth, setReportMonth] = useState(currentMonthValue());
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [customStartDate, setCustomStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return todayString(date);
  });
  const [customEndDate, setCustomEndDate] = useState(todayDate());
  const [selectedReportCategory, setSelectedReportCategory] = useState<string | null>(null);

  const loadStaticData = useCallback(async () => {
    const [tree, configs] = await Promise.all([
      apiRequest<FinanceBill[]>('/finances/tree/bills'),
      apiRequest<any>('/configs/'),
    ]);
    setExpenseTree(Array.isArray(tree) ? tree : []);
    setIncomeCategories(Array.isArray(configs?.finance_income_categories) ? configs.finance_income_categories : []);
  }, []);

  const loadFinances = useCallback(async () => {
    setError(null);
    try {
      const data = await apiRequest<FinanceItem[]>(`/finances/?transaction_type=${activeTab}&limit=1000`);
      setFinances(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载账单失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadStaticData();
  }, [loadStaticData]);

  useEffect(() => {
    setLoading(true);
    setEditingId(null);
    setBillObj(null);
    setCategoryObj(null);
    setSubcategoryObj(null);
    setIncomeCategory('');
    setTransactionDate(todayDate());
    setBelongMonth(currentMonthValue());
    void loadFinances();
  }, [activeTab, loadFinances]);

  useEffect(() => {
    setSelectedReportCategory(null);
  }, [activeTab, reportType, reportWeek, reportMonth, reportYear, customStartDate, customEndDate, expenseChartLevel]);

  const categories = billObj?.categories || [];
  const subcategories = categoryObj?.subcategories || [];
  const editCategories = editBillObj?.categories || [];
  const editSubcategories = editCategoryObj?.subcategories || [];

  const submitPayload = (rawAmount: string, values: {
    billObj: FinanceBill | null;
    categoryObj: FinanceCategory | null;
    subcategoryObj: FinanceSubcategory | null;
    incomeCategory: string;
    description: string;
    transactionDate: string;
    belongMonth: string;
  }) => {
    const finalAmount = Number(evaluateAmountExpression(rawAmount));
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) return null;
    return {
      amount: finalAmount,
      transaction_type: activeTab,
      bill_id: activeTab === 'expense' ? values.billObj?.id ?? null : null,
      category_id: activeTab === 'expense' ? values.categoryObj?.id ?? null : null,
      subcategory_id: activeTab === 'expense' ? values.subcategoryObj?.id ?? null : null,
      bill: activeTab === 'expense' ? values.billObj?.name ?? null : null,
      category: activeTab === 'expense' ? values.categoryObj?.name ?? '其他支出' : values.incomeCategory || '其他收入',
      subcategory: activeTab === 'expense' ? values.subcategoryObj?.name ?? null : null,
      belong_month: values.belongMonth,
      description: values.description.trim() || null,
      transaction_date: values.transactionDate,
    };
  };

  const addFinance = async () => {
    const payload = submitPayload(amount, { billObj, categoryObj, subcategoryObj, incomeCategory, description, transactionDate, belongMonth });
    if (!payload) {
      Alert.alert('金额无效', '请输入有效的金额或算式');
      return;
    }
    await apiRequest('/finances/', { method: 'POST', body: payload });
    setAmount('');
    setDescription('');
    setCategoryObj(null);
    setSubcategoryObj(null);
    if (activeTab === 'income') setIncomeCategory('');
    setTransactionDate(todayDate());
    setBelongMonth(currentMonthValue());
    await loadFinances();
  };

  const startEdit = (item: FinanceItem) => {
    if (editingId === item.id) {
      setEditingId(null);
      return;
    }
    let nextBill: FinanceBill | null = null;
    let nextCategory: FinanceCategory | null = null;
    let nextSubcategory: FinanceSubcategory | null = null;
    if (item.transaction_type === 'expense') {
      nextBill = expenseTree.find((bill) => bill.id === item.bill_id || bill.name === item.bill) || null;
      nextCategory = nextBill?.categories.find((category) => category.id === item.category_id || category.name === item.category) || null;
      nextSubcategory = nextCategory?.subcategories.find((subcategory) => subcategory.id === item.subcategory_id || subcategory.name === item.subcategory) || null;
    }
    setEditingId(item.id);
    setEditAmount(String(item.amount || ''));
    setEditBillObj(nextBill);
    setEditCategoryObj(nextCategory);
    setEditSubcategoryObj(nextSubcategory);
    setEditIncomeCategory(item.category || '');
    setEditDescription(item.description || '');
    setEditTransactionDate(item.transaction_date || todayDate());
    setEditBelongMonth(item.belong_month || currentMonthValue());
  };

  const updateFinance = async (id: number) => {
    const payload = submitPayload(editAmount, {
      billObj: editBillObj,
      categoryObj: editCategoryObj,
      subcategoryObj: editSubcategoryObj,
      incomeCategory: editIncomeCategory,
      description: editDescription,
      transactionDate: editTransactionDate,
      belongMonth: editBelongMonth,
    });
    if (!payload) {
      Alert.alert('金额无效', '请输入有效的金额或算式');
      return;
    }
    await apiRequest(`/finances/${id}`, { method: 'PUT', body: payload });
    setEditingId(null);
    await loadFinances();
  };

  const removeFinance = (item: FinanceItem) => {
    Alert.alert('删除确认', `确定删除这笔${activeTab === 'expense' ? '支出' : '收入'}吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await apiRequest(`/finances/${item.id}`, { method: 'DELETE' });
          if (editingId === item.id) setEditingId(null);
          await loadFinances();
        },
      },
    ]);
  };

  const totalAmount = useMemo(() => finances.reduce((sum, item) => sum + Number(item.amount || 0), 0), [finances]);

  const filteredFinances = useMemo(() => {
    return finances.filter((item) => {
      const date = item.transaction_date;
      if (!date) return true;
      if (reportType === 'weekly') {
        const range = weekRange(reportWeek);
        if (!range) return true;
        return date >= range.start && date <= range.end;
      }
      if (reportType === 'monthly') return date.startsWith(reportMonth);
      if (reportType === 'yearly') return date.startsWith(reportYear);
      if (reportType === 'custom') return (!customStartDate || date >= customStartDate) && (!customEndDate || date <= customEndDate);
      return true;
    });
  }, [finances, reportType, reportWeek, reportMonth, reportYear, customStartDate, customEndDate]);

  const groupKey = useCallback((item: FinanceItem) => {
    if (activeTab === 'expense') {
      if (expenseChartLevel === 'bill') return item.bill || item.category || '未分类';
      if (expenseChartLevel === 'subcategory') return item.subcategory || item.category || '未分类';
      return item.category || '未分类';
    }
    return item.category || '未分类';
  }, [activeTab, expenseChartLevel]);

  const displayFinances = useMemo(() => {
    if (!selectedReportCategory) return finances;
    return filteredFinances.filter((item) => groupKey(item) === selectedReportCategory);
  }, [finances, filteredFinances, selectedReportCategory, groupKey]);

  const displayTotalAmount = displayFinances.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const filteredTotalAmount = filteredFinances.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const categoryData = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredFinances.forEach((item) => {
      const key = groupKey(item);
      grouped.set(key, (grouped.get(key) || 0) + Number(item.amount || 0));
    });
    return [...grouped.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredFinances, groupKey]);

  const trendData = useMemo(() => {
    const scoped = selectedReportCategory ? filteredFinances.filter((item) => groupKey(item) === selectedReportCategory) : filteredFinances;
    const grouped = new Map<string, number>();
    scoped.forEach((item) => {
      const key = activeTab === 'income'
        ? item.belong_month || item.transaction_date.slice(0, 7)
        : (reportType === 'yearly' ? item.transaction_date.slice(0, 7) : item.transaction_date);
      grouped.set(key, (grouped.get(key) || 0) + Number(item.amount || 0));
    });
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
  }, [activeTab, filteredFinances, groupKey, reportType, selectedReportCategory]);

  if (loading || error) {
    return (
      <Screen>
        <Header title="账单" action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />} />
        <StateView loading={loading} error={error} onRetry={loadFinances} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="账单"
        subtitle={`${finances.length} 笔 · ${activeTab === 'expense' ? '总支出' : '总收入'} ${formatCurrency(totalAmount)}`}
        action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />}
      />
      <ScrollView
        contentContainerStyle={styles.financeContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadFinances(); }} />}>
        <SegmentedControl value={activeTab} onChange={(value) => setActiveTab(value as 'expense' | 'income')} options={[{ label: '支出清单', value: 'expense' }, { label: '收入清单', value: 'income' }]} />

        <View style={styles.billPanel}>
          <Text style={styles.billPanelTitle}>新增{activeTab === 'expense' ? '支出' : '收入'}</Text>
          <View style={styles.amountRow}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              onBlur={() => setAmount((current) => evaluateAmountExpression(current))}
              placeholder="金额，可输入 12+8/2"
              placeholderTextColor={colors.faint}
              keyboardType="numbers-and-punctuation"
              style={styles.amountInput}
            />
            <View style={styles.dateColumn}>
              <DateField label="日期" value={transactionDate} onChangeText={setTransactionDate} />
            </View>
          </View>
          {activeTab === 'income' ? (
            <>
              <DateField label="归属月份" value={belongMonth} onChangeText={setBelongMonth} mode="month" />
              <PillSelector
                label="收入类别"
                value={incomeCategory}
                options={incomeCategories}
                onChange={setIncomeCategory}
                fallback="其他收入"
                accent={colors.success}
              />
            </>
          ) : (
            <>
              <PillSelector label="账本" value={billObj?.name || ''} options={expenseTree.map((bill) => bill.name)} onChange={(name) => { const found = expenseTree.find((bill) => bill.name === name) || null; setBillObj(found); setCategoryObj(null); setSubcategoryObj(null); }} fallback="未选择账本" accent={colors.danger} />
              <PillSelector label="类别" value={categoryObj?.name || ''} options={categories.map((category) => category.name)} onChange={(name) => { const found = categories.find((category) => category.name === name) || null; setCategoryObj(found); setSubcategoryObj(null); }} fallback="其他支出" accent={colors.danger} />
              {subcategories.length > 0 ? <PillSelector label="子类别" value={subcategoryObj?.name || ''} options={subcategories.map((subcategory) => subcategory.name)} onChange={(name) => setSubcategoryObj(subcategories.find((subcategory) => subcategory.name === name) || null)} fallback="无子类别" accent={colors.danger} /> : null}
            </>
          )}
          <TextInput value={description} onChangeText={setDescription} placeholder="备注说明" placeholderTextColor={colors.faint} style={styles.fullInput} />
          <PrimaryButton label="添加账单" icon="add" disabled={!amount.trim()} onPress={() => void addFinance()} />
        </View>

        <View style={styles.billSummaryRow}>
          <View style={styles.billSummaryCard}>
            <Text style={styles.billSummaryLabel}>总支出 / 总收入</Text>
            <Text style={[styles.billSummaryValue, { color: activeTab === 'expense' ? colors.danger : colors.success }]}>{activeTab === 'expense' ? '-' : '+'}{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.billList}>
          {displayFinances.length === 0 ? (
            <View style={styles.emptyBillCard}>
              <Text style={styles.emptyBillIcon}>💸</Text>
              <Text style={styles.emptyBillText}>暂无账单记录</Text>
            </View>
          ) : (
            displayFinances.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <View key={item.id} style={styles.billCard}>
                  <View style={styles.billCardHeader}>
                    <View style={styles.flex}>
                      <View style={styles.billCardTitleRow}>
                        <Text style={[styles.billAmount, { color: activeTab === 'expense' ? colors.danger : colors.success }]}>{activeTab === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}</Text>
                        <Text style={styles.billDate}>{item.transaction_date}</Text>
                      </View>
                      <Text style={styles.billCategory}>{[item.bill, item.category, item.subcategory].filter(Boolean).join(' / ') || '未分类'}</Text>
                      {item.description ? <Text style={styles.billDescription}>{item.description}</Text> : null}
                      {activeTab === 'income' && item.belong_month ? <Text style={styles.billDescription}>归属月份：{item.belong_month}</Text> : null}
                    </View>
                    <View style={styles.billActions}>
                      <IconButton name="create-outline" label="编辑" onPress={() => startEdit(item)} />
                      <IconButton name="trash-outline" label="删除" color={colors.danger} onPress={() => removeFinance(item)} />
                    </View>
                  </View>
                  {isEditing ? (
                    <View style={styles.editPanel}>
                      <View style={styles.amountRow}>
                        <TextInput value={editAmount} onChangeText={setEditAmount} onBlur={() => setEditAmount((current) => evaluateAmountExpression(current))} style={styles.amountInput} />
                        <View style={styles.dateColumn}>
                          <DateField label="日期" value={editTransactionDate} onChangeText={setEditTransactionDate} />
                        </View>
                      </View>
                      {activeTab === 'income' ? (
                        <>
                          <DateField label="归属月份" value={editBelongMonth} onChangeText={setEditBelongMonth} mode="month" />
                          <PillSelector label="收入类别" value={editIncomeCategory} options={incomeCategories} onChange={setEditIncomeCategory} fallback="其他收入" accent={colors.success} />
                        </>
                      ) : (
                        <>
                          <PillSelector label="账本" value={editBillObj?.name || ''} options={expenseTree.map((bill) => bill.name)} onChange={(name) => { const found = expenseTree.find((bill) => bill.name === name) || null; setEditBillObj(found); setEditCategoryObj(null); setEditSubcategoryObj(null); }} fallback="未选择账本" accent={colors.danger} />
                          <PillSelector label="类别" value={editCategoryObj?.name || ''} options={editCategories.map((category) => category.name)} onChange={(name) => { const found = editCategories.find((category) => category.name === name) || null; setEditCategoryObj(found); setEditSubcategoryObj(null); }} fallback="其他支出" accent={colors.danger} />
                          {editSubcategories.length > 0 ? <PillSelector label="子类别" value={editSubcategoryObj?.name || ''} options={editSubcategories.map((subcategory) => subcategory.name)} onChange={(name) => setEditSubcategoryObj(editSubcategories.find((subcategory) => subcategory.name === name) || null)} fallback="无子类别" accent={colors.danger} /> : null}
                        </>
                      )}
                      <TextInput value={editDescription} onChangeText={setEditDescription} placeholder="备注说明" placeholderTextColor={colors.faint} style={styles.fullInput} />
                      <View style={styles.editActions}>
                        <PrimaryButton label="取消" tone="plain" onPress={() => setEditingId(null)} />
                        <PrimaryButton label="保存修改" icon="checkmark" onPress={() => void updateFinance(item.id)} />
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function FinanceReportScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [finances, setFinances] = useState<FinanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [reportType, setReportType] = useState('monthly');
  const [expenseChartLevel, setExpenseChartLevel] = useState('category');
  const [chartType, setChartType] = useState('proportion');
  const [proportionType, setProportionType] = useState('pie');
  const [trendType, setTrendType] = useState('line');
  const [reportWeek, setReportWeek] = useState(currentWeekValue());
  const [reportMonth, setReportMonth] = useState(currentMonthValue());
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [customStartDate, setCustomStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return todayString(date);
  });
  const [customEndDate, setCustomEndDate] = useState(todayDate());
  const [selectedReportCategory, setSelectedReportCategory] = useState<string | null>(null);

  const loadFinances = useCallback(async () => {
    setError(null);
    try {
      const [expenseData, incomeData] = await Promise.all([
        apiRequest<FinanceItem[]>('/finances/?transaction_type=expense&limit=2000'),
        apiRequest<FinanceItem[]>('/finances/?transaction_type=income&limit=2000'),
      ]);
      const allFinances = [
        ...(Array.isArray(expenseData) ? expenseData : []),
        ...(Array.isArray(incomeData) ? incomeData : [])
      ];
      setFinances(allFinances);
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

  const tabFinances = useMemo(() => {
    return finances.filter(item => item.transaction_type === activeTab);
  }, [finances, activeTab]);

  const filteredFinances = useMemo(() => {
    return tabFinances.filter((item) => {
      const date = item.transaction_date;
      if (!date) return true;
      if (reportType === 'weekly') {
        const range = weekRange(reportWeek);
        if (!range) return true;
        return date >= range.start && date <= range.end;
      }
      if (reportType === 'monthly') return date.startsWith(reportMonth);
      if (reportType === 'yearly') return date.startsWith(reportYear);
      if (reportType === 'custom') return (!customStartDate || date >= customStartDate) && (!customEndDate || date <= customEndDate);
      return true;
    });
  }, [tabFinances, reportType, reportWeek, reportMonth, reportYear, customStartDate, customEndDate]);

  const globalFilteredFinances = useMemo(() => {
    return finances.filter((item) => {
      const date = item.transaction_date;
      if (!date) return true;
      if (reportType === 'weekly') {
        const range = weekRange(reportWeek);
        if (!range) return true;
        return date >= range.start && date <= range.end;
      }
      if (reportType === 'monthly') return date.startsWith(reportMonth);
      if (reportType === 'yearly') return date.startsWith(reportYear);
      if (reportType === 'custom') return (!customStartDate || date >= customStartDate) && (!customEndDate || date <= customEndDate);
      return true;
    });
  }, [finances, reportType, reportWeek, reportMonth, reportYear, customStartDate, customEndDate]);

  const totalExpense = useMemo(() => globalFilteredFinances.filter(i => i.transaction_type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0), [globalFilteredFinances]);
  const totalIncome = useMemo(() => globalFilteredFinances.filter(i => i.transaction_type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0), [globalFilteredFinances]);
  const netBalance = totalIncome - totalExpense;

  const groupKey = useCallback((item: FinanceItem) => {
    if (activeTab === 'expense') {
      if (expenseChartLevel === 'bill') return item.bill || item.category || '未分类';
      if (expenseChartLevel === 'subcategory') return item.subcategory || item.category || '未分类';
      return item.category || '未分类';
    }
    return item.category || '未分类';
  }, [activeTab, expenseChartLevel]);

  const filteredTotalAmount = filteredFinances.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const categoryData = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredFinances.forEach((item) => {
      const key = groupKey(item);
      grouped.set(key, (grouped.get(key) || 0) + Number(item.amount || 0));
    });
    return [...grouped.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredFinances, groupKey]);

  const trendData = useMemo(() => {
    const scoped = selectedReportCategory ? filteredFinances.filter((item) => groupKey(item) === selectedReportCategory) : filteredFinances;
    const grouped = new Map<string, number>();
    scoped.forEach((item) => {
      const key = activeTab === 'income'
        ? item.belong_month || item.transaction_date.slice(0, 7)
        : (reportType === 'yearly' ? item.transaction_date.slice(0, 7) : item.transaction_date);
      grouped.set(key, (grouped.get(key) || 0) + Number(item.amount || 0));
    });
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
  }, [activeTab, filteredFinances, groupKey, reportType, selectedReportCategory]);

  if (loading || error) {
    return (
      <Screen>
        <Header title="财务报表" action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />} />
        <StateView loading={loading} error={error} onRetry={loadFinances} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="财务报表"
        subtitle="收支占比与趋势分析"
        action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />}
      />
      <ScrollView
        contentContainerStyle={styles.financeContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadFinances(); }} />}
      >
        <View style={styles.grid}>
          <View style={[styles.statCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Text style={[styles.statLabel, { color: '#2563eb' }]}>结余</Text>
            <Text style={[styles.statValueBig, { color: netBalance >= 0 ? '#16a34a' : '#dc2626' }]}>
              {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
            </Text>
          </View>
          <View style={styles.statCardSmallRow}>
            <View style={styles.statCardSmall}>
              <Text style={styles.statLabelSmall}>总收入</Text>
              <Text style={[styles.statValueSmall, { color: '#16a34a' }]}>+{formatCurrency(totalIncome)}</Text>
            </View>
            <View style={styles.statCardSmall}>
              <Text style={styles.statLabelSmall}>总支出</Text>
              <Text style={[styles.statValueSmall, { color: '#dc2626' }]}>-{formatCurrency(totalExpense)}</Text>
            </View>
          </View>
        </View>

        <SegmentedControl 
          value={activeTab} 
          onChange={(value) => setActiveTab(value as 'expense' | 'income')} 
          options={[{ label: '支出报表', value: 'expense' }, { label: '收入报表', value: 'income' }]} 
        />

        <FinanceReport
          activeTab={activeTab}
          reportType={reportType}
          setReportType={setReportType}
          reportWeek={reportWeek}
          setReportWeek={setReportWeek}
          reportMonth={reportMonth}
          setReportMonth={setReportMonth}
          reportYear={reportYear}
          setReportYear={setReportYear}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          expenseChartLevel={expenseChartLevel}
          setExpenseChartLevel={setExpenseChartLevel}
          chartType={chartType}
          setChartType={setChartType}
          proportionType={proportionType}
          setProportionType={setProportionType}
          trendType={trendType}
          setTrendType={setTrendType}
          categoryData={categoryData}
          trendData={trendData}
          selectedReportCategory={selectedReportCategory}
          setSelectedReportCategory={setSelectedReportCategory}
          filteredTotalAmount={filteredTotalAmount}
        />
      </ScrollView>
    </Screen>
  );
}

function PillSelector({
  label,
  value,
  options,
  onChange,
  fallback,
  accent,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  fallback: string;
  accent: string;
}) {
  return (
    <View style={styles.pillSection}>
      <Text style={styles.pillSectionLabel}>{label}</Text>
      {options.length === 0 ? (
        <Text style={styles.pillEmpty}>{fallback}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
          {options.map((option) => {
            const selected = option === value;
            return (
              <Pressable key={option} onPress={() => onChange(option)} style={[styles.financePill, selected && { backgroundColor: accent, borderColor: accent }]}>
                <Text style={[styles.financePillText, selected && styles.financePillTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function FinanceReport({
  activeTab,
  reportType,
  setReportType,
  reportWeek,
  setReportWeek,
  reportMonth,
  setReportMonth,
  reportYear,
  setReportYear,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  expenseChartLevel,
  setExpenseChartLevel,
  chartType,
  setChartType,
  proportionType,
  setProportionType,
  trendType,
  setTrendType,
  categoryData,
  trendData,
  selectedReportCategory,
  setSelectedReportCategory,
  filteredTotalAmount,
}: any) {
  const chartDataset = trendData.length > 0 ? {
    labels: trendData.slice(-8).map((item: any) => String(item.date).slice(-5)),
    datasets: [{ data: trendData.slice(-8).map((item: any) => Number(item.value || 0)) }],
  } : { labels: ['无数据'], datasets: [{ data: [0] }] };

  const pieData = categoryData.map((item: any) => ({
    name: item.name,
    population: item.value,
    color: getTagHexColor(item.name),
    legendFontColor: '#6B7280',
    legendFontSize: 12,
  }));

  return (
    <View style={styles.reportPanel}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>数据报表</Text>
        <SegmentedControl value={reportType} onChange={setReportType} options={[{ label: '周', value: 'weekly' }, { label: '月', value: 'monthly' }, { label: '年', value: 'yearly' }, { label: '自定义', value: 'custom' }]} />
      </View>
      {reportType === 'weekly' ? <TextInput value={reportWeek} onChangeText={setReportWeek} style={styles.fullInput} /> : null}
      {reportType === 'monthly' ? <DateField label="月份" value={reportMonth} onChangeText={setReportMonth} mode="month" /> : null}
      {reportType === 'yearly' ? <TextInput value={reportYear} onChangeText={setReportYear} style={styles.fullInput} keyboardType="numeric" /> : null}
      {reportType === 'custom' ? (
        <View style={styles.amountRow}>
          <View style={styles.formColumn}>
            <DateField label="开始日期" value={customStartDate} onChangeText={setCustomStartDate} />
          </View>
          <View style={styles.formColumn}>
            <DateField label="结束日期" value={customEndDate} onChangeText={setCustomEndDate} />
          </View>
        </View>
      ) : null}

      <View style={styles.reportTotalBox}>
        <Text style={styles.billSummaryLabel}>本期{activeTab === 'expense' ? '总支出' : '总收入'}</Text>
        <Text style={[styles.billSummaryValue, { color: activeTab === 'expense' ? colors.danger : colors.success }]}>{activeTab === 'expense' ? '-' : '+'}{formatCurrency(filteredTotalAmount)}</Text>
      </View>

      <SegmentedControl value={chartType} onChange={setChartType} options={[{ label: '占比', value: 'proportion' }, { label: '趋势', value: 'trend' }]} />
      
      {chartType === 'proportion' && (
        <SegmentedControl value={proportionType} onChange={setProportionType} options={[{ label: '饼图', value: 'pie' }, { label: '列表', value: 'list' }]} />
      )}
      {chartType === 'trend' && (
        <SegmentedControl value={trendType} onChange={setTrendType} options={[{ label: '折线图', value: 'line' }, { label: '柱状图', value: 'bar' }]} />
      )}

      {activeTab === 'expense' && chartType === 'proportion' ? (
        <SegmentedControl value={expenseChartLevel} onChange={setExpenseChartLevel} options={[{ label: '账单', value: 'bill' }, { label: '类别', value: 'category' }, { label: '子类别', value: 'subcategory' }]} />
      ) : null}

      {chartType === 'trend' ? (
        <View style={styles.chartContainerCompact}>
          {trendType === 'line' ? (
            <LineChart
              data={chartDataset}
              width={screenWidth - spacing.lg * 4}
              height={190}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => activeTab === 'expense' ? `rgba(220, 38, 38, ${opacity})` : `rgba(5, 150, 105, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                propsForDots: { r: '3' },
              }}
              bezier
              style={styles.chartStyle}
              formatYLabel={(value) => Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(1)}k` : String(Number(value).toFixed(0))}
            />
          ) : (
            <BarChart
              data={chartDataset}
              width={screenWidth - spacing.lg * 4}
              height={190}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => activeTab === 'expense' ? `rgba(220, 38, 38, ${opacity})` : `rgba(5, 150, 105, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              }}
              style={styles.chartStyle}
              yAxisLabel=""
              yAxisSuffix=""
              showBarTops={false}
              fromZero
            />
          )}
        </View>
      ) : (
        <View style={styles.breakdownList}>
          {proportionType === 'pie' && categoryData.length > 0 && (
            <View style={styles.chartContainerCompact}>
              <PieChart
                data={pieData}
                width={screenWidth - spacing.lg * 4}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
              />
            </View>
          )}
          {categoryData.length === 0 ? <Text style={styles.emptyBillText}>暂无图表数据</Text> : categoryData.map((item: any) => {
            const percent = filteredTotalAmount > 0 ? item.value / filteredTotalAmount : 0;
            const selected = selectedReportCategory === item.name;
            return (
              <Pressable key={item.name} onPress={() => setSelectedReportCategory(selected ? null : item.name)} style={[styles.breakdownItem, selected && styles.breakdownItemSelected]}>
                <View style={styles.breakdownTop}>
                  <Text style={styles.breakdownName}>{item.name}</Text>
                  <Text style={styles.breakdownAmount}>{formatCurrency(item.value)}</Text>
                </View>
                <View style={styles.breakdownTrack}>
                  <View style={[styles.breakdownFill, { width: `${Math.max(3, percent * 100)}%`, backgroundColor: getTagHexColor(item.name) }]} />
                </View>
                <Text style={styles.breakdownPercent}>{(percent * 100).toFixed(1)}%</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function IncomeAnalysis({ onBack }: { onBack: () => void }) {
  const [incomes, setIncomes] = useState<FinanceItem[]>([]);
  const [configs, setConfigs] = useState<any>({
    finance_income_categories: [],
    finance_income_net_cats: [],
    finance_income_total_cats: [],
    finance_income_gross_cats: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const [netStatsMonth, setNetStatsMonth] = useState(currentMonth);
  const [projectionMonth, setProjectionMonth] = useState(currentMonth);
  const [chartMonth, setChartMonth] = useState(currentMonth);
  const [categoryEndMonths, setCategoryEndMonths] = useState<Record<string, string>>({});
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [incomesData, configsData] = await Promise.all([
        apiRequest<FinanceItem[]>('/finances/?transaction_type=income&limit=2000'),
        apiRequest<any>('/configs/')
      ]);
      const incArray = Array.isArray(incomesData) ? incomesData : [];
      setIncomes(incArray);
      
      const normalizedConfigs = normalizeIncomeConfig(configsData);
      setConfigs(normalizedConfigs);

      // Initialize category end months
      const catMonths: Record<string, string> = {};
      normalizedConfigs.finance_income_categories.forEach((cat: string) => {
        catMonths[cat] = currentMonth;
      });
      setCategoryEndMonths(prev => Object.keys(prev).length > 0 ? prev : catMonths);
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

  const handleCategoryMonthChange = (cat: string, month: string) => {
    setCategoryEndMonths(prev => ({ ...prev, [cat]: month }));
  };

  const getMonthsDiff = useCallback((startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 1;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    return Math.max(1, months);
  }, []);

  const getBaseDate = useCallback(() => {
    if (!incomes || incomes.length === 0) return new Date().toISOString().slice(0, 10);
    let earliest = incomes[0].belong_month || incomes[0].transaction_date;
    incomes.forEach(i => {
      const d = i.belong_month || i.transaction_date;
      if (d && d < earliest) earliest = d;
    });
    return earliest;
  }, [incomes]);

  const isNetCategory = useCallback((cat: string) => configs.finance_income_net_cats.includes(cat), [configs]);
  const isTotalCategory = useCallback((cat: string) => configs.finance_income_total_cats.includes(cat), [configs]);
  const isGrossCategory = useCallback((cat: string) => configs.finance_income_gross_cats.includes(cat), [configs]);

  const netStats = useMemo(() => {
    let netTotal = 0;
    let totalIncome = 0;
    let grossTotal = 0;

    const cutoff = netStatsMonth + '-31';
    
    incomes.forEach(item => {
      const date = item.belong_month || item.transaction_date;
      if (date <= cutoff) {
        const cat = item.category || '';
        const isNet = isNetCategory(cat);
        const isTotal = isTotalCategory(cat);
        const isGross = isGrossCategory(cat);
        if (isNet || isTotal || isGross) {
          grossTotal += Number(item.amount || 0);
        }
        if (isNet || isTotal) {
          totalIncome += Number(item.amount || 0);
        }
        if (isNet) {
          netTotal += Number(item.amount || 0);
        }
      }
    });

    return { netTotal, totalIncome, grossTotal };
  }, [incomes, isGrossCategory, isNetCategory, isTotalCategory, netStatsMonth]);

  const projectionStats = useMemo(() => {
    const baseDate = getBaseDate();
    const cutoff = projectionMonth + '-31';
    const totalMonths = getMonthsDiff(baseDate, cutoff);

    let netSum = 0;
    let totalSum = 0;
    let grossSum = 0;

    incomes.forEach(item => {
      const date = item.belong_month || item.transaction_date;
      if (date <= cutoff) {
        const cat = item.category || '';
        const isNet = isNetCategory(cat);
        const isTotal = isTotalCategory(cat);
        const isGross = isGrossCategory(cat);
        if (isNet || isTotal || isGross) {
          grossSum += Number(item.amount || 0);
        }
        if (isNet || isTotal) {
          totalSum += Number(item.amount || 0);
        }
        if (isNet) {
          netSum += Number(item.amount || 0);
        }
      }
    });

    const avgMonthlyNet = netSum / totalMonths;
    const avgMonthlyTotal = totalSum / totalMonths;
    const avgMonthlyGross = grossSum / totalMonths;

    return {
      avgMonthlyNet,
      avgMonthlyTotal,
      avgMonthlyGross,
      annualNetProjection: avgMonthlyNet * 12,
      annualTotalProjection: avgMonthlyTotal * 12,
      annualGrossProjection: avgMonthlyGross * 12,
      totalMonths
    };
  }, [getBaseDate, getMonthsDiff, incomes, isGrossCategory, isNetCategory, isTotalCategory, projectionMonth]);

  const categoryStatsData = useMemo(() => {
    const baseDate = getBaseDate();
    const stats: Record<string, any> = {};

    configs.finance_income_categories.forEach((cat: string) => {
      const cutoffMonth = categoryEndMonths[cat] || currentMonth;
      const cutoff = cutoffMonth + '-31';
      const totalMonths = getMonthsDiff(baseDate, cutoff);
      
      let actual = 0;
      incomes.forEach(item => {
        if (item.category === cat && (item.belong_month || item.transaction_date) <= cutoff) {
          actual += Number(item.amount || 0);
        }
      });

      const avg = actual / totalMonths;
      stats[cat] = {
        actual,
        avg,
        projection: avg * 12,
        currentMonth: cutoffMonth
      };
    });
    return stats;
  }, [categoryEndMonths, configs, currentMonth, getBaseDate, getMonthsDiff, incomes]);

  const categoryAggregates = useMemo(() => {
    let avgNet = 0;
    let avgTotal = 0;
    let avgGross = 0;

    configs.finance_income_categories.forEach((cat: string) => {
      const avg = categoryStatsData[cat]?.avg || 0;
      avgGross += avg;
      if (configs.finance_income_net_cats.includes(cat)) {
        avgNet += avg;
        avgTotal += avg;
      } else if (configs.finance_income_total_cats.includes(cat)) {
        avgTotal += avg;
      }
    });

    return {
      avgNet,
      avgTotal,
      avgGross,
      annualNet: avgNet * 12,
      annualTotal: avgTotal * 12,
      annualGross: avgGross * 12
    };
  }, [configs, categoryStatsData]);

  // Chart Data
  const chartDataObj = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    const cutoff = chartMonth + '-31';
    
    incomes.forEach(item => {
      const dateStr = item.belong_month || item.transaction_date;
      if (dateStr <= cutoff) {
        const cat = item.category || '';
        if (filterCategory && cat !== filterCategory) return;
        if (!filterCategory && !isNetCategory(cat)) return;
        
        const month = dateStr.slice(0, 7);
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(item.amount || 0));
      }
    });

    const trend = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
      
    if (trend.length === 0) {
      return { labels: ['无数据'], datasets: [{ data: [0] }] };
    }
    
    return {
      labels: trend.map(t => t.month.slice(5, 7) + '月'), // Display just the month, e.g., '05月'
      datasets: [{
        data: trend.map(t => t.total),
        color: (opacity = 1) => filterCategory ? getTagHexColor(filterCategory) : `rgba(37, 99, 235, ${opacity})`,
        strokeWidth: 3
      }]
    };
  }, [chartMonth, filterCategory, incomes, isNetCategory]);

  if (loading || error) {
    return (
      <Screen>
        <Header
          title="收入分析"
          action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />}
        />
        <StateView loading={loading} error={error} onRetry={load} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="收入分析"
        subtitle={`最早记录：${getBaseDate().slice(0, 7).replace('-', '年')}月  |  统计月数：${projectionStats.totalMonths} 个月`}
        action={<IconButton name="chevron-back" label="返回模块列表" soft onPress={onBack} />}
      />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>🐷 实发到账统计</Text>
        <View style={styles.monthPickerCompact}>
          <DateField label="截止" value={netStatsMonth} onChangeText={setNetStatsMonth} mode="month" />
        </View>
      </View>
      
      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <Text style={[styles.statLabel, { color: '#16a34a' }]}>到手总额</Text>
          <Text style={styles.statValueBig}>¥{netStats.netTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
          <Text style={styles.statNote}>仅含到手类别</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>总收入 (含福利)</Text>
          <Text style={styles.statValue}>¥{netStats.totalIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>全包总额</Text>
          <Text style={styles.statValue}>¥{netStats.grossTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
        </View>
      </View>

      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl }]}>
        <Text style={styles.sectionTitle}>📈 未来年度预估</Text>
        <View style={styles.monthPickerCompact}>
          <DateField label="截止" value={projectionMonth} onChangeText={setProjectionMonth} mode="month" />
        </View>
      </View>
      
      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
          <Text style={[styles.statLabel, { color: '#2563eb' }]}>年度到手预估</Text>
          <Text style={[styles.statValueBig, { color: '#1d4ed8' }]}>¥{projectionStats.annualNetProjection.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
          <Text style={styles.statNote}>到手月均 * 12</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>年度总收入预估</Text>
          <Text style={styles.statValue}>¥{projectionStats.annualTotalProjection.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>年度全包预估</Text>
          <Text style={styles.statValue}>¥{projectionStats.annualGrossProjection.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
        </View>
        
        <View style={styles.statCardSmallRow}>
          <View style={styles.statCardSmall}>
            <Text style={styles.statLabelSmall}>月均到手</Text>
            <Text style={styles.statValueSmall}>¥{projectionStats.avgMonthlyNet.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
          </View>
          <View style={styles.statCardSmall}>
            <Text style={styles.statLabelSmall}>月均总收入</Text>
            <Text style={styles.statValueSmall}>¥{projectionStats.avgMonthlyTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
          </View>
          <View style={styles.statCardSmall}>
            <Text style={styles.statLabelSmall}>月均全包</Text>
            <Text style={styles.statValueSmall}>¥{projectionStats.avgMonthlyGross.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>🥧 分类详细统计</Text>
      {configs.finance_income_categories.map((cat: string) => {
        const displayData = categoryStatsData[cat];
        if (!displayData) return null;
        const hex = getTagHexColor(cat);
        const softHex = getTagSoftColor(cat);
        return (
          <View key={cat} style={[styles.categoryCard, { borderColor: softHex }]}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: softHex }]}>
                <Text style={[styles.categoryBadgeText, { color: hex }]}>{cat}</Text>
              </View>
              <View style={styles.monthPickerCompact}>
                <DateField label="截止" value={displayData.currentMonth} onChangeText={(val) => handleCategoryMonthChange(cat, val)} mode="month" />
              </View>
            </View>
            <View style={styles.categoryStatsRow}>
              <View style={styles.categoryStatCol}>
                <Text style={styles.categoryStatLabel}>累计已收</Text>
                <Text style={styles.categoryStatValue}>¥{displayData.actual.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
              </View>
              <View style={styles.categoryStatCol}>
                <Text style={styles.categoryStatLabel}>月均收入</Text>
                <Text style={[styles.categoryStatValue, { color: '#16a34a' }]}>¥{displayData.avg.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
              </View>
            </View>
            <View style={styles.categoryProjectionRow}>
              <Text style={styles.categoryProjectionLabel}>年度预估 (至 {displayData.currentMonth})</Text>
              <Text style={styles.categoryProjectionValue}>¥{displayData.projection.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
            </View>
          </View>
        );
      })}

      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>📊 类别汇总</Text>
      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
          <Text style={[styles.statLabel, { color: '#2563eb' }]}>月均汇总 - 到手</Text>
          <Text style={[styles.statValueBig, { color: '#1d4ed8' }]}>¥{categoryAggregates.avgNet.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
          <View style={styles.statCardSmallRow}>
            <View style={styles.categoryStatCol}>
              <Text style={styles.statLabelSmall}>总收入</Text>
              <Text style={styles.statValueSmall}>¥{categoryAggregates.avgTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
            </View>
            <View style={styles.categoryStatCol}>
              <Text style={styles.statLabelSmall}>全包</Text>
              <Text style={styles.statValueSmall}>¥{categoryAggregates.avgGross.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <Text style={[styles.statLabel, { color: '#16a34a' }]}>年度预估汇总 - 到手</Text>
          <Text style={[styles.statValueBig, { color: '#15803d' }]}>¥{categoryAggregates.annualNet.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
          <View style={styles.statCardSmallRow}>
            <View style={styles.categoryStatCol}>
              <Text style={styles.statLabelSmall}>总收入</Text>
              <Text style={styles.statValueSmall}>¥{categoryAggregates.annualTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
            </View>
            <View style={styles.categoryStatCol}>
              <Text style={styles.statLabelSmall}>全包</Text>
              <Text style={styles.statValueSmall}>¥{categoryAggregates.annualGross.toLocaleString(undefined, {maximumFractionDigits: 0})}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 图表模块 */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl, flexDirection: 'column', alignItems: 'flex-start', gap: spacing.md }]}>
        <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>📅 收入规律图</Text>
          <View style={styles.monthPickerCompact}>
            <DateField label="截止" value={chartMonth} onChangeText={setChartMonth} mode="month" />
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartFilterScroll}>
          <Pressable 
            onPress={() => setFilterCategory(null)}
            style={[
              styles.chartFilterBtn,
              filterCategory === null ? { backgroundColor: '#2563eb', borderColor: '#2563eb' } : null
            ]}
          >
            <Text style={[styles.chartFilterBtnText, filterCategory === null ? { color: '#fff' } : null]}>到手合计</Text>
          </Pressable>
          
          {configs.finance_income_categories.map((cat: string) => {
            const isSelected = filterCategory === cat;
            const hex = getTagHexColor(cat);
            return (
              <Pressable
                key={cat}
                onPress={() => setFilterCategory(cat)}
                style={[
                  styles.chartFilterBtn,
                  { borderColor: hex },
                  isSelected ? { backgroundColor: hex } : null
                ]}
              >
                <Text style={[
                  styles.chartFilterBtnText,
                  { color: isSelected ? '#fff' : hex }
                ]}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartDataObj}
          width={screenWidth - spacing.lg * 2}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => filterCategory ? getTagHexColor(filterCategory) : `rgba(37, 99, 235, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: filterCategory ? getTagHexColor(filterCategory) : '#2563eb'
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
          formatYLabel={(val) => {
            const num = Number(val);
            return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : String(num);
          }}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : spacing.xl,
    paddingBottom: spacing.xs,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerInfo: {
    marginBottom: spacing.xl,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSoft,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 0,
  },
  datePickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePickerLabel: {
    fontSize: 12,
    color: colors.muted,
    marginRight: 6,
  },
  datePickerInput: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    width: 66,
    padding: 0,
    margin: 0,
    textAlign: 'center',
  },
  grid: {
    gap: spacing.sm,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSoft,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  statValueBig: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
  },
  statNote: {
    fontSize: 11,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  statCardSmallRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabelSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSoft,
    marginBottom: 2,
  },
  statValueSmall: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    ...shadow,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  categoryStatsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  categoryStatCol: {
    flex: 1,
  },
  categoryStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSoft,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  categoryStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  categoryProjectionRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryProjectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSoft,
  },
  categoryProjectionValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2563eb',
  },
  chartFilterScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  chartFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chartFilterBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSoft,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
    alignItems: 'center',
  },
  financeContent: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  billPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadow,
  },
  billPanelTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  amountRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateColumn: {
    flex: 1,
  },
  formColumn: {
    flex: 1,
  },
  monthPickerCompact: {
    minWidth: 150,
  },
  amountInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  compactInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    color: colors.text,
    fontSize: 14,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    width: 132,
  },
  fullInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    color: colors.text,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
  },
  pillSection: {
    gap: spacing.sm,
  },
  pillSectionLabel: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '900',
  },
  pillEmpty: {
    color: colors.faint,
    fontSize: 13,
    fontWeight: '700',
  },
  pillScroll: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  financePill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  financePillText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '800',
  },
  financePillTextSelected: {
    color: '#fff',
  },
  billSummaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  billSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    flex: 1,
    padding: spacing.lg,
    ...shadow,
  },
  billSummaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  billSummaryValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  reportPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
    ...shadow,
  },
  reportHeader: {
    gap: spacing.sm,
  },
  reportTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  reportTotalBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  chartContainerCompact: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chartStyle: {
    borderRadius: radius.xl,
    marginVertical: spacing.sm,
  },
  breakdownList: {
    gap: spacing.sm,
  },
  breakdownItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  breakdownItemSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  breakdownTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  breakdownName: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
  },
  breakdownAmount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  breakdownTrack: {
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    height: 8,
    overflow: 'hidden',
  },
  breakdownFill: {
    borderRadius: 9999,
    height: '100%',
  },
  breakdownPercent: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  billList: {
    gap: spacing.md,
  },
  billCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: spacing.lg,
    ...shadow,
  },
  billCardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  billCardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  billAmount: {
    fontSize: 19,
    fontWeight: '900',
  },
  billDate: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  billCategory: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  billDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  billActions: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  editPanel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
  emptyBillCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  emptyBillIcon: {
    fontSize: 36,
  },
  emptyBillText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});
