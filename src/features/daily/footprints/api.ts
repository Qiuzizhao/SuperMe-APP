import { apiRequest } from '@/src/shared/api';
import type { Item } from '../_shared/ReplicatedScreens';

export function listFootprints() {
  return apiRequest<Item[]>('/extras/footprints/');
}

export function createFootprint(payload: Record<string, unknown>) {
  return apiRequest('/extras/footprints/', { method: 'POST', body: payload });
}

export function updateFootprint(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/extras/footprints/${id}`, { method: 'PUT', body: payload });
}

export function deleteFootprint(id: number) {
  return apiRequest(`/extras/footprints/${id}`, { method: 'DELETE' });
}
