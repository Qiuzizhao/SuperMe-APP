import { apiRequest } from '@/src/shared/api';
import type { Item } from '../_shared/ReplicatedScreens';

export function listTeachings() {
  return apiRequest<Item[]>('/teachings/');
}

export function createTeaching(payload: Record<string, unknown>) {
  return apiRequest('/teachings/', { method: 'POST', body: payload });
}

export function updateTeaching(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/teachings/${id}`, { method: 'PUT', body: payload });
}

export function deleteTeaching(id: number) {
  return apiRequest(`/teachings/${id}`, { method: 'DELETE' });
}
