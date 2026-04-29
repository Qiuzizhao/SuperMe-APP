import { apiRequest } from '@/src/shared/api';
import type { RecordItem } from './types';

export function listCrudItems(endpoint: string) {
  return apiRequest<RecordItem[]>(endpoint);
}

export function createCrudItem(endpoint: string, payload: Record<string, unknown>) {
  return apiRequest(endpoint, { method: 'POST', body: payload });
}

export function updateCrudItem(endpoint: string, id: number, payload: Record<string, unknown>) {
  return apiRequest(`${endpoint.replace(/\/$/, '')}/${id}`, { method: 'PUT', body: payload });
}

export function deleteCrudItem(endpoint: string, id: number) {
  return apiRequest(`${endpoint.replace(/\/$/, '')}/${id}`, { method: 'DELETE' });
}
