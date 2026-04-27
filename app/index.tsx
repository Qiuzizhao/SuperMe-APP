import { Redirect } from 'expo-router';

import { useAuth } from '@/src/auth/AuthContext';

export default function IndexRoute() {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) return null;
  return <Redirect href={isAuthenticated ? '/(tabs)/daily' : '/login'} />;
}
