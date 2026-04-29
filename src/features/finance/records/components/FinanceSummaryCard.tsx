import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { styles } from '../../styles';
import { formatCurrency } from '../../shared/utils';
import type { TransactionType } from '../types';

export function FinanceSummaryCard({ activeTab, totalAmount }: { activeTab: TransactionType; totalAmount: number }) {
  return (
    <LinearGradient
      colors={activeTab === 'expense' ? ['#f43f5e', '#be123c'] : ['#10b981', '#047857']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.creditCard}
    >
      <View style={styles.creditCardTop}>
        <Text style={styles.creditCardLabel}>本期总{activeTab === 'expense' ? '支出' : '收入'}</Text>
        <Ionicons name="card-outline" size={24} color="rgba(255,255,255,0.5)" />
      </View>
      <Text style={styles.creditCardAmount}>
        {activeTab === 'expense' ? '-' : '+'}{formatCurrency(totalAmount)}
      </Text>
      <View style={styles.creditCardBottom}>
        <Text style={styles.creditCardDate}>{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}</Text>
        <Text style={styles.creditCardBrand}>SUPERME FINANCE</Text>
      </View>
    </LinearGradient>
  );
}
