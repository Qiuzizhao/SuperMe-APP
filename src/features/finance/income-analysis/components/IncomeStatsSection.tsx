import { Text, View } from 'react-native';

import { DateField } from '@/src/shared/components';
import { spacing } from '@/src/shared/theme';
import { styles } from '../../styles';

export function IncomeStatsSection({
  title,
  month,
  onMonthChange,
  cards,
  smallCards,
}: {
  title: string;
  month: string;
  onMonthChange: (value: string) => void;
  cards: { label: string; value: number; note?: string; featured?: 'green' | 'blue' }[];
  smallCards?: { label: string; value: number }[];
}) {
  return (
    <>
      <View style={[styles.sectionHeaderRow, { marginTop: title.includes('未来') ? spacing.xl : 0 }]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.monthPickerCompact}>
          <DateField label="截止" value={month} onChangeText={onMonthChange} mode="month" compact />
        </View>
      </View>

      <View style={styles.grid}>
        {cards.map((card) => {
          const featuredStyle = card.featured === 'green'
            ? { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }
            : card.featured === 'blue'
              ? { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
              : null;
          const featuredColor = card.featured === 'green' ? '#16a34a' : card.featured === 'blue' ? '#2563eb' : undefined;
          return (
            <View key={card.label} style={[styles.statCard, featuredStyle]}>
              <Text style={[styles.statLabel, featuredColor ? { color: featuredColor } : null]}>{card.label}</Text>
              <Text style={[card.featured ? styles.statValueBig : styles.statValue, featuredColor ? { color: featuredColor === '#2563eb' ? '#1d4ed8' : featuredColor } : null]}>
                ¥{card.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
              {card.note ? <Text style={styles.statNote}>{card.note}</Text> : null}
            </View>
          );
        })}

        {smallCards ? (
          <View style={styles.statCardSmallRow}>
            {smallCards.map((card) => (
              <View key={card.label} style={styles.statCardSmall}>
                <Text style={styles.statLabelSmall}>{card.label}</Text>
                <Text style={styles.statValueSmall}>¥{card.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </>
  );
}
