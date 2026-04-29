export type TodoCategory = 'work' | 'life' | 'calendar';

export type TodoItem = {
  id: number;
  title: string;
  description?: string | null;
  category: 'work' | 'life';
  is_completed: boolean;
  due_date?: string | null;
  due_time?: string | null;
  location?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

export type TodoEditForm = {
  title: string;
  due_date: string;
  due_time: string;
  location: string;
  description: string;
};
