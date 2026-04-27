import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiRequest, setApiToken, setUnauthorizedHandler } from '@/src/lib/api';
import { deleteTokenValue, getTokenValue, setTokenValue } from './tokenStorage';

const TOKEN_KEY = 'superme.auth.token';

type AuthContextValue = {
  isReady: boolean;
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const logout = useCallback(async () => {
    setApiToken(null);
    setToken(null);
    setUsername(null);
    await deleteTokenValue(TOKEN_KEY);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    let mounted = true;
    getTokenValue(TOKEN_KEY)
      .then(async (storedToken) => {
        if (!mounted) return;
        if (!storedToken) return;
        setApiToken(storedToken);
        const me = await apiRequest<{ username: string }>('/auth/me');
        if (!mounted) return;
        setToken(storedToken);
        setUsername(me.username);
      })
      .catch(() => {
        void deleteTokenValue(TOKEN_KEY);
        setApiToken(null);
      })
      .finally(() => {
        if (mounted) setIsReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (nextUsername: string, password: string) => {
    const response = await apiRequest<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: { username: nextUsername, password },
      auth: false,
    });
    setApiToken(response.access_token);
    await setTokenValue(TOKEN_KEY, response.access_token);
    setToken(response.access_token);
    setUsername(nextUsername);
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      token,
      username,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [isReady, login, logout, token, username],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
