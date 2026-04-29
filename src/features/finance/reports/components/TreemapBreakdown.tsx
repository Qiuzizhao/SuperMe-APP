import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { styles } from '../../styles';
import { getTagHexColor, getTagSoftColor } from '../../shared/utils';

export function TreemapBreakdown({ data, total }: { data: any[]; total: number }) {
  const items = data.slice(0, 6);
  if (items.length === 0) return <View style={styles.treemapEmpty}><Text style={styles.emptyBillText}>暂无面积数据</Text></View>;
  return (
    <View style={styles.treemap}>
      {items.map((item, index) => {
        const percent = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <View key={item.name} style={[styles.treemapTile, styles['treemapTile' + index as keyof typeof styles] as any, { backgroundColor: getTagSoftColor(item.name) }]}>
            <Text style={[styles.treemapName, { color: getTagHexColor(item.name) }]}>{item.name}</Text>
            <Text style={[styles.treemapPercent, { color: getTagHexColor(item.name) }]}>{percent.toFixed(2)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

export function getCategoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  if (/食|餐|菜|饭|吃|喝/.test(name)) return 'restaurant-outline';
  if (/车|贷|供|房|月供/.test(name)) return 'card-outline';
  if (/软件|数码|外设|电脑|手机/.test(name)) return 'phone-portrait-outline';
  if (/衣|服/.test(name)) return 'shirt-outline';
  if (/物业|电|水|家/.test(name)) return 'home-outline';
  if (/薪|工资|收入/.test(name)) return 'cash-outline';
  return 'apps-outline';
}
