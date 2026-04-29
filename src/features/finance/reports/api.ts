import { apiRequest } from '@/src/shared/api';
import type { FinanceItem } from '../shared/types';

export async function fetchReportFinances() {
  const [expenseData, incomeData] = await Promise.all([
    apiRequest<FinanceItem[]>('/finances/?transaction_type=expense&limit=2000'),
    apiRequest<FinanceItem[]>('/finances/?transaction_type=income&limit=2000'),
  ]);
  return [
    ...(Array.isArray(expenseData) ? expenseData : []),
    ...(Array.isArray(incomeData) ? incomeData : []),
  ];
}
