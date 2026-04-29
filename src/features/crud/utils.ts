import type { FieldConfig, FormState, ModuleConfig, RecordItem } from './types';

export function valueToFormValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function initialForm(config: ModuleConfig, item?: RecordItem): FormState {
  return config.fields.reduce<FormState>((acc, field) => {
    if (item) acc[field.key] = valueToFormValue(item[field.key]);
    else if (field.defaultValue !== undefined) acc[field.key] = valueToFormValue(field.defaultValue);
    else if (field.type === 'date') acc[field.key] = today();
    else acc[field.key] = '';
    return acc;
  }, {});
}

export function normalizeValue(field: FieldConfig, value: string) {
  const trimmed = value.trim();
  if (!trimmed && !field.required) return null;
  if (field.type === 'number') {
    const parsed = Number(trimmed || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (field.type === 'boolean') return trimmed === 'true';
  return trimmed;
}

export function payloadFromForm(config: ModuleConfig, form: FormState) {
  return config.fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.key] = normalizeValue(field, form[field.key] ?? '');
    return acc;
  }, {});
}

export function labelFor(config: ModuleConfig, key: string) {
  const rawLabel = config.fields.find((field) => field.key === key)?.label || key;
  return rawLabel.replace(/\s*(YYYY-MM-DD|YYYY-MM|ISO|1-10|1-5|0-100)\s*/g, '');
}

export function displayValue(config: ModuleConfig, key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const field = config.fields.find((item) => item.key === key);
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (field?.options) return field.options.find((option) => option.value === String(value))?.label || String(value);
  if (typeof value === 'number' && (key.includes('amount') || key.includes('price'))) return `¥${value.toFixed(2)}`;
  return String(value);
}

export function getItemTitle(config: ModuleConfig, item: RecordItem) {
  const value = item[config.titleField];
  return value ? String(value) : `${config.title} #${item.id}`;
}

export function itemMeta(config: ModuleConfig, item: RecordItem) {
  return config.detailFields
    .map((key) => {
      const value = displayValue(config, key, item[key]);
      return value ? `${labelFor(config, key)}：${value}` : null;
    })
    .filter(Boolean)
    .join('  ·  ');
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '🌙 夜深了，早点休息';
  if (hour < 10) return '☀️ 早上好，今天也要元气满满';
  if (hour < 14) return '🍲 中午好，记得好好吃饭';
  if (hour < 18) return '☕ 下午好，喝杯咖啡休息下吧';
  if (hour < 22) return '🌆 晚上好，今天辛苦啦';
  return '🌙 夜深了，早点休息';
}
