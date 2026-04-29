import { styles } from './styles';
import type { TodoEditForm, TodoItem } from './types';

export function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function generateCalendarDays(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDays = daysInMonth(prevYear, prevMonth);
  const result: { day: number; date: string; currentMonth: boolean }[] = [];

  for (let i = 0; i < firstDay; i += 1) {
    const day = prevDays - firstDay + i + 1;
    result.push({ day, date: toDateString(new Date(prevYear, prevMonth, day)), currentMonth: false });
  }

  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    result.push({ day, date: toDateString(new Date(year, month, day)), currentMonth: true });
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let day = 1; result.length < 42; day += 1) {
    result.push({ day, date: toDateString(new Date(nextYear, nextMonth, day)), currentMonth: false });
  }

  return result;
}

export function formatShortDate(value?: string | null) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return year === String(new Date().getFullYear()) ? `${month}-${day}` : value;
}

export function dueTag(value?: string | null) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return { label: '今天', style: styles.tagToday };
  if (diffDays === 1) return { label: '明天', style: styles.tagTomorrow };
  if (diffDays < 0) return { label: '过期', style: styles.tagOverdue };
  return null;
}

export function emptyEditForm(todo?: TodoItem | null): TodoEditForm {
  return {
    title: todo?.title || '',
    due_date: todo?.due_date || '',
    due_time: todo?.due_time || '',
    location: todo?.location || '',
    description: todo?.description || '',
  };
}
