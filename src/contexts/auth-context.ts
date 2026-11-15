import { createContext } from 'react';
import { User } from '@/types';

export interface LoginAttempt {
  signal: AbortSignal;
  isCurrent: () => boolean;
  cancel: () => void;
  complete: (user: User, token: string, rememberMe: boolean) => boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  validationFailed: boolean;
  preserveReturnTo: boolean;
  retryValidation: () => void;
  beginLogin: () => LoginAttempt;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
