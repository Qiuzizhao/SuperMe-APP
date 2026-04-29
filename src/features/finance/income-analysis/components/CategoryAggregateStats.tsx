import { Text, View } from 'react-native';

import { spacing } from '@/src/shared/theme';
import { styles } from '../../styles';
import type { CategoryAggregates } from '../types';

export function CategoryAggregateStats({ aggregates }: { aggregates: CategoryAggregates }) {
  return (
    <>
      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>📊 类别汇总</Text>
      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
          <Text style={[styles.statLabel, { color: '#2563eb' }]}>月均汇总 - 到手</Text>
          <Text style={[styles.statValueBig, { color: '#1d4ed8' }]}>¥{aggregates.avgNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
          <View style={styles.statCardSmallRow}>
            <View style={styles.categoryStatCol}>
              <Text style={styles.statLabelSmall}>总收入</Text>
              <Text style={styles.statValueSmall}>¥{aggregates.avgTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
            </View>
            <View style={styles.categoryStatCol}>
              <Text style={styles.statLabelSmall}>全包</Text>
              <Text style={styles.statValueSmall}>¥{aggregates.avgGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <Text style={[styles.statLabel, { color: '#16a34a' }]}>年度预估汇总 - 到手</Text>
          <Text style={[styles.statValueBig, { color: '#15803d' }]}>¥{aggregates.annualNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
          <View style={styles.statCardSmallRow}>
            <View style={styles.categoryStatCol}>
              <Text style={styles.statLabelSmall}>总收入</Text>
              <Text style={styles.statValueSmall}>¥{aggregates.annualTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
            </View>
            <View style={styles.categoryStatCol}>
              <Text style={styles.statLabelSmall}>全包</Text>
              <Text style={styles.statValueSmall}>¥{aggregates.annualGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
}
