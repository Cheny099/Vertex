import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { authApi } from '@/api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. 同步初始状态：直接在函数体内同步读取，拒绝异步 Loading 造成的“非秒开”
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem(USER_KEY);
        try {
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    // 只要有 token，我们就假定由于缓存他是 isAuthenticated 的。
    // isLoading 仅用于极其严格的初次物理冷启动（通常不到 10ms）
    const [isLoading, setIsLoading] = useState(false);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        // 清理完后，如果是 401 事件触发的，由于页面可能还在路由保护内，
        // 这里的状态变更会触发 ProtectedRoute 的 Navigate 到首页。
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

    // 2. 异步校验逻辑：移入 useEffect 且不再阻塞渲染
    useEffect(() => {
        const validateAuth = async () => {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            if (!storedToken) return;



            try {
                // 后台静默确认
                const freshUser = await authApi.getProfile();
                const mappedUser: User = {
                    ...freshUser,
                    id: String(freshUser.id),
                    username: freshUser.full_name || freshUser.email.split('@')[0]
                } as any;
                setUser(mappedUser);
                localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
            } catch (error: any) {
                // 如果后端返回 401，则执行清空
                if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
                    logout();
                }
            }
        };

        validateAuth();

        // 3. 监听拦截器发出的全局登出信号
        const handleUnauthorized = () => {
            console.log('[Auth] Global unauthorized received, enforcing logout...');
            logout();
        };

        window.addEventListener('panda-auth-unauthorized' as any, handleUnauthorized);
        return () => window.removeEventListener('panda-auth-unauthorized' as any, handleUnauthorized);
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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
