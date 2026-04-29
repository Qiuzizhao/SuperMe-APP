export type FinanceSubcategory = {
  id: number;
  name: string;
};

export type FinanceCategory = {
  id: number;
  name: string;
  subcategories: FinanceSubcategory[];
};

export type FinanceBill = {
  id: number;
  name: string;
  categories: FinanceCategory[];
};

export type SettingsConfig = {
  finance_income_categories: string[];
  finance_income_net_cats: string[];
  finance_income_total_cats: string[];
  finance_income_gross_cats: string[];
  note_tags: string[];
  teaching_class_types: string[];
};

export type ConfigListKey = 'finance_income_categories' | 'note_tags' | 'teaching_class_types';

export type NewConfigItems = Record<ConfigListKey, string>;

export type SettingsPanelKey = 'expense' | 'income' | 'note' | 'class';

export type SettingsSectionKey = 'expense' | 'income' | 'note' | 'class';

export type ExpandedSections = Record<SettingsSectionKey, boolean>;

export type IncomeLevel = 'net' | 'total' | 'gross';
