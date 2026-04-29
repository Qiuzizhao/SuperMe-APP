import { apiRequest } from '@/src/shared/api';
import type { Item } from '../_shared/ReplicatedScreens';

export function listReadings() {
  return apiRequest<Item[]>('/extras/readings/');
}

export function createReading(payload: Record<string, unknown>) {
  return apiRequest('/extras/readings/', { method: 'POST', body: payload });
}

export function updateReading(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/extras/readings/${id}`, { method: 'PUT', body: payload });
}

export function deleteReading(id: number) {
  return apiRequest(`/extras/readings/${id}`, { method: 'DELETE' });
}
