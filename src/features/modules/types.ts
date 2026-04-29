import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type FieldType = 'text' | 'multiline' | 'number' | 'date' | 'boolean' | 'select' | 'image';
export type ModuleIcon = ComponentProps<typeof Ionicons>['name'];

export type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: string | number | boolean | null;
};

export type ModuleConfig = {
  key: string;
  title: string;
  subtitle: string;
  endpoint: string;
  fields: FieldConfig[];
  titleField: string;
  detailFields: string[];
  dateField?: string;
  supportsUpdate?: boolean;
  icon: ModuleIcon;
  accent: string;
  emptyText: string;
};
