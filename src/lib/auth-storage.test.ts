import { beforeEach, describe, expect, it } from 'vitest';

import type { User } from '@/types';
import {
  getStoredAuthToken,
  readStoredAuth,
  updateStoredUser,
} from './auth-storage';

const persistentUser: User = {
  id: '1',
  username: 'persistent-user',
  email: 'persistent@example.com',
};

const sessionUser: User = {
  id: '2',
  username: 'session-user',
  email: 'session@example.com',
};

describe('auth storage selection', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('auth_token', 'persistent-token');
    localStorage.setItem('user_data', JSON.stringify(persistentUser));
    sessionStorage.setItem('auth_token', 'session-token');
    sessionStorage.setItem('user_data', JSON.stringify(sessionUser));
  });

  it('uses the tab-scoped session when both storage types contain authentication', () => {
    expect(getStoredAuthToken()).toBe('session-token');
    expect(readStoredAuth()).toEqual({ token: 'session-token', user: sessionUser });
  });

  it('updates the user in the tab-scoped session when both storage types contain authentication', () => {
    const updatedUser = { ...sessionUser, username: 'updated-session-user' };

    updateStoredUser(updatedUser);

    expect(JSON.parse(sessionStorage.getItem('user_data') || 'null')).toEqual(updatedUser);
    expect(JSON.parse(localStorage.getItem('user_data') || 'null')).toEqual(persistentUser);
  });
});
