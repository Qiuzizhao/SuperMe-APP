import { apiRequest } from '@/src/shared/api';
import type { Item } from '../_shared/ReplicatedScreens';

export function listWorkLogs(type: string) {
  return apiRequest<Item[]>(`/worklogs/?log_type=${type}`);
}

export function createWorkLog(payload: Record<string, unknown>) {
  return apiRequest('/worklogs/', { method: 'POST', body: payload });
}

export function updateWorkLog(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/worklogs/${id}`, { method: 'PUT', body: payload });
}

export function deleteWorkLog(id: number) {
  return apiRequest(`/worklogs/${id}`, { method: 'DELETE' });
}
