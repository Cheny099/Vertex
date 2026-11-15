import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@/types';
import { authApi } from '@/api';
import type { ApiError } from '@/api/contracts';
import { AuthContext, type LoginAttempt } from './auth-context';
import {
  AUTH_TOKEN_KEY, clearStoredAuth, getStoredAuthToken, persistAuth, updateStoredUser,
} from '@/lib/auth-storage';

type Session =
  | { status: 'anonymous'; token: null; user: null; preserveReturnTo: boolean }
  | { status: 'checking' | 'error'; token: string; user: null; preserveReturnTo: true }
  | { status: 'authenticated'; token: string; user: User; preserveReturnTo: true };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session>(() => {
    const token = getStoredAuthToken();
    return token
      ? { status: 'checking', token, user: null, preserveReturnTo: true }
      : { status: 'anonymous', token: null, user: null, preserveReturnTo: true };
  });
  const activeToken = useRef(session.token);
  const generation = useRef(0);
  const pendingLogin = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const invalidateLogin = useCallback(() => {
    pendingLogin.current?.abort();
    pendingLogin.current = null;
  }, []);

  const endSession = useCallback((preserveReturnTo: boolean) => {
    generation.current += 1;
    invalidateLogin();
    activeToken.current = null;
    clearStoredAuth();
    setSession({ status: 'anonymous', token: null, user: null, preserveReturnTo });
    queryClient.clear();
  }, [invalidateLogin, queryClient]);

  // Explicit sign-out must not carry the previous user's private route into the next login.
  const logout = useCallback(() => endSession(false), [endSession]);

  const validate = useCallback(async (token: string) => {
    invalidateLogin();
    const attempt = ++generation.current;
    activeToken.current = token;
    setSession({ status: 'checking', token, user: null, preserveReturnTo: true });
    queryClient.clear();
    try {
      const profile = await authApi.getProfile(token);
      if (attempt !== generation.current || token !== getStoredAuthToken()) return;
      const user: User = {
        ...profile, id: String(profile.id), username: profile.full_name || profile.email.split('@')[0],
      };
      updateStoredUser(user);
      setSession({ status: 'authenticated', token, user, preserveReturnTo: true });
    } catch (error: unknown) {
      if (attempt !== generation.current || token !== getStoredAuthToken()) return;
      if ((error as Partial<ApiError>)?.status === 401) {
        endSession(true);
      } else {
        // Network/server/protocol failures do not prove identity and do not erase credentials.
        setSession({ status: 'error', token, user: null, preserveReturnTo: true });
      }
    }
  }, [endSession, invalidateLogin, queryClient]);

  const retryValidation = useCallback(() => {
    const token = getStoredAuthToken();
    if (token) void validate(token);
    else endSession(true);
  }, [endSession, validate]);

  const beginLogin = useCallback((): LoginAttempt => {
    invalidateLogin();
    const controller = new AbortController();
    const attempt = generation.current;
    const startingToken = getStoredAuthToken();
    pendingLogin.current = controller;
    const isCurrent = () => pendingLogin.current === controller && !controller.signal.aborted && attempt === generation.current &&
      startingToken === getStoredAuthToken();
    return {
      signal: controller.signal,
      isCurrent,
      cancel: () => {
        controller.abort();
        if (pendingLogin.current === controller) pendingLogin.current = null;
      },
      complete: (user, token, rememberMe) => {
        // Check again at the only commit point, including storage changes whose event is queued.
        if (!isCurrent()) return false;
        queryClient.clear();
        persistAuth(user, token, rememberMe);
        generation.current += 1;
        pendingLogin.current = null;
        activeToken.current = token;
        setSession({ status: 'authenticated', token, user, preserveReturnTo: true });
        return true;
      },
    };
  }, [invalidateLogin, queryClient]);

  const updateUser = useCallback((fields: Partial<User>) => {
    setSession(previous => {
      if (previous.status !== 'authenticated') return previous;
      const user = { ...previous.user, ...fields };
      updateStoredUser(user);
      return { ...previous, user };
    });
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => endSession(true);
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== AUTH_TOKEN_KEY) return;
      const token = getStoredAuthToken();
      if (token === activeToken.current) return;
      if (token) void validate(token);
      else endSession(false);
    };
    window.addEventListener('panda-auth-unauthorized', handleUnauthorized);
    window.addEventListener('storage', handleStorage);
    const token = getStoredAuthToken();
    if (token) void validate(token);
    return () => {
      generation.current += 1;
      invalidateLogin();
      window.removeEventListener('panda-auth-unauthorized', handleUnauthorized);
      window.removeEventListener('storage', handleStorage);
    };
  }, [endSession, invalidateLogin, validate]);

  return <AuthContext.Provider value={{
    user: session.user,
    token: session.token,
    isAuthenticated: session.status === 'authenticated',
    isAdmin: session.status === 'authenticated' && !!session.user.is_admin,
    isLoading: session.status === 'checking',
    validationFailed: session.status === 'error',
    preserveReturnTo: session.preserveReturnTo,
    retryValidation, beginLogin, logout, updateUser,
  }}>{children}</AuthContext.Provider>;
};
