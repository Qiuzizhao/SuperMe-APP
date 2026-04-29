import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { DateField } from '@/src/shared/components';
import { spacing } from '@/src/shared/theme';
import { styles } from '../../styles';
import { getTagHexColor } from '../../shared/utils';
import type { IncomeConfig } from '../types';

const screenWidth = Dimensions.get('window').width;

export function IncomeTrendChart({
  configs,
  chartMonth,
  filterCategory,
  chartData,
  onChartMonthChange,
  onFilterCategoryChange,
}: {
  configs: IncomeConfig;
  chartMonth: string;
  filterCategory: string | null;
  chartData: any;
  onChartMonthChange: (value: string) => void;
  onFilterCategoryChange: (category: string | null) => void;
}) {
  return (
    <>
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.xl, flexDirection: 'column', alignItems: 'flex-start', gap: spacing.md }]}>
        <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>📅 收入规律图</Text>
          <View style={styles.monthPickerCompact}>
            <DateField label="截止" value={chartMonth} onChangeText={onChartMonthChange} mode="month" compact />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartFilterScroll}>
          <Pressable
            onPress={() => onFilterCategoryChange(null)}
            style={({ pressed }) => [
              styles.chartFilterBtn,
              filterCategory === null ? { backgroundColor: '#2563eb', borderColor: '#2563eb' } : null,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.chartFilterBtnText, filterCategory === null ? { color: '#fff' } : null]}>到手合计</Text>
          </Pressable>

          {configs.finance_income_categories.map((category) => {
            const isSelected = filterCategory === category;
            const hex = getTagHexColor(category);
            return (
              <Pressable
                key={category}
                onPress={() => onFilterCategoryChange(category)}
                style={({ pressed }) => [
                  styles.chartFilterBtn,
                  { borderColor: hex },
                  isSelected ? { backgroundColor: hex } : null,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.chartFilterBtnText, { color: isSelected ? '#fff' : hex }]}>{category}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - spacing.lg * 2 - spacing.sm * 2}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            fillShadowGradientFrom: filterCategory ? getTagHexColor(filterCategory) : '#2563eb',
            fillShadowGradientFromOpacity: 0.4,
            fillShadowGradientTo: '#ffffff',
            fillShadowGradientToOpacity: 0.1,
            decimalPlaces: 0,
            color: (opacity = 1) => filterCategory ? getTagHexColor(filterCategory) : `rgba(37, 99, 235, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: filterCategory ? getTagHexColor(filterCategory) : '#2563eb',
            },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
          formatYLabel={(value) => {
            const number = Number(value);
            return number >= 1000 ? `${(number / 1000).toFixed(1)}k` : String(number);
          }}
        />
      </View>
    </>
  );
}
