import type { User } from '@/types';

export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USER_KEY = 'user_data';

const LEGACY_USER_KEY = 'panda_quant_user';

export interface StoredAuth {
  token: string | null;
  user: User | null;
}

function readUser(storage: Storage): User | null {
  const storedUser = storage.getItem(AUTH_USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
}

function readAuthFrom(storage: Storage): StoredAuth {
  return {
    token: storage.getItem(AUTH_TOKEN_KEY),
    user: readUser(storage),
  };
}

export function readStoredAuth(): StoredAuth {
  const sessionAuth = readAuthFrom(sessionStorage);
  return sessionAuth.token ? sessionAuth : readAuthFrom(localStorage);
}

export function getStoredAuthToken(): string | null {
  return sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
}

export function persistAuth(user: User, token: string, rememberMe: boolean): void {
  clearStoredAuth();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(AUTH_TOKEN_KEY, token);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function updateStoredUser(user: User): void {
  if (sessionStorage.getItem(AUTH_TOKEN_KEY)) {
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return;
  }

  if (localStorage.getItem(AUTH_TOKEN_KEY)) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function clearStoredAuth(): void {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(AUTH_TOKEN_KEY);
    storage.removeItem(AUTH_USER_KEY);
    storage.removeItem(LEGACY_USER_KEY);
  }
}
