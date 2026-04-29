import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/shared/theme';
import { styles } from '../../styles';
import { formatCurrency, getTagHexColor, getTagSoftColor } from '../../shared/utils';
import { DonutBreakdown } from './DonutBreakdown';
import { TreemapBreakdown, getCategoryIcon } from './TreemapBreakdown';

export function FinanceReport({
  activeTab,
  setActiveTab,
  totalExpense,
  totalIncome,
  expenseChartLevel,
  setExpenseChartLevel,
  chartType,
  setChartType,
  categoryData,
  selectedReportCategory,
  setSelectedReportCategory,
  filteredTotalAmount,
}: any) {
  const levelLabel = expenseChartLevel === 'subcategory' ? '切换大类' : '切换小类';
  const centerTitle = activeTab === 'expense'
    ? (expenseChartLevel === 'subcategory' ? '支出小类' : '支出大类')
    : (expenseChartLevel === 'subcategory' ? '收入小类' : '收入大类');
  const activeAmountColor = activeTab === 'income' ? colors.success : colors.danger;
  const parentStats = new Map<string, { value: number; count: number }>();
  categoryData.forEach((item: any) => {
    const parent = item.parent || item.name;
    const current = parentStats.get(parent) || { value: 0, count: 0 };
    parentStats.set(parent, { value: current.value + item.value, count: current.count + item.count });
  });
  let renderedParent = '';

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' }}>
        <Pressable 
          onPress={() => setActiveTab('expense')}
          style={({ pressed }) => [
            styles.bentoCard,
            { backgroundColor: activeTab === 'expense' ? colors.danger + '15' : colors.surface, padding: spacing.md, justifyContent: 'center', aspectRatio: 1.22 },
            pressed && styles.pressed
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <View style={[styles.bentoIconWrapper, { backgroundColor: activeTab === 'expense' ? colors.danger + '25' : colors.surfaceMuted, width: 32, height: 32, borderRadius: 11 }]}>
              <Text style={{ fontSize: 14 }}>💸</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === 'expense' ? colors.danger : colors.textSoft }}>总支出</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '900', color: activeTab === 'expense' ? colors.danger : colors.text }}>{formatCurrency(totalExpense)}</Text>
        </Pressable>

        <Pressable 
          onPress={() => setActiveTab('income')}
          style={({ pressed }) => [
            styles.bentoCard,
            { backgroundColor: activeTab === 'income' ? colors.success + '15' : colors.surface, padding: spacing.md, justifyContent: 'center', aspectRatio: 1.22 },
            pressed && styles.pressed
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <View style={[styles.bentoIconWrapper, { backgroundColor: activeTab === 'income' ? colors.success + '25' : colors.surfaceMuted, width: 32, height: 32, borderRadius: 11 }]}>
              <Text style={{ fontSize: 14 }}>💰</Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === 'income' ? colors.success : colors.textSoft }}>总收入</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '900', color: activeTab === 'income' ? colors.success : colors.text }}>{formatCurrency(totalIncome)}</Text>
        </Pressable>
      </View>

      <View style={[styles.bentoCardPanel, { backgroundColor: colors.surface, padding: spacing.lg }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>结构分析</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable onPress={() => setExpenseChartLevel(expenseChartLevel === 'subcategory' ? 'category' : 'subcategory')} style={({ pressed }) => [{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.surfaceMuted }, pressed && styles.pressed]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSoft }}>{levelLabel}</Text>
            </Pressable>
            <Pressable onPress={() => setChartType(chartType === 'donut' ? 'area' : 'donut')} style={({ pressed }) => [{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.surfaceMuted }, pressed && styles.pressed]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSoft }}>{chartType === 'donut' ? '切换面积' : '切换环形'}</Text>
            </Pressable>
          </View>
        </View>

        {chartType === 'donut' ? (
          <DonutBreakdown
            data={categoryData}
            total={filteredTotalAmount}
            centerTitle={centerTitle}
            activeTab={activeTab}
            onToggleLevel={() => setExpenseChartLevel(expenseChartLevel === 'subcategory' ? 'category' : 'subcategory')}
          />
        ) : (
          <TreemapBreakdown data={categoryData} total={filteredTotalAmount} />
        )}
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
        {categoryData.length === 0 ? (
          <View style={styles.emptyBillCard}>
            <Text style={styles.emptyBillIcon}>📊</Text>
            <Text style={styles.emptyBillText}>暂无报表数据</Text>
          </View>
        ) : categoryData.map((item: any) => {
          const percent = filteredTotalAmount > 0 ? item.value / filteredTotalAmount : 0;
          const selected = selectedReportCategory === item.name;
          const parent = item.parent || item.name;
          const parentSummary = parentStats.get(parent);
          const parentPercent = parentSummary && filteredTotalAmount > 0 ? parentSummary.value / filteredTotalAmount : 0;
          const showParent = activeTab === 'expense' && expenseChartLevel === 'subcategory' && parent !== renderedParent;
          renderedParent = parent;
          return (
            <React.Fragment key={item.name}>
              {showParent && parentSummary ? (
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.muted, marginLeft: spacing.sm, marginTop: spacing.sm, marginBottom: 2 }}>
                  {parent} {(parentPercent * 100).toFixed(1)}% · {formatCurrency(parentSummary.value)}
                </Text>
              ) : null}
              <Pressable 
                onPress={() => setSelectedReportCategory(selected ? null : item.name)} 
                style={({ pressed }) => [
                  { 
                    backgroundColor: selected ? colors.primary + '15' : colors.surface, 
                    borderRadius: radius.xl, 
                    padding: spacing.md, 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    borderWidth: 1, 
                    borderColor: selected ? colors.primary + '30' : 'rgba(0,0,0,0.03)' 
                  },
                  pressed && styles.pressed
                ]}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: getTagSoftColor(item.name), justifyContent: 'center', alignItems: 'center', marginRight: spacing.md }}>
                  <Ionicons name={getCategoryIcon(item.name)} size={20} color={getTagHexColor(item.name)} />
                </View>
                <View style={{ flex: 1, marginRight: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted }}>{(percent * 100).toFixed(1)}%</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: colors.surfaceMuted, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${Math.max(2, percent * 100)}%`, backgroundColor: getTagHexColor(item.name), borderRadius: 3 }} />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: activeAmountColor }}>{formatCurrency(item.value)}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 2 }}>{item.count}笔</Text>
                </View>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}
