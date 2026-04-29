import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PrimaryButton } from '@/src/shared/components';
import { colors } from '@/src/shared/theme';
import { styles } from '../styles';

export function SettingsDetailPanel({
  title,
  subtitle,
  icon,
  gradientColors,
  saving,
  onBack,
  onSave,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: [string, string];
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}>) {
  return (
    <View style={styles.detailPanel}>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.detailHero}>
        <View style={styles.detailNavRow}>
          <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [styles.detailBackButton, pressed && styles.cardPressed]}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Text style={styles.detailBackText}>设置中心</Text>
          </Pressable>
          <PrimaryButton label={saving ? '保存中' : '保存'} icon="save-outline" disabled={saving} onPress={onSave} />
        </View>

        <View style={styles.detailTitleRow}>
          <View style={styles.detailIcon}>
            <Ionicons name={icon} size={24} color={colors.text} />
          </View>
          <View style={styles.detailTitleText}>
            <Text style={styles.detailTitle}>{title}</Text>
            <Text style={styles.detailSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.detailContent}>{children}</View>
    </View>
  );
}
