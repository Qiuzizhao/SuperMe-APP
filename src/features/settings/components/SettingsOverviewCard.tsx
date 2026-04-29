import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/src/shared/theme';
import { styles } from '../styles';
import type { SettingsPanelKey } from '../types';

export type SettingsOverviewCardProps = {
  panel: SettingsPanelKey;
  title: string;
  subtitle: string;
  meta: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
  featured?: boolean;
  onPress: (panel: SettingsPanelKey) => void;
};

export function SettingsOverviewCard({
  panel,
  title,
  subtitle,
  meta,
  icon,
  colors: gradientColors,
  featured,
  onPress,
}: SettingsOverviewCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(panel)}
      style={({ pressed }) => [styles.overviewCardPressable, featured && styles.overviewCardFeatured, pressed && styles.cardPressed]}
    >
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.overviewCardGradient}>
        <View style={styles.overviewCardTop}>
          <View style={styles.overviewIcon}>
            <Ionicons name={icon} size={22} color={colors.text} />
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSoft} />
        </View>
        <View>
          <Text style={styles.overviewCardTitle}>{title}</Text>
          <Text style={styles.overviewCardSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.overviewCardMeta}>{meta}</Text>
      </LinearGradient>
    </Pressable>
  );
}
