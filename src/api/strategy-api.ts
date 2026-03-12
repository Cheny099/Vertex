import i18n from '../i18n';
import { adminApi } from './admin';
import { request } from './core';
import { normalizeMetrics, parseStrategyConfig } from './strategy-utils';
import type {
  CreateStrategyDto,
  PublicStrategyCard,
  Strategy,
  StrategyCreatePayload,
  StrategyUpdateDto,
  StrategyUpdatePayload,
  StrategyWebhookSecretResponse,
} from './types';

export const strategyApi = {
  getAll: async (): Promise<Strategy[]> => {
    const strategies = await request<Strategy[]>('/strategies/');
    return strategies.map((s) => {
      const config = parseStrategyConfig(s.config);
      const metricsRaw = s.metrics ?? s.public_stats?.metrics ?? {};
      const metrics = normalizeMetrics(metricsRaw);

      return {
        ...s,
        pair: config.pair ?? config.symbol ?? config.contract,
        type: config.type ?? config.trend,
        investment: config.investment ?? config.amount,
        metrics,
        config,
      };
    });
  },

  get: async (id: number): Promise<Strategy> => {
    const s = await request<Strategy>(`/strategies/${id}`);
    const config = parseStrategyConfig(s.config);
    const metricsRaw = s.metrics ?? s.public_stats?.metrics ?? {};
    const metrics = normalizeMetrics(metricsRaw);

    return {
      ...s,
      pair: config.pair ?? config.symbol ?? config.contract,
      type: config.type ?? config.trend,
      investment: config.investment ?? config.amount,
      metrics,
      config,
    };
  },

  // CRUD operations use admin endpoints (backend /strategies/ only supports GET)
  create: async (data: CreateStrategyDto) => {
    const payload: StrategyCreatePayload = {
      strategy_key: `sk_${Math.random().toString(36).substring(7)}`,
      name: data.name,
      description: data.description,
      status: 'active',
      config: data,
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
