import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { authApi } from '@/api';
import type { ApiError } from '@/api/contracts';
import { AuthContext } from './auth-context';
import { logger } from '@/lib/logger';
import {
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

    const logout = useCallback(() => {
        clearStoredAuth();
        activeTokenRef.current = null;
        setAuth({ token: null, user: null });
    }, []);

    const login = useCallback((newUser: User, newToken: string, rememberMe: boolean) => {
        persistAuth(newUser, newToken, rememberMe);
        activeTokenRef.current = newToken;
        setAuth({ token: newToken, user: newUser });
    }, []);

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
