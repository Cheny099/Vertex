import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminStrategiesApi } from './strategies';

vi.mock('../../i18n', () => ({
  default: {
    t: vi.fn((key: string) => key),
  },
}));

describe('admin strategy import authentication cleanup', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('does not clear a newer session when an older upload receives 401', async () => {
    let resolveFetch!: (response: Response) => void;
    const fetchResponse = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const unauthorizedListener = vi.fn();
    localStorage.setItem('auth_token', 'old-token');
    localStorage.setItem('user_data', 'old-user');
    window.addEventListener('panda-auth-unauthorized', unauthorizedListener);
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(fetchResponse));

    const pendingImport = adminStrategiesApi.importStats(
      7,
      new File(['date,profit'], 'stats.csv', { type: 'text/csv' }),
    );
    localStorage.setItem('auth_token', 'new-token');
    localStorage.setItem('user_data', 'new-user');
    resolveFetch(new Response(null, { status: 401 }));

    await expect(pendingImport).rejects.toThrow('Unauthorized');
    expect(localStorage.getItem('auth_token')).toBe('new-token');
    expect(localStorage.getItem('user_data')).toBe('new-user');
    expect(unauthorizedListener).not.toHaveBeenCalled();
    window.removeEventListener('panda-auth-unauthorized', unauthorizedListener);
  });
});
