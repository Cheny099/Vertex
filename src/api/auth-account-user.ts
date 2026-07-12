import i18n from '../i18n';
import { createApiError } from './contracts';
import { isRecord } from './guards';
import { API_BASE_URL, request } from './core';
import type {
  Account,
  AccountBalance,
  AccountCreateDto,
  AccountStatusResponse,
  ForgotPasswordRequest,
  InviteRedeemRequest,
  InviteRedeemResponse,
  LoginWithCodeRequest,
  ResetPasswordRequest,
  SendLoginCodeRequest,
  SendRegisterCodeRequest,
  UserProfile,
  UserRegisterRequest,
} from './types';

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  login: async (credentials: AuthCredentials) => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = 'Login failed';
      try {
        const errBody = await response.json();
        errorMsg = errBody.detail || errBody.msg || errorMsg;
      } catch {
        // ignore
      }
      throw new Error(errorMsg);
    }
    return response.json();
  },

  sendRegisterCode: async (data: SendRegisterCodeRequest) => {
    return request<{ message: string }>('/auth/send-register-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  register: async (data: UserRegisterRequest) => {
    return request<UserProfile>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getProfile: async (token?: string) => {
    return request<UserProfile>(
      '/auth/me',
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    );
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendLoginCode: async (data: SendLoginCodeRequest) => {
    return request<{ message: string }>('/auth/send-login-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  loginWithCode: async (data: LoginWithCodeRequest) => {
    return request<AuthResponse>('/auth/login-with-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  redeemInvite: async (data: InviteRedeemRequest) => {
    return request<InviteRedeemResponse>('/auth/redeem-invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const accountApi = {
  list: async () => {
    const accounts = await request<Account[]>('/accounts/');
    // Backend uses soft delete; filter records with deleted_at
    return accounts.filter((acc) => !acc.deleted_at);
  },

  create: async (data: AccountCreateDto) => {
    return request<Account>('/accounts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  get: async (id: number) => {
    return request<Account>(`/accounts/${id}`);
  },

  update: async (id: number, data: Partial<Account>) => {
    return request<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Checklist 2.5: safe update (simulate PATCH /profile)
  // Only allows changing name, api_key, api_secret.
  // Strictly filters out exchange/base_url to prevent config corruption.
  updateProfile: async (id: number, data: { name?: string; api_key?: string; api_secret?: string }) => {
    const safePayload: Partial<Record<'name' | 'api_key' | 'api_secret', string>> = {};
    if (data.name !== undefined) safePayload.name = data.name;
    if (data.api_key !== undefined) safePayload.api_key = data.api_key;
    if (data.api_secret !== undefined) safePayload.api_secret = data.api_secret;

    return request<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(safePayload),
    });
  },

  toggleActive: async (id: number, is_active: boolean) => {
    return request<Account>(`/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    });
  },

  delete: async (id: number) => {
    return request<void>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  },

  getStatus: async (id: number) => {
    return request<AccountStatusResponse>(`/accounts/${id}/status`);
  },

  connect: async (id: number) => {
    return request<unknown>(`/accounts/${id}/connect`, {
      method: 'POST',
    });
  },

  verify: async (id: number) => {
    const res = await request<AccountStatusResponse>(`/accounts/${id}/verify`, {
      method: 'POST',
    });
    // Backend may return 200 for verify failures; throw to trigger error handling
    // We must throw here so toast.promise catches it as an error.
    if (res.status !== 'ok') {
      const detail = isRecord(res.detail) ? res.detail : undefined;
      const message =
        res.last_error ||
        (detail && typeof detail.message === 'string' ? detail.message : undefined) ||
        'Verification failed';
      throw createApiError(message, {
        status: res.status,
        detail: res.detail,
        last_error: res.last_error,
        raw: res,
      });
    }
    return res;
  },

  resetSession: async (id: number, mode: 'soft' | 'hard' = 'soft') => {
    return request<unknown>(`/accounts/${id}/reset-session`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  },

  /**
   * Fetch account available margin (for fixed-amount mode upper bound)
   * - First try /accounts/{id}/balance
   * - If backend doesn't implement it, return null and let frontend fallback
   */
  getBalance: async (id: number): Promise<AccountBalance | null> => {
    try {
      return await request<AccountBalance>(`/accounts/${id}/balance`);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('404')) return null;
      return null;
    }
  },
};

export const userApi = {
  getProfile: authApi.getProfile,

  // Safe profile update (simulated PATCH with restricted PUT)
  // Checklist 2.5: Only allow name/api_key/api_secret
  updateProfile: async (data: Partial<UserProfile> & { api_key?: string; api_secret?: string; name?: string }) => {
    // Backend has no PATCH /auth/me for these fields now.
    // Keep behavior unchanged.
    throw new Error(i18n.t('common.feature_coming_soon'));
  },
};
