import { apiRequest } from '@/src/shared/api';

import type { TodoCategory, TodoItem } from './types';

export function listTodos(category: TodoCategory) {
  const queryCategory = category === 'calendar' ? '' : `?category=${category}`;
  return apiRequest<TodoItem[]>(`/todos/${queryCategory}`);
}

export function createTodo(payload: Partial<TodoItem>) {
  return apiRequest<TodoItem>('/todos/', { method: 'POST', body: payload });
}

export function updateTodo(id: number, payload: Partial<TodoItem>) {
  return apiRequest<TodoItem>(`/todos/${id}`, { method: 'PUT', body: payload });
}

export function deleteTodo(id: number) {
  return apiRequest(`/todos/${id}`, { method: 'DELETE' });
}
