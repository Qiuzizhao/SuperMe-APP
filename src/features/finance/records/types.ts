import type { FinanceBill, FinanceCategory, FinanceSubcategory } from '../shared/types';

export type TransactionType = 'expense' | 'income';

export type FinanceDraft = {
  billObj: FinanceBill | null;
  categoryObj: FinanceCategory | null;
  subcategoryObj: FinanceSubcategory | null;
  incomeCategory: string;
  description: string;
  transactionDate: string;
  belongMonth: string;
};
