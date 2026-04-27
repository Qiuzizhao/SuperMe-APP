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

const yesNo = [
  { label: '否', value: 'false' },
  { label: '是', value: 'true' },
];

export const dailyModules: ModuleConfig[] = [
  {
    key: 'todos',
    title: '待办',
    subtitle: '工作和生活事项',
    endpoint: '/todos/',
    titleField: 'title',
    detailFields: ['category', 'due_date', 'due_time', 'location', 'description'],
    dateField: 'due_date',
    icon: 'checkmark-done-outline',
    accent: '#2563EB',
    emptyText: '还没有待办，先记录下一件马上要处理的事。',
    fields: [
      { key: 'title', label: '标题', type: 'text', required: true },
      { key: 'description', label: '描述', type: 'multiline' },
      { key: 'category', label: '分类', type: 'select', defaultValue: 'life', options: [
        { label: '生活', value: 'life' },
        { label: '工作', value: 'work' },
      ] },
      { key: 'due_date', label: '日期 YYYY-MM-DD', type: 'date' },
      { key: 'due_time', label: '时间', type: 'text' },
      { key: 'location', label: '地点', type: 'text' },
      { key: 'is_completed', label: '已完成', type: 'boolean', defaultValue: false, options: yesNo },
    ],
  },
  {
    key: 'moods',
    title: '心情',
    subtitle: '情绪和状态记录',
    endpoint: '/moods/',
    supportsUpdate: false,
    titleField: 'mood_label',
    detailFields: ['mood_level', 'note'],
    icon: 'happy-outline',
    accent: '#DB2777',
    emptyText: '今天还没有心情记录。',
    fields: [
      { key: 'mood_label', label: '心情标签', type: 'text', required: true },
      { key: 'mood_level', label: '心情分数 1-10', type: 'number', defaultValue: 5 },
      { key: 'note', label: '备注', type: 'multiline' },
    ],
  },
  {
    key: 'notes',
    title: '随手记',
    subtitle: '想法、线索和笔记线程',
    endpoint: '/notes/',
    titleField: 'content',
    detailFields: ['tags', 'mood_label', 'emotion'],
    icon: 'document-text-outline',
    accent: '#7C3AED',
    emptyText: '还没有笔记，先写下一条灵感。',
    fields: [
      { key: 'content', label: '内容', type: 'multiline', required: true },
      { key: 'tags', label: '标签', type: 'text' },
      { key: 'mood_level', label: '心情分数', type: 'number' },
      { key: 'mood_label', label: '心情标签', type: 'text' },
      { key: 'emotion', label: '情绪', type: 'text' },
      { key: 'parent_id', label: '父级笔记 ID', type: 'number' },
    ],
  },
];

export const workModules: ModuleConfig[] = [
  {
    key: 'worklogs',
    title: '工作日志',
    subtitle: '日常工作和活动记录',
    endpoint: '/worklogs/',
    titleField: 'record',
    detailFields: ['log_type', 'activity_name', 'event_time', 'location', 'notes'],
    icon: 'briefcase-outline',
    accent: '#0891B2',
    emptyText: '还没有工作日志。',
    fields: [
      { key: 'log_type', label: '类型', type: 'select', defaultValue: 'daily', options: [
        { label: '日常', value: 'daily' },
        { label: '活动', value: 'activity' },
      ] },
      { key: 'record', label: '记录', type: 'multiline', required: true },
      { key: 'activity_name', label: '活动名称', type: 'text' },
      { key: 'event_time', label: '事件时间 ISO', type: 'text' },
      { key: 'location', label: '地点', type: 'text' },
      { key: 'notes', label: '备注', type: 'multiline' },
    ],
  },
  {
    key: 'teachings',
    title: '课堂日志',
    subtitle: '课堂、练习和复盘',
    endpoint: '/teachings/',
    titleField: 'class_name',
    detailFields: ['course_type', 'content', 'practice_content', 'effect_rating', 'unexpected', 'reflection'],
    icon: 'school-outline',
    accent: '#4F46E5',
    emptyText: '还没有课堂日志。',
    fields: [
      { key: 'class_name', label: '班级', type: 'text', required: true },
      { key: 'course_type', label: '课程类型', type: 'text', required: true },
      { key: 'content', label: '课堂内容', type: 'multiline', required: true },
      { key: 'practice_content', label: '练习内容', type: 'multiline' },
      { key: 'effect_rating', label: '效果评分 1-10', type: 'number', defaultValue: 5 },
      { key: 'unexpected', label: '意外情况', type: 'multiline' },
      { key: 'reflection', label: '复盘', type: 'multiline' },
    ],
  },
];

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

export const growthModules: ModuleConfig[] = [
  {
    key: 'wishlists',
    title: '愿望',
    subtitle: '想买、想去、想完成',
    endpoint: '/extras/wishlists/',
    titleField: 'title',
    detailFields: ['category', 'location', 'custom_tags', 'description', 'is_fulfilled'],
    icon: 'star-outline',
    accent: '#9333EA',
    emptyText: '还没有愿望，先写下一个想实现的念头。',
    fields: [
      { key: 'title', label: '标题', type: 'text', required: true },
      { key: 'category', label: '分类', type: 'select', defaultValue: 'shopping', options: [
        { label: '购物', value: 'shopping' },
        { label: '旅行', value: 'travel' },
      ] },
      { key: 'description', label: '描述', type: 'multiline' },
      { key: 'location', label: '地点', type: 'text' },
      { key: 'custom_tags', label: '标签', type: 'text' },
      { key: 'is_fulfilled', label: '已实现', type: 'boolean', defaultValue: false, options: yesNo },
    ],
  },
  {
    key: 'footprints',
    title: '足迹',
    subtitle: '去过的地方和照片',
    endpoint: '/extras/footprints/',
    titleField: 'location',
    detailFields: ['visit_date', 'coordinate', 'rating', 'notes'],
    dateField: 'visit_date',
    icon: 'map-outline',
    accent: '#0284C7',
    emptyText: '还没有足迹记录。',
    fields: [
      { key: 'location', label: '地点', type: 'text', required: true },
      { key: 'coordinate', label: '坐标', type: 'text' },
      { key: 'visit_date', label: '访问日期 YYYY-MM-DD', type: 'date', required: true },
      { key: 'rating', label: '评分 1-5', type: 'number' },
      { key: 'image_url', label: '图片', type: 'image' },
      { key: 'notes', label: '备注', type: 'multiline' },
    ],
  },
  {
    key: 'readings',
    title: '阅读',
    subtitle: '书籍、状态和笔记',
    endpoint: '/extras/readings/',
    titleField: 'title',
    detailFields: ['author', 'status', 'rating', 'notes'],
    icon: 'book-outline',
    accent: '#059669',
    emptyText: '还没有阅读记录。',
    fields: [
      { key: 'title', label: '书名', type: 'text', required: true },
      { key: 'author', label: '作者', type: 'text' },
      { key: 'status', label: '状态', type: 'select', defaultValue: 'to_read', options: [
        { label: '想读', value: 'to_read' },
        { label: '在读', value: 'reading' },
        { label: '读完', value: 'finished' },
      ] },
      { key: 'rating', label: '评分 1-5', type: 'number' },
      { key: 'notes', label: '笔记', type: 'multiline' },
    ],
  },
  {
    key: 'portfolios',
    title: '作品',
    subtitle: '作品、链接和完成时间',
    endpoint: '/extras/portfolios/',
    titleField: 'title',
    detailFields: ['completion_date', 'link', 'description'],
    dateField: 'completion_date',
    icon: 'color-palette-outline',
    accent: '#EA580C',
    emptyText: '还没有作品记录。',
    fields: [
      { key: 'title', label: '标题', type: 'text', required: true },
      { key: 'description', label: '描述', type: 'multiline' },
      { key: 'link', label: '链接', type: 'text' },
      { key: 'completion_date', label: '完成日期 YYYY-MM-DD', type: 'date' },
    ],
  },
  {
    key: 'growth',
    title: '成长雷达',
    subtitle: '能力维度评分',
    endpoint: '/extras/growth/',
    supportsUpdate: false,
    titleField: 'category',
    detailFields: ['score'],
    icon: 'analytics-outline',
    accent: '#4F46E5',
    emptyText: '还没有成长维度。',
    fields: [
      { key: 'category', label: '维度', type: 'text', required: true },
      { key: 'score', label: '分数 0-100', type: 'number', required: true },
    ],
  },
  {
    key: 'goals',
    title: '目标',
    subtitle: '目标、进度和截止日期',
    endpoint: '/extras/goals/',
    titleField: 'title',
    detailFields: ['status', 'progress', 'target_date', 'description'],
    dateField: 'target_date',
    icon: 'flag-outline',
    accent: '#DC2626',
    emptyText: '还没有目标规划。',
    fields: [
      { key: 'title', label: '标题', type: 'text', required: true },
      { key: 'description', label: '描述', type: 'multiline' },
      { key: 'target_date', label: '目标日期 YYYY-MM-DD', type: 'date' },
      { key: 'progress', label: '进度 0-100', type: 'number', defaultValue: 0 },
      { key: 'status', label: '状态', type: 'select', defaultValue: 'in_progress', options: [
        { label: '进行中', value: 'in_progress' },
        { label: '完成', value: 'done' },
        { label: '暂停', value: 'paused' },
      ] },
    ],
  },
];
