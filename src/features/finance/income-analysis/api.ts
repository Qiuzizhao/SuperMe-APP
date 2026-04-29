import { apiRequest } from '@/src/shared/api';
import type { FinanceItem } from '../shared/types';
import type { IncomeConfig } from './types';

export function fetchIncomeRecords() {
  return apiRequest<FinanceItem[]>('/finances/?transaction_type=income&limit=2000');
}

export function fetchIncomeConfigs() {
  return apiRequest<Partial<IncomeConfig>>('/configs/');
}
