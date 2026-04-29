import { Pressable, Text, View } from 'react-native';

import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../../styles';
import { formatCurrency } from '../../shared/utils';

export function FinanceCalendarView({ activeTab, setActiveTab, calendarData, totalAmount, dailyAverage, reportMonth }: any) {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' }}>
        <Pressable 
          onPress={() => setActiveTab('expense')}
          style={({ pressed }) => [
            styles.bentoCard,
            { backgroundColor: activeTab === 'expense' ? colors.danger + '15' : colors.surface, padding: spacing.lg, justifyContent: 'center' },
            pressed && styles.pressed
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <View style={[styles.bentoIconWrapper, { backgroundColor: activeTab === 'expense' ? colors.danger + '25' : colors.surfaceMuted, width: 36, height: 36, borderRadius: 12 }]}>
              <Text style={{ fontSize: 16 }}>💸</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'expense' ? colors.danger : colors.textSoft }}>月支出</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: activeTab === 'expense' ? colors.danger : colors.text }}>{formatCurrency(totalAmount)}</Text>
        </Pressable>

        <Pressable 
          onPress={() => setActiveTab('income')}
          style={({ pressed }) => [
            styles.bentoCard,
            { backgroundColor: activeTab === 'income' ? colors.success + '15' : colors.surface, padding: spacing.lg, justifyContent: 'center' },
            pressed && styles.pressed
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <View style={[styles.bentoIconWrapper, { backgroundColor: activeTab === 'income' ? colors.success + '25' : colors.surfaceMuted, width: 36, height: 36, borderRadius: 12 }]}>
              <Text style={{ fontSize: 16 }}>💰</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'income' ? colors.success : colors.textSoft }}>日均</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: activeTab === 'income' ? colors.success : colors.text }}>{formatCurrency(dailyAverage)}</Text>
        </Pressable>
      </View>

      <View style={[styles.bentoCardPanel, { backgroundColor: colors.surface, padding: spacing.lg }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
            <Text key={day} style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.muted }}>{day}</Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 }}>
          {calendarData.cells.map((cell: any) => {
            const heat = cell.currentMonth ? Math.min(1, cell.total / Math.max(1, calendarData.maxDayTotal)) : 0;
            const heatColorValue = cell.currentMonth ? heatColorPastel(heat, activeTab) : 'transparent';
            const cellColor = cell.currentMonth ? (cell.total > 0 ? (activeTab === 'expense' ? colors.danger : colors.success) : colors.text) : colors.muted;
            
            return (
              <View key={cell.key} style={[{ width: '13%', aspectRatio: 0.8, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }, cell.currentMonth && { backgroundColor: heatColorValue }, cell.selected && { borderWidth: 1.5, borderColor: activeTab === 'expense' ? colors.danger : colors.success }]}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: cellColor }}>{cell.day}</Text>
                {cell.currentMonth && cell.total > 0 ? <Text style={{ fontSize: 9, fontWeight: '700', color: cellColor, marginTop: 2 }}>{activeTab === 'expense' ? '-' : '+'}{Number(cell.total).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</Text> : null}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function heatColorPastel(value: number, type: 'expense' | 'income') {
  if (value <= 0) return '#F8FAFC';
  const palette = type === 'expense'
    ? ['#FEF2F2', '#FEE2E2', '#FECACA', '#FCA5A5']
    : ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC'];
  if (value < 0.25) return palette[0];
  if (value < 0.5) return palette[1];
  if (value < 0.75) return palette[2];
  return palette[3];
}

