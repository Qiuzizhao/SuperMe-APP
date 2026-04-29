import type { FinanceItem } from '../shared/types';
import { evaluateAmountExpression } from '../shared/utils';
import type { FinanceDraft, TransactionType } from './types';

export function buildFinancePayload(rawAmount: string, values: FinanceDraft, activeTab: TransactionType) {
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
}

export function groupFinancesByDate(items: FinanceItem[]) {
  return items.reduce<Record<string, FinanceItem[]>>((groups, item) => {
    const dateKey = item.transaction_date || '未知日期';
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(item);
    return groups;
  }, {});
}
