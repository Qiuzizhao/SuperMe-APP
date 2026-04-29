import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { API_URL } from '@/src/shared/api';
import { IconButton } from '@/src/shared/components';
import { colors, spacing } from '@/src/shared/theme';
import { styles } from '../styles';

export function AccountCard({ username, onLogout }: { username?: string | null; onLogout: () => void }) {
  return (
    <LinearGradient colors={['#EEF6FF', '#FFF0F6', '#F2FFF7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.accountHero}>
      <View style={styles.accountRow}>
        <View style={styles.accountIcon}>
          <Ionicons name="person-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.accountMain}>
          <Text style={styles.accountEyebrow}>SuperMe Control Center</Text>
          <Text style={styles.accountName}>{username || 'SuperMe'}</Text>
          <Text style={styles.metaText} numberOfLines={1}>{API_URL}</Text>
        </View>
        <IconButton name="log-out-outline" label="退出登录" soft onPress={onLogout} />
      </View>
      <View style={styles.accountHeroFooter}>
        <View style={styles.accountHeroPill}>
          <Ionicons name="shield-checkmark-outline" size={15} color={colors.success} />
          <Text style={styles.accountHeroPillText}>配置已本地暂存，保存后同步</Text>
        </View>
        <Text style={[styles.metaText, { marginTop: spacing.sm }]}>管理分类、标签与收入分析口径</Text>
      </View>
    </LinearGradient>
  );
}
