export function getTagHexColor(tag: string) {
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
}

export function getTagSoftColor(tag: string) {
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 95%)`;
}

export function currentWeekValue() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

export function evaluateAmountExpression(value: string) {
  try {
    const sanitized = value.replace(/[^-()\d/*+.]/g, '');
    if (!sanitized) return '';
    const result = Function(`"use strict"; return (${sanitized});`)();
    const numeric = Number(result);
    if (!Number.isFinite(numeric)) return value;
    return numeric.toFixed(2);
  } catch {
    return value;
  }
}

export function formatCurrency(value: number) {
  return `￥${Number(value || 0).toFixed(2)}`;
}

export function todayString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function weekRange(value: string) {
  const [yearRaw, weekRaw] = value.split('-W');
  const year = Number(yearRaw);
  const week = Number(weekRaw);
  if (!year || !week) return null;
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const day = simple.getDay();
  const start = new Date(simple);
  if (day <= 4) start.setDate(simple.getDate() - simple.getDay() + 1);
  else start.setDate(simple.getDate() + 8 - simple.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: todayString(start), end: todayString(end) };
}
