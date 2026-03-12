import i18n from '../i18n';
import { toast } from 'sonner';

import { createApiError } from './contracts';
import type { JsonObject } from './contracts';
import { isRecord, isString } from './guards';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api/v1` : '/api/v1';
export const TOKEN_KEY = 'auth_token';

export function translateBackendErrorMessage(rawMsg: string): string {
  const normalized = (rawMsg || '').trim();
  const directKey = `common:backend_errors.${rawMsg}`;
  const normalizedKey = `common:backend_errors.${normalized}`;
  if (i18n.exists(directKey)) return i18n.t(directKey);
  if (normalized && i18n.exists(normalizedKey)) return i18n.t(normalizedKey);

  const dynamicMappings: Array<{ prefix: string; key: string; preserveSuffix?: boolean }> = [
    {
      prefix: 'TurboFlow api_key is already used by another account',
      key: 'common:backend_errors.TurboFlow api_key is already used by another account',
      preserveSuffix: true,
    },
    {
      prefix: 'Accounts limit reached for exchange=',
      key: 'common:backend_errors.Accounts limit reached for exchange',
      preserveSuffix: true,
    },
    {
      prefix: 'TurboFlow http_status=',
      key: 'common:backend_errors.TurboFlow http_status',
      preserveSuffix: true,
    },
    {
      prefix: 'TurboFlow errno=',
      key: 'common:backend_errors.TurboFlow errno',
      preserveSuffix: true,
    },
    { prefix: 'connect failed:', key: 'common:backend_errors.connect failed', preserveSuffix: true },
    { prefix: 'unsupported exchange:', key: 'common:backend_errors.unsupported exchange', preserveSuffix: true },
    {
      prefix: 'connect only works for week accounts, exchange=',
      key: 'common:backend_errors.connect only works for week accounts',
      preserveSuffix: true,
    },
  ];

  for (const mapping of dynamicMappings) {
    const candidate = normalized || rawMsg;
    if (candidate.startsWith(mapping.prefix) && i18n.exists(mapping.key)) {
      const translated = i18n.t(mapping.key);
      if (mapping.preserveSuffix) {
        const suffix = candidate.slice(mapping.prefix.length).trim();
        return suffix ? `${translated}: ${suffix}` : translated;
      }
      return translated;
    }
  }

  return normalized || rawMsg;
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('panda_quant_user');
    localStorage.removeItem('user_data');

    if (
      window.location.pathname !== '/' &&
      window.location.pathname !== '/login' &&
      window.location.pathname !== '/register'
    ) {
      window.dispatchEvent(new CustomEvent('panda-auth-unauthorized'));
      toast.error(i18n.t('common:session_expired'), { id: 'auth-error' });
    }

    throw createApiError('Unauthorized', { status: 401, raw: null });
  }

  if (!response.ok) {
    try {
      const errBody: unknown = await response.json();
      let errMsg: unknown = response.statusText;
      if (isRecord(errBody)) {
        errMsg = errBody.detail ?? errBody.msg ?? errBody.message ?? response.statusText;
      }

      if (isRecord(errMsg)) {
        const err = createApiError(
          typeof errMsg.message === 'string' ? errMsg.message : JSON.stringify(errMsg),
          { status: response.status, raw: errBody }
        );
        if (typeof errMsg.code === 'string') {
          err.code = errMsg.code;
        }
        err.detail = errMsg as JsonObject;
        throw err;
      }

      if (isString(errMsg)) {
        errMsg = translateBackendErrorMessage(errMsg);
      }

      throw createApiError(String(errMsg), {
        status: response.status,
        detail: isRecord(errBody) ? errBody.detail : undefined,
        raw: errBody,
      });
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        !e.message.includes('Unexpected token') &&
        !e.message.includes('is not valid JSON')
      ) {
        throw e;
      }

      throw createApiError(response.statusText || `Error ${response.status}`, {
        status: response.status,
        raw: null,
      });
    }
  }

  try {
    const result = await response.json();
    return result;
  } catch {
    return {} as T;
  }
}
