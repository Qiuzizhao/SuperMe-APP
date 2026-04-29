import { apiRequest } from '@/src/shared/api';
import type { FinanceBill, FinanceCategory, FinanceSubcategory, SettingsConfig } from './types';

export async function fetchExpenseTree() {
  return apiRequest<FinanceBill[]>('/finances/tree/bills');
}

export async function fetchSettingsConfig() {
  return apiRequest<Partial<SettingsConfig>>('/configs/');
}

export async function saveSettingsConfig(payload: SettingsConfig) {
  return apiRequest('/configs/', { method: 'POST', body: payload });
}

export async function createBill(name: string) {
  return apiRequest<FinanceBill>('/finances/tree/bills', { method: 'POST', body: { name } });
}

export async function deleteBill(id: number) {
  return apiRequest(`/finances/tree/bills/${id}`, { method: 'DELETE' });
}

export async function createCategory(name: string, billId: number) {
  return apiRequest<FinanceCategory>('/finances/tree/categories', { method: 'POST', body: { name, bill_id: billId } });
}

export async function deleteCategory(id: number) {
  return apiRequest(`/finances/tree/categories/${id}`, { method: 'DELETE' });
}

export async function createSubcategory(name: string, categoryId: number) {
  return apiRequest<FinanceSubcategory>('/finances/tree/subcategories', { method: 'POST', body: { name, category_id: categoryId } });
}

export async function deleteSubcategory(id: number) {
  return apiRequest(`/finances/tree/subcategories/${id}`, { method: 'DELETE' });
}
