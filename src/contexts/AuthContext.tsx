import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '@/types';
import { authApi } from '@/api';
import type { ApiError } from '@/api/contracts';
import { AuthContext } from './auth-context';
import { logger } from '@/lib/logger';
import {
    AUTH_TOKEN_KEY,
    clearStoredAuth,
    getStoredAuthToken,
    persistAuth,
    readStoredAuth,
    updateStoredUser,
} from '@/lib/auth-storage';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Sync initialize from browser storage to avoid flicker.
    const [auth, setAuth] = useState(readStoredAuth);
    const { token, user } = auth;
    const activeTokenRef = React.useRef(token);

    // Keep current behavior: auth is token-driven, loading remains minimal.
    const [isLoading] = useState(false);

    // The QueryClient is a module-level singleton and no query key is scoped by user, so every
    // cached account, order and profile has to be dropped whenever the session changes.
    // Without this the next person to sign in on this tab renders the previous user's data —
    // and, because several dashboard queries set a staleTime, does not even refetch it.
    const queryClient = useQueryClient();

    const logout = useCallback(() => {
        clearStoredAuth();
        activeTokenRef.current = null;
        setAuth({ token: null, user: null });
        queryClient.clear();
    }, [queryClient]);

    const login = useCallback((newUser: User, newToken: string, rememberMe: boolean) => {
        queryClient.clear();
        persistAuth(newUser, newToken, rememberMe);
        activeTokenRef.current = newToken;
        setAuth({ token: newToken, user: newUser });
    }, [queryClient]);

    const updateUser = useCallback((updatedFields: Partial<User>) => {
        setAuth(prev => {
            if (!prev.user) return prev;
            const newUser = { ...prev.user, ...updatedFields };
            updateStoredUser(newUser);
            return { ...prev, user: newUser };
        });
    }, []);

    useEffect(() => {
        const validateAuth = async () => {
            const storedToken = getStoredAuthToken();
            if (!storedToken) return;

            try {
                const freshUser = await authApi.getProfile(storedToken);
                if (activeTokenRef.current !== storedToken) return;

                const mappedUser: User = {
                    ...freshUser,
                    id: String(freshUser.id),
                    username: freshUser.full_name || freshUser.email.split('@')[0]
                };
                updateStoredUser(mappedUser);
                setAuth(prev => ({ ...prev, user: mappedUser }));
            } catch (error: unknown) {
                if (activeTokenRef.current !== storedToken) return;

                const apiError = error as Partial<ApiError>;
                if (
                    apiError.status === 401 ||
                    apiError.message?.includes('401') ||
                    apiError.message?.includes('Unauthorized')
                ) {
                    logout();
                }
            }
        };

        void validateAuth();

        const handleUnauthorized = () => {
            logger.debug('[Auth] Global unauthorized received, enforcing logout...');
            logout();
        };

        window.addEventListener('panda-auth-unauthorized', handleUnauthorized);
        return () => window.removeEventListener('panda-auth-unauthorized', handleUnauthorized);
    }, [logout]);

    // `storage` only fires in the *other* tabs, and only for localStorage — which is exactly the
    // "remember me" case where a second tab would otherwise keep rendering a signed-out session
    // (or the previous user's identity) until its next request happens to 401.
    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            // key === null means the whole store was cleared.
            if (event.key !== null && event.key !== AUTH_TOKEN_KEY) return;

            const next = readStoredAuth();
            if (next.token === activeTokenRef.current) return;

            logger.debug('[Auth] Session changed in another tab, reloading...');
            activeTokenRef.current = next.token;
            setAuth(next);

            // Unlike an in-tab sign-out - where the route change unmounts everything that held the
            // old user's data - this swaps the identity underneath a page that stays mounted.
            // queryCache.clear() drops the entries without notifying live observers, so those
            // components would keep rendering the previous user's data under the new identity.
            // A reload is the only thing that reliably guarantees nothing survives the switch.
            window.location.reload();
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: !!user?.is_admin,
        isLoading,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
