import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Header, IconButton, Screen, SegmentedControl, StateView } from '@/src/shared/components';
import { styles } from '../styles';
import type { FinanceBill, FinanceCategory, FinanceItem, FinanceSubcategory } from '../shared/types';
import { currentMonthValue, currentWeekValue, formatCurrency, todayDate, todayString, weekRange } from '../shared/utils';
import { createFinance, deleteFinance, fetchFinanceConfigs, fetchFinanceTree, listFinances, updateFinance as updateFinanceRequest } from './api';
import { FinanceRecordCard, FinanceRecordSheet, FinanceSummaryCard } from './components';
import { buildFinancePayload, groupFinancesByDate } from './utils';

export function FinanceRecordsScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [financesByType, setFinancesByType] = useState<Record<'expense' | 'income', FinanceItem[]>>({ expense: [], income: [] });
  const [loadedTabs, setLoadedTabs] = useState<Record<'expense' | 'income', boolean>>({ expense: false, income: false });
  const [expenseTree, setExpenseTree] = useState<FinanceBill[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
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
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [reportType] = useState('monthly');
  const [expenseChartLevel] = useState('category');
  const [reportWeek] = useState(currentWeekValue());
  const [reportMonth] = useState(currentMonthValue());
  const [reportYear] = useState(String(new Date().getFullYear()));
  const [customStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return todayString(date);
  });
  const [customEndDate] = useState(todayDate());
  const [selectedReportCategory] = useState<string | null>(null);

  const loadStaticData = useCallback(async () => {
    const [tree, configs] = await Promise.all([fetchFinanceTree(), fetchFinanceConfigs()]);
    setExpenseTree(Array.isArray(tree) ? tree : []);
    setIncomeCategories(Array.isArray(configs?.finance_income_categories) ? configs.finance_income_categories : []);
  }, []);

  const loadFinances = useCallback(async (tab: 'expense' | 'income' = activeTab, showListLoader = false) => {
    setError(null);
    if (showListLoader) setListLoading(true);
    try {
      const data = await listFinances(tab);
      setFinancesByType((current) => ({ ...current, [tab]: Array.isArray(data) ? data : [] }));
      setLoadedTabs((current) => ({ ...current, [tab]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载账单失败');
    } finally {
      setLoading(false);
      setListLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadStaticData();
  }, [loadStaticData]);

  useEffect(() => {
    setEditingId(null);
    setBillObj(null);
    setCategoryObj(null);
    setSubcategoryObj(null);
    setIncomeCategory('');
    setTransactionDate(todayDate());
    setBelongMonth(currentMonthValue());
    if (!loadedTabs[activeTab]) {
      void loadFinances(activeTab, !loading);
    }
  }, [activeTab, loadedTabs, loadFinances, loading]);


  const addFinance = async () => {
    const payload = buildFinancePayload(amount, { billObj, categoryObj, subcategoryObj, incomeCategory, description, transactionDate, belongMonth }, activeTab);
    if (!payload) {
      Alert.alert('金额无效', '请输入有效的金额或算式');
      return;
    }
    await createFinance(payload);
    setAmount('');
    setDescription('');
    setCategoryObj(null);
    setSubcategoryObj(null);
    if (activeTab === 'income') setIncomeCategory('');
    setTransactionDate(todayDate());
    setBelongMonth(currentMonthValue());
    bottomSheetRef.current?.dismiss();
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
    const payload = buildFinancePayload(editAmount, {
      billObj: editBillObj,
      categoryObj: editCategoryObj,
      subcategoryObj: editSubcategoryObj,
      incomeCategory: editIncomeCategory,
      description: editDescription,
      transactionDate: editTransactionDate,
      belongMonth: editBelongMonth,
    }, activeTab);
    if (!payload) {
      Alert.alert('金额无效', '请输入有效的金额或算式');
      return;
    }
    await updateFinanceRequest(id, payload);
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
          await deleteFinance(item.id);
          if (editingId === item.id) setEditingId(null);
          await loadFinances();
        },
      },
    ]);
  };

  const finances = financesByType[activeTab];
  const hasCurrentTabLoaded = loadedTabs[activeTab];
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



  if ((loading || error) && !hasCurrentTabLoaded) {
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void loadFinances(activeTab); }} />}>
        <SegmentedControl value={activeTab} onChange={(value) => setActiveTab(value as 'expense' | 'income')} options={[{ label: '支出清单', value: 'expense' }, { label: '收入清单', value: 'income' }]} />

        <FinanceSummaryCard activeTab={activeTab} totalAmount={totalAmount} />

        <View style={styles.billList}>
          <StateView loading={listLoading} error={hasCurrentTabLoaded ? error : null} onRetry={() => loadFinances(activeTab, true)} />
          {!listLoading && displayFinances.length === 0 ? (
            <View style={styles.emptyBillCard}>
              <Text style={styles.emptyBillIcon}>💸</Text>
              <Text style={styles.emptyBillText}>暂无账单记录</Text>
            </View>
          ) : !listLoading ? (
            Object.entries(
              groupFinancesByDate(displayFinances)
            )
              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
              .map(([date, items]) => (
                <View key={date} style={styles.billGroup}>
                  <Text style={styles.billGroupTitle}>{date}</Text>
                  {items.map((item) => (
                    <FinanceRecordCard
                      key={item.id}
                      item={item}
                      activeTab={activeTab}
                      isEditing={editingId === item.id}
                      expenseTree={expenseTree}
                      incomeCategories={incomeCategories}
                      editAmount={editAmount}
                      editBillObj={editBillObj}
                      editCategoryObj={editCategoryObj}
                      editSubcategoryObj={editSubcategoryObj}
                      editIncomeCategory={editIncomeCategory}
                      editDescription={editDescription}
                      editTransactionDate={editTransactionDate}
                      editBelongMonth={editBelongMonth}
                      onStartEdit={() => startEdit(item)}
                      onEditAmountChange={setEditAmount}
                      onEditBillChange={setEditBillObj}
                      onEditCategoryChange={setEditCategoryObj}
                      onEditSubcategoryChange={setEditSubcategoryObj}
                      onEditIncomeCategoryChange={setEditIncomeCategory}
                      onEditDescriptionChange={setEditDescription}
                      onEditTransactionDateChange={setEditTransactionDate}
                      onEditBelongMonthChange={setEditBelongMonth}
                      onCancelEdit={() => setEditingId(null)}
                      onSave={() => void updateFinance(item.id)}
                      onRemove={() => removeFinance(item)}
                    />
                  ))}
                </View>
              ))
          ) : null}
        </View>
      </ScrollView>
      
      <Pressable style={({ pressed }) => [styles.fab, pressed && styles.pressed]} onPress={() => bottomSheetRef.current?.present()}>
        <LinearGradient
          colors={activeTab === 'expense' ? ['#f43f5e', '#be123c'] : ['#10b981', '#047857']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>

      <FinanceRecordSheet
        bottomSheetRef={bottomSheetRef}
        activeTab={activeTab}
        amount={amount}
        billObj={billObj}
        categoryObj={categoryObj}
        subcategoryObj={subcategoryObj}
        incomeCategory={incomeCategory}
        incomeCategories={incomeCategories}
        expenseTree={expenseTree}
        description={description}
        transactionDate={transactionDate}
        belongMonth={belongMonth}
        onAmountChange={setAmount}
        onBillChange={setBillObj}
        onCategoryChange={setCategoryObj}
        onSubcategoryChange={setSubcategoryObj}
        onIncomeCategoryChange={setIncomeCategory}
        onDescriptionChange={setDescription}
        onTransactionDateChange={setTransactionDate}
        onBelongMonthChange={setBelongMonth}
        onCancel={() => bottomSheetRef.current?.dismiss()}
        onSubmit={() => void addFinance()}
      />
    </Screen>
  );
}
