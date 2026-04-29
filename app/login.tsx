import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Field, PrimaryButton } from '@/src/shared/components';
import { useAuth } from '@/src/auth/AuthContext';
import { colors, radius, shadow, spacing } from '@/src/shared/theme';

export default function LoginScreen() {
  const { isReady, isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('superme');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isReady && isAuthenticated) {
    return <Redirect href="/(tabs)/daily" />;
  }

  const submit = async () => {
    if (!username.trim() || !password) {
      Alert.alert('请填写账号和密码');
      return;
    }
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      Alert.alert('登录失败', err instanceof Error ? err.message : '请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <View style={styles.brandBlock}>
        <View style={styles.logoMark}>
          <Ionicons name="rocket-outline" size={30} color="#fff" />
        </View>
        <Text style={styles.logo}>SuperMe</Text>
        <Text style={styles.subtitle}>你的个人数字终端</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>欢迎回来</Text>
        <Text style={styles.panelHint}>登录后同步待办、财务、足迹和成长记录。</Text>
        <Field label="用户名" value={username} autoCapitalize="none" onChangeText={setUsername} />
        <Field label="密码" value={password} secureTextEntry onChangeText={setPassword} />
        <PrimaryButton label={submitting ? '正在登录' : '登录'} icon="log-in-outline" disabled={submitting} onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 58,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 58,
    ...shadow,
  },
  logo: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: spacing.xs,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    ...shadow,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  panelHint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
});
