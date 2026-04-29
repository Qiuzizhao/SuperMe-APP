import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../styles';
import type { ConfigListKey, IncomeLevel, SettingsConfig } from '../types';
import { getIncomeLevel, getIncomeLevelLabel, getTagHexColor, getTagSoftColor } from '../utils';

export function IncomeCategoryEditor({
  configs,
  newValue,
  onNewValueChange,
  onAdd,
  onRemove,
  onSelectLevel,
}: {
  configs: SettingsConfig;
  newValue: string;
  onNewValueChange: (value: string) => void;
  onAdd: (key: ConfigListKey) => void;
  onRemove: (key: ConfigListKey, value: string) => void;
  onSelectLevel: (category: string, currentLevel: IncomeLevel) => void;
}) {
  return (
    <>
      <View style={styles.incomeCatList}>
        {configs.finance_income_categories.map((category) => {
          const level = getIncomeLevel(configs, category);
          const hex = getTagHexColor(category);
          const softHex = getTagSoftColor(category);

          return (
            <View key={category} style={styles.incomeCatRowCompact}>
              <View style={[styles.tagBadgeCompact, { backgroundColor: softHex, borderColor: hex }]}>
                <Text style={[styles.tagBadgeText, { color: hex }]}>{category}</Text>
                <Pressable onPress={() => onRemove('finance_income_categories', category)} style={styles.tagRemove} hitSlop={10}>
                  <Ionicons name="close" size={14} color={hex} />
                </Pressable>
              </View>

              <Pressable style={styles.levelSelectorBtn} onPress={() => onSelectLevel(category, level)}>
                <Text style={styles.levelSelectorText}>{getIncomeLevelLabel(level)}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSoft} />
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={[styles.treeAddRowMobile, { marginTop: spacing.md, paddingHorizontal: 0 }]}>
        <TextInput
          style={[styles.treeInputMobile, { backgroundColor: colors.surfaceMuted, height: 44 }]}
          placeholder="输入新收入类别..."
          placeholderTextColor={colors.faint}
          value={newValue}
          onChangeText={onNewValueChange}
          onSubmitEditing={() => onAdd('finance_income_categories')}
        />
        <Pressable onPress={() => onAdd('finance_income_categories')} style={[styles.treeAddBtnMobile, { height: 44, width: 44, backgroundColor: colors.primarySoft }]}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </>
  );
}
