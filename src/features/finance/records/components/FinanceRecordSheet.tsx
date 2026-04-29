import { BottomSheetModal } from '@gorhom/bottom-sheet';
import React from 'react';
import { Text, View } from 'react-native';

import { DateField, FormSheet, PrimaryButton, SheetTextInput } from '@/src/shared/components';
import { colors } from '@/src/shared/theme';
import { styles } from '../../styles';
import { PillSelector } from '../../shared/PillSelector';
import type { FinanceBill, FinanceCategory, FinanceSubcategory } from '../../shared/types';
import { evaluateAmountExpression } from '../../shared/utils';
import type { TransactionType } from '../types';

export function FinanceRecordSheet({
  bottomSheetRef,
  activeTab,
  amount,
  billObj,
  categoryObj,
  subcategoryObj,
  incomeCategory,
  incomeCategories,
  expenseTree,
  description,
  transactionDate,
  belongMonth,
  onAmountChange,
  onBillChange,
  onCategoryChange,
  onSubcategoryChange,
  onIncomeCategoryChange,
  onDescriptionChange,
  onTransactionDateChange,
  onBelongMonthChange,
  onCancel,
  onSubmit,
}: {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  activeTab: TransactionType;
  amount: string;
  billObj: FinanceBill | null;
  categoryObj: FinanceCategory | null;
  subcategoryObj: FinanceSubcategory | null;
  incomeCategory: string;
  incomeCategories: string[];
  expenseTree: FinanceBill[];
  description: string;
  transactionDate: string;
  belongMonth: string;
  onAmountChange: (value: string) => void;
  onBillChange: (value: FinanceBill | null) => void;
  onCategoryChange: (value: FinanceCategory | null) => void;
  onSubcategoryChange: (value: FinanceSubcategory | null) => void;
  onIncomeCategoryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTransactionDateChange: (value: string) => void;
  onBelongMonthChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const categories = billObj?.categories || [];
  const subcategories = categoryObj?.subcategories || [];

  return (
    <FormSheet bottomSheetRef={bottomSheetRef} contentStyle={styles.financeContent}>
        <Text style={styles.sheetTitle}>新增{activeTab === 'expense' ? '支出' : '收入'}</Text>
        <View style={styles.amountRow}>
          <SheetTextInput
            value={amount}
            onChangeText={onAmountChange}
            onBlur={() => onAmountChange(evaluateAmountExpression(amount))}
            placeholder="金额，可输入 12+8/2"
            placeholderTextColor={colors.faint}
            keyboardType="numbers-and-punctuation"
            style={styles.amountInput}
          />
          <View style={styles.dateColumn}>
            <DateField label="日期" value={transactionDate} onChangeText={onTransactionDateChange} />
          </View>
        </View>
        {activeTab === 'income' ? (
          <>
            <DateField label="归属月份" value={belongMonth} onChangeText={onBelongMonthChange} mode="month" />
            <PillSelector label="收入类别" value={incomeCategory} options={incomeCategories} onChange={onIncomeCategoryChange} fallback="其他收入" accent={colors.success} />
          </>
        ) : (
          <>
            <PillSelector label="账本" value={billObj?.name || ''} options={expenseTree.map((bill) => bill.name)} onChange={(name) => { const found = expenseTree.find((bill) => bill.name === name) || null; onBillChange(found); onCategoryChange(null); onSubcategoryChange(null); }} fallback="未选择账本" accent={colors.danger} />
            <PillSelector label="类别" value={categoryObj?.name || ''} options={categories.map((category) => category.name)} onChange={(name) => { const found = categories.find((category) => category.name === name) || null; onCategoryChange(found); onSubcategoryChange(null); }} fallback="其他支出" accent={colors.danger} />
            {subcategories.length > 0 ? <PillSelector label="子类别" value={subcategoryObj?.name || ''} options={subcategories.map((subcategory) => subcategory.name)} onChange={(name) => onSubcategoryChange(subcategories.find((subcategory) => subcategory.name === name) || null)} fallback="无子类别" accent={colors.danger} /> : null}
          </>
        )}
        <SheetTextInput value={description} onChangeText={onDescriptionChange} placeholder="备注说明" placeholderTextColor={colors.faint} style={styles.fullInput} />
        <View style={styles.formActions}>
          <PrimaryButton label="取消" tone="plain" onPress={onCancel} />
          <View style={{ flex: 1 }}>
            <PrimaryButton label="添加账单" icon="checkmark" disabled={!amount.trim()} onPress={onSubmit} />
          </View>
        </View>
    </FormSheet>
  );
}
