import type { IncomeLevel, SettingsConfig } from './types';

export const defaultSettingsConfig: SettingsConfig = {
  finance_income_categories: [],
  finance_income_net_cats: [],
  finance_income_total_cats: [],
  finance_income_gross_cats: [],
  note_tags: [],
  teaching_class_types: [],
};

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

export function getIncomeLevel(configs: SettingsConfig, category: string): IncomeLevel {
  if (configs.finance_income_total_cats?.includes(category)) return 'total';
  if (configs.finance_income_gross_cats?.includes(category)) return 'gross';
  return 'net';
}

export function getIncomeLevelLabel(level: IncomeLevel) {
  if (level === 'total') return '福利';
  if (level === 'gross') return '全包';
  return '到手';
}
