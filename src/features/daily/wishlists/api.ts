import { apiRequest } from '@/src/shared/api';
import type { Item } from '../_shared/ReplicatedScreens';

export function listWishlists() {
  return apiRequest<Item[]>('/extras/wishlists/');
}

export function createWishlist(payload: Record<string, unknown>) {
  return apiRequest('/extras/wishlists/', { method: 'POST', body: payload });
}

export function updateWishlist(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/extras/wishlists/${id}`, { method: 'PUT', body: payload });
}

export function deleteWishlist(id: number) {
  return apiRequest(`/extras/wishlists/${id}`, { method: 'DELETE' });
}
