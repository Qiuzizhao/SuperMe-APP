import { apiRequest } from '@/src/shared/api';
import type { FinanceBill, FinanceItem } from '../shared/types';

export function fetchFinanceTree() {
  return apiRequest<FinanceBill[]>('/finances/tree/bills');
}

export function fetchFinanceConfigs() {
  return apiRequest<{ finance_income_categories?: string[] }>('/configs/');
}

export function listFinances(transactionType: 'expense' | 'income') {
  return apiRequest<FinanceItem[]>(`/finances/?transaction_type=${transactionType}&limit=1000`);
}

export function createFinance(payload: Record<string, unknown>) {
  return apiRequest('/finances/', { method: 'POST', body: payload });
}

export function updateFinance(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/finances/${id}`, { method: 'PUT', body: payload });
}

export function deleteFinance(id: number) {
  return apiRequest(`/finances/${id}`, { method: 'DELETE' });
}
