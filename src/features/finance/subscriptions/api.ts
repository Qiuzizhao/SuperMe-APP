import { apiRequest } from '@/src/shared/api';
import type { Item } from '../../daily/_shared/ReplicatedScreens';

export function listSubscriptions() {
  return apiRequest<Item[]>('/finances/subscriptions');
}

export function createSubscription(payload: Record<string, unknown>) {
  return apiRequest('/finances/subscriptions', { method: 'POST', body: payload });
}

export function updateSubscription(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/finances/subscriptions/${id}`, { method: 'PUT', body: payload });
}

export function deleteSubscription(id: number) {
  return apiRequest(`/finances/subscriptions/${id}`, { method: 'DELETE' });
}
