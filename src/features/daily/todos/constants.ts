import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/src/shared/theme';
import type { TodoCategory } from './types';

export const todoCategories: { label: string; value: TodoCategory; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { label: '工作', value: 'work', icon: 'briefcase-outline', color: colors.primary },
  { label: '生活', value: 'life', icon: 'home-outline', color: colors.success },
  { label: '日历', value: 'calendar', icon: 'calendar-outline', color: colors.warning },
];

export const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
