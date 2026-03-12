import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { authApi } from '@/api';
import type { ApiError } from '@/api/contracts';
import { AuthContext } from './auth-context';
import { logger } from '@/lib/logger';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Sync initialize from localStorage to avoid flicker.
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem(USER_KEY);
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    // Keep current behavior: auth is token-driven, loading remains minimal.
    const [isLoading] = useState(false);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }, []);

    const login = useCallback((newUser: User, newToken: string) => {
        setUser(newUser);
        setToken(newToken);
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    }, []);

    const updateUser = useCallback((updatedFields: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const newUser = { ...prev, ...updatedFields };
            localStorage.setItem(USER_KEY, JSON.stringify(newUser));
            return newUser;
        });
    }, []);

    useEffect(() => {
        const validateAuth = async () => {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            if (!storedToken) return;

            try {
                const freshUser = await authApi.getProfile();
                const mappedUser: User = {
                    ...freshUser,
                    id: String(freshUser.id),
                    username: freshUser.full_name || freshUser.email.split('@')[0]
                };
                setUser(mappedUser);
                localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
            } catch (error: unknown) {
                const apiError = error as Partial<ApiError>;
                if (apiError.message?.includes('401') || apiError.message?.includes('Unauthorized')) {
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
