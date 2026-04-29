import { Text, View } from 'react-native';

import { DateField } from '@/src/shared/components';
import { spacing } from '@/src/shared/theme';
import { styles } from '../../styles';
import { getTagHexColor, getTagSoftColor } from '../../shared/utils';
import type { CategoryStats, IncomeConfig } from '../types';

export function CategoryDetailStats({
  configs,
  categoryStats,
  onCategoryMonthChange,
}: {
  configs: IncomeConfig;
  categoryStats: CategoryStats;
  onCategoryMonthChange: (category: string, month: string) => void;
}) {
  return (
    <>
      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>🥧 分类详细统计</Text>
      {configs.finance_income_categories.map((category) => {
        const displayData = categoryStats[category];
        if (!displayData) return null;
        const hex = getTagHexColor(category);
        const softHex = getTagSoftColor(category);
        return (
          <View key={category} style={[styles.categoryCard, { borderColor: softHex }]}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: softHex }]}>
                <Text style={[styles.categoryBadgeText, { color: hex }]}>{category}</Text>
              </View>
              <View style={styles.monthPickerCompact}>
                <DateField label="截止" value={displayData.currentMonth} onChangeText={(value) => onCategoryMonthChange(category, value)} mode="month" compact />
              </View>
            </View>
            <View style={styles.categoryStatsRow}>
              <View style={styles.categoryStatCol}>
                <Text style={styles.categoryStatLabel}>累计已收</Text>
                <Text style={styles.categoryStatValue}>¥{displayData.actual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </View>
              <View style={styles.categoryStatCol}>
                <Text style={styles.categoryStatLabel}>月均收入</Text>
                <Text style={[styles.categoryStatValue, { color: '#16a34a' }]}>¥{displayData.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </View>
            </View>
            <View style={styles.categoryProjectionRow}>
              <Text style={styles.categoryProjectionLabel}>年度预估 (至 {displayData.currentMonth})</Text>
              <Text style={styles.categoryProjectionValue}>¥{displayData.projection.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
            </View>
          </View>
        );
      })}
    </>
  );
}
