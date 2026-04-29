import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Pressable, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../../styles';
import { getTagHexColor } from '../../shared/utils';

const screenWidth = Dimensions.get('window').width;

export function DonutBreakdown({
  data,
  total,
  centerTitle,
  activeTab,
  onToggleLevel,
}: {
  data: any[];
  total: number;
  centerTitle: string;
  activeTab: 'expense' | 'income';
  onToggleLevel: () => void;
}) {
  const stageWidth = screenWidth - spacing.lg * 4;
  const size = Math.min(stageWidth - 80, 240);
  const offsetX = Math.max(0, (stageWidth - size) / 2);
  const center = size / 2;
  const radiusValue = size / 2 - 32;
  const strokeWidth = 28;
  const visibleData = data.length > 0 ? data : [{ name: '暂无', value: 1 }];
  const chartTotal = total > 0 ? total : 1;
  let cursor = -90;
  const segments = visibleData.map((item, index) => {
    const percent = chartTotal > 0 ? (Number(item.value || 0) / chartTotal) * 100 : 0;
    // 如果小于0.5%，在环形图上强制给定一个极小的值，以保证能看到一条细线
    let angle = (percent / 100) * 360;
    if (percent > 0 && angle < 0.5) {
        angle = 0.5; 
    }
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    return {
      item,
      index,
      start,
      end,
      mid: start + angle / 2,
      color: item.name === '暂无' ? colors.border : getTagHexColor(item.name),
    };
  });

  return (
    <View style={[styles.donutStage, { height: size + 96, width: stageWidth }]}> 
      <Svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} style={{ overflow: 'visible' }}>
        <G>
          {segments.map((segment) => (
            <Path
              key={segment.item.name + segment.index}
              d={describeArc(center, center, radiusValue, segment.start, segment.end - 1)}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              fill="none"
            />
          ))}
          {segments.slice(0, 10).map((segment) => {
            const percent = total > 0 ? (segment.item.value / total) * 100 : 0;
            // 只为占比大于等于5%的绘制带百分比的外部线
            if (percent < 5) {
                // 占比小于5%，画一根短线指出来即可
                const arcPoint = polarToCartesian(center, center, radiusValue + strokeWidth / 2 + 1, segment.mid);
                const elbow = polarToCartesian(center, center, radiusValue + strokeWidth / 2 + 8, segment.mid);
                return (
                    <Path
                        key={'label-line-short-' + segment.item.name + segment.index}
                        d={'M ' + arcPoint.x + ' ' + arcPoint.y + ' L ' + elbow.x + ' ' + elbow.y}
                        stroke="#B0B0B0"
                        strokeWidth={1}
                        fill="none"
                    />
                );
            }

            const arcPoint = polarToCartesian(center, center, radiusValue + strokeWidth / 2 + 1, segment.mid);
            const elbow = polarToCartesian(center, center, radiusValue + strokeWidth / 2 + 16, segment.mid);
            const isRight = elbow.x >= center;
            const endX = elbow.x + (isRight ? 12 : -12);
            return (
              <Path
                key={'label-line-' + segment.item.name + segment.index}
                d={'M ' + arcPoint.x + ' ' + arcPoint.y + ' L ' + elbow.x + ' ' + elbow.y + ' L ' + endX + ' ' + elbow.y}
                stroke="#B0B0B0"
                strokeWidth={1}
                fill="none"
              />
            );
          })}
        </G>
      </Svg>
      <Pressable focusable={false} style={({ pressed }) => [styles.donutCenter, pressed && styles.pressed]} onPress={onToggleLevel}>
        <Text style={styles.donutTitle}>{centerTitle}</Text>
        <Ionicons name="swap-vertical" size={18} color={activeTab === 'income' ? colors.success : colors.danger} />
        <Text style={styles.donutHint}>轻点切换</Text>
      </Pressable>
      {segments.slice(0, 10).map((segment) => {
        const percent = total > 0 ? (segment.item.value / total) * 100 : 0;
        const elbow = polarToCartesian(center, center, radiusValue + strokeWidth / 2 + 16, segment.mid);
        const isRight = elbow.x >= center;
        
        if (percent < 5) {
            // 小于 5% 只显示名字
            const labelTop = Math.max(0, Math.min(size + 24, elbow.y - 8));
            const rawLeft = offsetX + (isRight ? elbow.x + 4 : elbow.x - 56);
            const labelLeft = Math.max(0, Math.min(stageWidth - 60, rawLeft));
            return (
                <View key={'label-' + segment.item.name + segment.index} style={[styles.donutLabelSmall, { left: labelLeft, top: labelTop, alignItems: isRight ? 'flex-start' : 'flex-end' }]}>
                    <Text style={styles.donutLabelText}>{segment.item.name}</Text>
                </View>
            );
        }

        // 大于等于 5% 显示名字和百分比
        const labelTop = Math.max(0, Math.min(size + 24, elbow.y - 18));
        const rawLeft = offsetX + (isRight ? elbow.x + 20 : elbow.x - 84);
        const labelLeft = Math.max(0, Math.min(stageWidth - 90, rawLeft));
        return (
          <View key={'label-' + segment.item.name + segment.index} style={[styles.donutLabel, { left: labelLeft, top: labelTop, alignItems: isRight ? 'flex-start' : 'flex-end' }]}>
            <Text style={styles.donutLabelText}>{segment.item.name}</Text>
            <Text style={styles.donutLabelPercent}>{percent.toFixed(2)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

function polarToCartesian(centerX: number, centerY: number, radiusValue: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return { x: centerX + (radiusValue * Math.cos(angleInRadians)), y: centerY + (radiusValue * Math.sin(angleInRadians)) };
}

function describeArc(x: number, y: number, radiusValue: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radiusValue, endAngle);
  const end = polarToCartesian(x, y, radiusValue, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', radiusValue, radiusValue, 0, largeArcFlag, 0, end.x, end.y].join(' ');
}

