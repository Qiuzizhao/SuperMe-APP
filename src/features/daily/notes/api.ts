import { apiRequest } from '@/src/shared/api';
import type { Item } from '../_shared/ReplicatedScreens';

export function listNotes() {
  return apiRequest<Item[]>('/notes/');
}

export function listNoteThread(id: number) {
  return apiRequest<Item[]>(`/notes/thread/${id}`);
}

export function createNote(payload: Record<string, unknown>) {
  return apiRequest('/notes/', { method: 'POST', body: payload });
}

export function updateNote(id: number, payload: Record<string, unknown>) {
  return apiRequest(`/notes/${id}`, { method: 'PUT', body: payload });
}

export function deleteNote(id: number) {
  return apiRequest(`/notes/${id}`, { method: 'DELETE' });
}
