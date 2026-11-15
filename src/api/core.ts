import i18n from '../i18n';
import { toast } from 'sonner';

import { createApiError } from './contracts';
import { isRecord, isString } from './guards';
import { AUTH_TOKEN_KEY, clearStoredAuth, getStoredAuthToken } from '../lib/auth-storage';

const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api/v1` : '/api/v1';
export const TOKEN_KEY = AUTH_TOKEN_KEY;

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

// Endpoints that establish or recover a session rather than consuming one.
const UNAUTHENTICATED_ENDPOINTS = [
  '/auth/login',
  '/auth/login-with-code',
  '/auth/send-login-code',
  '/auth/register',
  '/auth/send-register-code',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// FastAPI request-validation failures come back as `detail: [{loc, msg, type, input}]`.
// `input` echoes what the user submitted — passwords and API secrets included — so it is
// deliberately never read here; only `loc` and `msg` reach the UI.
function formatValidationErrors(details: unknown[]): string {
  return details
    .map((item) => {
      if (!isRecord(item)) return '';
      const msg = isString(item.msg) ? item.msg : '';
      if (!msg) return '';
      const field = Array.isArray(item.loc)
        ? item.loc.filter((part) => part !== 'body' && part !== 'query' && part !== 'path').join('.')
        : '';
      return field ? `${field}: ${msg}` : msg;
    })
    .filter(Boolean)
    .join('; ');
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getStoredAuthToken();
  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Authorization') && token) headers.set('Authorization', `Bearer ${token}`);
  const requestToken = headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // A 401 from one of these means "these credentials are wrong", not "your session ended".
    // They are unauthenticated endpoints, but request() attaches the stored token anyway, so a
    // signed-in user who revisited /login and mistyped their code used to have their still-valid
    // token wiped - and because /login is excluded from the notify branch below, AuthContext was
    // never told, leaving a session that reported isAuthenticated with empty storage.
    const isCredentialCheck = UNAUTHENTICATED_ENDPOINTS.some((prefix) => endpoint.startsWith(prefix));

    if (!isCredentialCheck && requestToken && requestToken === getStoredAuthToken()) {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent('panda-auth-unauthorized'));

      if (
        window.location.pathname !== '/' &&
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        toast.error(i18n.t('common:session_expired'), { id: 'auth-error' });
      }
    }

    throw createApiError('Unauthorized', { status: 401, raw: null });
  }

  if (!response.ok) {
    let errBody: unknown;
    try {
      errBody = await response.json();
    } catch {
      throw createApiError(response.statusText || `Error ${response.status}`, {
        status: response.status,
        raw: null,
      });
    }
    let detail: unknown = isRecord(errBody) ? errBody.detail ?? errBody.msg ?? errBody.message : undefined;
    // Validation errors may echo credentials in `input`; retain only safe presentation.
    if (Array.isArray(detail)) detail = formatValidationErrors(detail);
    const message = isRecord(detail) ? detail.message : detail;
    throw createApiError(
      isString(message) ? translateBackendErrorMessage(message) : response.statusText || `Error ${response.status}`,
      {
        status: response.status,
        code: isRecord(detail) && isString(detail.code) ? detail.code : undefined,
        detail,
        raw: isRecord(errBody) && Array.isArray(errBody.detail) ? { detail } : errBody,
      }
    );
  }

  // Only protocol-defined bodyless responses are successful without JSON.
  if (response.status === 204 || response.status === 205 || options?.method?.toUpperCase() === 'HEAD') {
    return undefined as T;
  }
  try {
    return await response.json();
  } catch {
    throw createApiError(i18n.t('common:invalid_api_response'), {
      status: response.status,
      code: 'INVALID_API_RESPONSE',
    });
  }
}
