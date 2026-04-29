import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { colors } from '@/src/shared/theme';
import { styles } from '../styles';
import type { ConfigListKey } from '../types';
import { getTagHexColor, getTagSoftColor } from '../utils';

export function TagEditor({
  configKey,
  items,
  value,
  placeholder,
  onValueChange,
  onAdd,
  onRemove,
}: {
  configKey: ConfigListKey;
  items: string[];
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  onAdd: (key: ConfigListKey) => void;
  onRemove: (key: ConfigListKey, value: string) => void;
}) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.tagsContainer}>
        {items.map((tag) => {
          const hex = getTagHexColor(tag);
          const softHex = getTagSoftColor(tag);
          return (
            <View key={tag} style={[styles.tagBadge, { backgroundColor: softHex, borderColor: hex }]}>
              <Text style={[styles.tagBadgeText, { color: hex }]}>{tag}</Text>
              <Pressable onPress={() => onRemove(configKey, tag)} style={styles.tagRemove} hitSlop={10}>
                <Ionicons name="close" size={14} color={hex} />
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          value={value}
          onChangeText={onValueChange}
          onSubmitEditing={() => onAdd(configKey)}
        />
        <Pressable onPress={() => onAdd(configKey)} style={styles.addBtnMobile}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}
