import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/src/shared/components';
import { styles } from '../styles';
import type { ModuleConfig } from '../types';
import { getGreeting } from '../utils';

export function CrudModulePicker({
  modules,
  title,
  subtitle,
  onSelect,
}: {
  modules: ModuleConfig[];
  title: string;
  subtitle: string;
  onSelect: (key: string) => void;
}) {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.bentoContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroGreeting}>{title === '日常' ? getGreeting() : title}</Text>
          <Text style={styles.heroDate}>{subtitle}</Text>
        </View>
        <View style={styles.bentoGrid}>
          {modules.map((item) => {
            const isLarge = item.key === 'todos' || item.key === 'finances';
            return (
              <Pressable key={item.key} onPress={() => onSelect(item.key)} style={({ pressed }) => [styles.bentoCard, isLarge && styles.bentoCardLarge, pressed && styles.pressed]}>
                <LinearGradient colors={[`${item.accent}25`, `${item.accent}05`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                <View style={styles.bentoContent}>
                  <View style={[styles.bentoIconWrapper, { backgroundColor: `${item.accent}35` }]}>
                    <Ionicons name={item.icon} size={isLarge ? 32 : 26} color={item.accent} />
                  </View>
                  <View style={styles.bentoTextWrapper}>
                    <Text style={[styles.bentoTitle, isLarge && styles.bentoTitleLarge]}>{item.title}</Text>
                    <Text style={styles.bentoSubtitle} numberOfLines={1}>{item.subtitle || '开始记录'}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
