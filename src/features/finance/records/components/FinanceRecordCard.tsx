import { Pressable, Text, TextInput, View } from 'react-native';

import { DateField, PrimaryButton } from '@/src/shared/components';
import { colors } from '@/src/shared/theme';
import { styles } from '../../styles';
import { PillSelector } from '../../shared/PillSelector';
import type { FinanceBill, FinanceCategory, FinanceItem, FinanceSubcategory } from '../../shared/types';
import { evaluateAmountExpression, formatCurrency } from '../../shared/utils';
import type { TransactionType } from '../types';

export function FinanceRecordCard({
  item,
  activeTab,
  isEditing,
  expenseTree,
  incomeCategories,
  editAmount,
  editBillObj,
  editCategoryObj,
  editSubcategoryObj,
  editIncomeCategory,
  editDescription,
  editTransactionDate,
  editBelongMonth,
  onStartEdit,
  onEditAmountChange,
  onEditBillChange,
  onEditCategoryChange,
  onEditSubcategoryChange,
  onEditIncomeCategoryChange,
  onEditDescriptionChange,
  onEditTransactionDateChange,
  onEditBelongMonthChange,
  onCancelEdit,
  onSave,
  onRemove,
}: {
  item: FinanceItem;
  activeTab: TransactionType;
  isEditing: boolean;
  expenseTree: FinanceBill[];
  incomeCategories: string[];
  editAmount: string;
  editBillObj: FinanceBill | null;
  editCategoryObj: FinanceCategory | null;
  editSubcategoryObj: FinanceSubcategory | null;
  editIncomeCategory: string;
  editDescription: string;
  editTransactionDate: string;
  editBelongMonth: string;
  onStartEdit: () => void;
  onEditAmountChange: (value: string) => void;
  onEditBillChange: (value: FinanceBill | null) => void;
  onEditCategoryChange: (value: FinanceCategory | null) => void;
  onEditSubcategoryChange: (value: FinanceSubcategory | null) => void;
  onEditIncomeCategoryChange: (value: string) => void;
  onEditDescriptionChange: (value: string) => void;
  onEditTransactionDateChange: (value: string) => void;
  onEditBelongMonthChange: (value: string) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  const editCategories = editBillObj?.categories || [];
  const editSubcategories = editCategoryObj?.subcategories || [];

  return (
    <Pressable style={({ pressed }) => [styles.billCard, pressed && styles.pressed]} onLongPress={onStartEdit}>
      <View style={styles.billCardHeader}>
        <View style={[styles.billIconCircle, { backgroundColor: activeTab === 'expense' ? '#ffe4e6' : '#d1fae5' }]}>
          <Text style={styles.billIconEmoji}>{activeTab === 'expense' ? '💸' : '💰'}</Text>
        </View>
        <View style={styles.flex}>
          <View style={styles.billCardTitleRow}>
            <Text style={styles.billCategory}>{[item.bill, item.category, item.subcategory].filter(Boolean).join(' / ') || '未分类'}</Text>
            <View style={styles.flex} />
            <Text style={[styles.billAmount, { color: activeTab === 'expense' ? colors.danger : colors.success }]}>{activeTab === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}</Text>
          </View>
          {item.description ? <Text style={styles.billDescription}>{item.description}</Text> : null}
          {activeTab === 'income' && item.belong_month ? <Text style={styles.billDescription}>归属月份：{item.belong_month}</Text> : null}
        </View>
      </View>

      {isEditing ? (
        <View style={styles.editPanel}>
          <View style={styles.amountRow}>
            <TextInput value={editAmount} onChangeText={onEditAmountChange} onBlur={() => onEditAmountChange(evaluateAmountExpression(editAmount))} style={styles.amountInput} />
            <View style={styles.dateColumn}>
              <DateField label="日期" value={editTransactionDate} onChangeText={onEditTransactionDateChange} />
            </View>
          </View>
          {activeTab === 'income' ? (
            <>
              <DateField label="归属月份" value={editBelongMonth} onChangeText={onEditBelongMonthChange} mode="month" />
              <PillSelector label="收入类别" value={editIncomeCategory} options={incomeCategories} onChange={onEditIncomeCategoryChange} fallback="其他收入" accent={colors.success} />
            </>
          ) : (
            <>
              <PillSelector label="账本" value={editBillObj?.name || ''} options={expenseTree.map((bill) => bill.name)} onChange={(name) => { const found = expenseTree.find((bill) => bill.name === name) || null; onEditBillChange(found); onEditCategoryChange(null); onEditSubcategoryChange(null); }} fallback="未选择账本" accent={colors.danger} />
              <PillSelector label="类别" value={editCategoryObj?.name || ''} options={editCategories.map((category) => category.name)} onChange={(name) => { const found = editCategories.find((category) => category.name === name) || null; onEditCategoryChange(found); onEditSubcategoryChange(null); }} fallback="其他支出" accent={colors.danger} />
              {editSubcategories.length > 0 ? <PillSelector label="子类别" value={editSubcategoryObj?.name || ''} options={editSubcategories.map((subcategory) => subcategory.name)} onChange={(name) => onEditSubcategoryChange(editSubcategories.find((subcategory) => subcategory.name === name) || null)} fallback="无子类别" accent={colors.danger} /> : null}
            </>
          )}
          <TextInput value={editDescription} onChangeText={onEditDescriptionChange} placeholder="备注说明" placeholderTextColor={colors.faint} style={styles.fullInput} />
          <View style={styles.editActions}>
            <PrimaryButton label="删除" tone="danger" onPress={onRemove} />
            <View style={{ flex: 1 }} />
            <PrimaryButton label="取消" tone="plain" onPress={onCancelEdit} />
            <PrimaryButton label="保存修改" icon="checkmark" onPress={onSave} />
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}
