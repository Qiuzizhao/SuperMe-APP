import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { styles } from '../styles';

export function PillSelector({
  label,
  value,
  options,
  onChange,
  fallback,
  accent,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  fallback: string;
  accent: string;
}) {
  return (
    <View style={styles.pillSection}>
      <Text style={styles.pillSectionLabel}>{label}</Text>
      {options.length === 0 ? (
        <Text style={styles.pillEmpty}>{fallback}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
          {options.map((option) => {
            const selected = option === value;
            return (
              <Pressable key={option} onPress={() => onChange(option)} style={({ pressed }) => [styles.financePill, selected && { backgroundColor: accent, borderColor: accent }, pressed && styles.pressed]}>
                <Text style={[styles.financePillText, selected && styles.financePillTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
