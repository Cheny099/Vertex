import i18n from '../i18n';
import { adminApi } from './admin';
import { request } from './core';
import { normalizeMetrics, parseStrategyConfig } from './strategy-utils';
import type { JsonObject, JsonValue } from './contracts';
import type {
  CreateStrategyDto,
  PublicStrategyCard,
  Strategy,
  StrategyCreatePayload,
  StrategyUpdateDto,
  StrategyUpdatePayload,
  StrategyWebhookSecretResponse,
} from './types';

// `config` is free-form JSON, so the display fields lifted out of it are narrowed to strings rather
// than asserted - a nested object or array would otherwise reach the UI typed as `string`.
const toDisplayString = (value: JsonValue | undefined): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
};

// Derives the fields the strategy list and cards render out of the parsed config blob.
const withDerivedFields = <T extends { config?: JsonValue; metrics?: unknown; public_stats?: { metrics?: unknown } }>(
  s: T
) => {
  const config = parseStrategyConfig(s.config);
  const metricsRaw = s.metrics ?? s.public_stats?.metrics ?? {};

  return {
    ...s,
    pair: toDisplayString(config.pair ?? config.symbol ?? config.contract),
    type: toDisplayString(config.type ?? config.trend),
    investment: toDisplayString(config.investment ?? config.amount),
    metrics: normalizeMetrics(metricsRaw),
    config,
  };
};

export const strategyApi = {
  getAll: async (): Promise<Strategy[]> => {
    const strategies = await request<Strategy[]>('/strategies/');
    return strategies.map(withDerivedFields);
  },

  get: async (id: number): Promise<Strategy> => {
    const s = await request<Strategy>(`/strategies/${id}`);
    return withDerivedFields(s);
  },

  // CRUD operations use admin endpoints (backend /strategies/ only supports GET)
  create: async (data: CreateStrategyDto) => {
    const payload: StrategyCreatePayload = {
      strategy_key: `sk_${Math.random().toString(36).substring(7)}`,
      name: data.name,
      description: data.description,
      status: 'active',
      config: data as unknown as JsonObject,
    };
    return adminApi.strategies.create(payload);
  },

  update: async (id: number, data: StrategyUpdateDto) => {
    return adminApi.strategies.update(id, data as StrategyUpdatePayload);
  },

  delete: async () => {
    // Backend does not provide DELETE /admin/strategies/{id}
    throw new Error(i18n.t('admin:error_operation_failed', 'Strategy delete is not supported by backend'));
  },

  getWebhookSecret: async (id: number) => {
    return request<StrategyWebhookSecretResponse>(`/admin/strategies/${id}/webhook-secret`);
  },

  rotateWebhookSecret: async (id: number) => {
    return request<StrategyWebhookSecretResponse>(`/admin/strategies/${id}/webhook-secret/rotate`, {
      method: 'POST',
    });
  },
};

export const publicApi = {
  getHotStrategies: async (limit: number = 12, only_active: boolean = true) => {
    const query = new URLSearchParams({
      limit: limit.toString(),
      only_active: only_active.toString(),
    }).toString();
    const list = await request<PublicStrategyCard[]>(`/public/strategies/hot?${query}`);
    return list.map((s) => ({
      ...s,
      metrics: normalizeMetrics(s.metrics),
    }));
  },
  getStrategyDetail: async (id: number) => {
    const s = await request<PublicStrategyCard>(`/public/strategies/${id}`);
    return {
      ...s,
      metrics: normalizeMetrics(s.metrics),
    } as PublicStrategyCard;
  },
};
