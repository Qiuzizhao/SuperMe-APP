import type { ModuleConfig } from './types';
import { yesNo } from './options';

export const financeModules: ModuleConfig[] = [
  {
    key: 'finances',
    title: '账单',
    subtitle: '收入、支出和归属月份',
    endpoint: '/finances/',
    titleField: 'description',
    detailFields: ['transaction_type', 'amount', 'bill', 'category', 'subcategory', 'belong_month', 'transaction_date'],
    dateField: 'transaction_date',
    icon: 'receipt-outline',
    accent: '#16A34A',
    emptyText: '还没有账单，先记录一笔收入或支出。',
    fields: [
      { key: 'amount', label: '金额', type: 'number', required: true },
      { key: 'transaction_type', label: '类型', type: 'select', defaultValue: 'expense', options: [
        { label: '支出', value: 'expense' },
        { label: '收入', value: 'income' },
      ] },
      { key: 'bill', label: '账本', type: 'text' },
      { key: 'category', label: '分类', type: 'text' },
      { key: 'subcategory', label: '子分类', type: 'text' },
      { key: 'belong_month', label: '归属月份 YYYY-MM', type: 'text' },
      { key: 'description', label: '说明', type: 'text' },
      { key: 'transaction_date', label: '交易日期 YYYY-MM-DD', type: 'date', required: true },
    ],
  },
  {
    key: 'subscriptions',
    title: '订阅',
    subtitle: '周期扣费和续费提醒',
    endpoint: '/finances/subscriptions',
    titleField: 'name',
    detailFields: ['amount', 'cycle', 'next_billing_date', 'category', 'notes', 'is_active'],
    dateField: 'next_billing_date',
    icon: 'repeat-outline',
    accent: '#0D9488',
    emptyText: '还没有订阅项目。',
    fields: [
      { key: 'name', label: '名称', type: 'text', required: true },
      { key: 'amount', label: '金额', type: 'number', required: true },
      { key: 'cycle', label: '周期', type: 'select', defaultValue: 'monthly', options: [
        { label: '月付', value: 'monthly' },
        { label: '季付', value: 'quarterly' },
        { label: '年付', value: 'yearly' },
      ] },
      { key: 'next_billing_date', label: '下次扣费 YYYY-MM-DD', type: 'date', required: true },
      { key: 'category', label: '分类', type: 'text' },
      { key: 'notes', label: '备注', type: 'multiline' },
      { key: 'is_active', label: '启用', type: 'boolean', defaultValue: true, options: yesNo },
    ],
  },
  {
    key: 'guiwu',
    title: '归物',
    subtitle: '物品、成本和使用寿命',
    endpoint: '/guiwu/',
    titleField: 'name',
    detailFields: ['category', 'price', 'purchase_date', 'expected_lifespan_days', 'status', 'notes'],
    dateField: 'purchase_date',
    icon: 'cube-outline',
    accent: '#CA8A04',
    emptyText: '还没有资产记录。',
    fields: [
      { key: 'name', label: '名称', type: 'text', required: true },
      { key: 'category', label: '分类', type: 'text', required: true },
      { key: 'price', label: '价格', type: 'number', required: true },
      { key: 'purchase_date', label: '购买日期 YYYY-MM-DD', type: 'date', required: true },
      { key: 'expected_lifespan_days', label: '预期寿命天数', type: 'number', defaultValue: 365 },
      { key: 'status', label: '状态', type: 'select', defaultValue: 'in_use', options: [
        { label: '使用中', value: 'in_use' },
        { label: '闲置', value: 'idle' },
        { label: '已淘汰', value: 'retired' },
      ] },
      { key: 'image_url', label: '图片', type: 'image' },
      { key: 'notes', label: '备注', type: 'multiline' },
    ],
  },
];

export const growthModules: ModuleConfig[] = [];
