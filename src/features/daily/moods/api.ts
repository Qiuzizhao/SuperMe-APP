import { apiRequest } from '@/src/shared/api';
import type { Item } from '../_shared/ReplicatedScreens';

export function listMoods() {
  return apiRequest<Item[]>('/moods/');
}

export function createMood(payload: Record<string, unknown>) {
  return apiRequest('/moods/', { method: 'POST', body: payload });
}

export function updateMood(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/notes/${id}`, { method: 'PUT', body: payload });
}
