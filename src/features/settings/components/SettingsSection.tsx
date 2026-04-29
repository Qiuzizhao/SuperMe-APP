import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/src/shared/components';
import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../styles';

export function SettingsSection({
  title,
  subtitle,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <Pressable onPress={onToggle} style={styles.sectionHeader}>
        <View style={styles.sectionHeaderTitle}>
          <Text style={[styles.cardTitle, { marginBottom: subtitle ? spacing.xs : 0 }]}>{title}</Text>
          {subtitle ? <Text style={[styles.helperText, { marginBottom: 0 }]}>{subtitle}</Text> : null}
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.muted} />
      </Pressable>

      {expanded ? <View style={styles.sectionContent}>{children}</View> : null}
    </Card>
  );
}
