import { apiRequest } from '@/src/shared/api';
import type { Item } from '../../daily/_shared/ReplicatedScreens';

export function listAssets() {
  return apiRequest<Item[]>('/guiwu/');
}

export function createAsset(payload: Record<string, unknown>) {
  return apiRequest('/guiwu/', { method: 'POST', body: payload });
}

export function updateAsset(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/guiwu/${id}`, { method: 'PUT', body: payload });
}

export function deleteAsset(id: number) {
  return apiRequest(`/guiwu/${id}`, { method: 'DELETE' });
}
