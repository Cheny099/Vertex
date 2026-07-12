import i18n from '../../i18n';
import { API_BASE_URL, request } from '../core';
import { isRecord } from '../guards';
import type { Strategy, StrategyCreatePayload, StrategyUpdatePayload, StrategyWebhookSecretResponse } from '../types';
import { clearStoredAuth, getStoredAuthToken } from '../../lib/auth-storage';

export const adminStrategiesApi = {
  create: (data: StrategyCreatePayload) =>
    request<Strategy>('/admin/strategies/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: StrategyUpdatePayload) =>
    request<Strategy>(`/admin/strategies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async () => {
    throw new Error(i18n.t('admin:error_operation_failed', 'Strategy delete is not supported by backend'));
  },
  publish: (id: number) => request<void>(`/admin/strategies/${id}/publish`, { method: 'POST' }),
  unpublish: (id: number) => request<void>(`/admin/strategies/${id}/unpublish`, { method: 'POST' }),
  getWebhookSecret: (id: number) =>
    request<StrategyWebhookSecretResponse>(`/admin/strategies/${id}/webhook-secret`),
  rotateWebhookSecret: (id: number) =>
    request<StrategyWebhookSecretResponse>(`/admin/strategies/${id}/webhook-secret/rotate`, {
      method: 'POST',
    }),
  importStats: async (id: number, file: File) => {
    const token = getStoredAuthToken();
    const formData = new FormData();
    formData.append('file', file, file.name);

    const response = await fetch(`${API_BASE_URL}/admin/strategies/${id}/public-stats/import-tv-csv`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (response.status === 401) {
      if (token === getStoredAuthToken()) {
        clearStoredAuth();
        window.dispatchEvent(new CustomEvent('panda-auth-unauthorized'));
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      let errorDetail = 'CSV upload failed';
      const clone = response.clone();
      try {
        const errBody = await response.json();
        if (Array.isArray(errBody.detail)) {
          errorDetail = errBody.detail
            .map((err: unknown) => {
              if (!isRecord(err)) return '';
              const loc = Array.isArray(err.loc) ? err.loc.join('.') : 'detail';
              const msg = typeof err.msg === 'string' ? err.msg : JSON.stringify(err);
              return `${loc}: ${msg}`;
            })
            .filter(Boolean)
            .join(', ');
        } else {
          errorDetail = errBody.detail || errBody.message || JSON.stringify(errBody);
        }
      } catch {
        const text = await clone.text().catch(() => '');
        if (text) {
          errorDetail = text.length > 300 ? `${text.slice(0, 300)}...` : text;
        }
      }
      throw new Error(errorDetail);
    }
    return response.json();
  },
};
