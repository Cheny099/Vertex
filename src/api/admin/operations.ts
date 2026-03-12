import { logger } from '@/lib/logger';
import { request } from '../core';
import { toFiniteNumber } from '../guards';
import type {
  AdminAuditLogListResponse,
  AdminOrderEventsResponse,
  AuditItemPageResponse,
  AuditRunDetail,
  AuditRunListResponse,
  AuditRunRequest,
  AuditRunResponse,
  Order,
  OrderListResponse,
  OrderTurnoverStatsRow,
  Subscription,
} from '../types';

export const adminOpsApi = {
  listOrders: (params: Record<string, unknown>) => {
    const limit = toFiniteNumber(params.limit) ?? 50;
    const page = toFiniteNumber(params.page) ?? 1;
    const offset = (page - 1) * limit;
    const cleanParams: Record<string, string> = { limit: String(limit), offset: String(offset) };

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && key !== 'page' && key !== 'limit') {
        cleanParams[key] = String(value);
      }
    });

    return request<OrderListResponse>(`/admin/orders?${new URLSearchParams(cleanParams).toString()}`);
  },
  getOrder: (id: number) => request<Order>(`/admin/orders/${id}`),
  getOrderEvents: (id: number) => request<AdminOrderEventsResponse>(`/admin/orders/${id}/events`),
  cancelOrder: (id: number, reason?: string) =>
    request<{ success: boolean; detail: string }>(
      `/admin/orders/${id}/cancel?reason=${encodeURIComponent(reason || '')}`,
      { method: 'POST' }
    ),
  closePosition: (data: { account_id: number; symbol: string; pos_side: 'long' | 'short'; position_id?: string; qty?: number; reason?: string }) =>
    request<void>('/admin/positions/close', { method: 'POST', body: JSON.stringify(data) }),
  requeueOrder: (id: number, reason?: string) =>
    request<{ success?: boolean; detail?: string }>(
      `/admin/orders/${id}/requeue?reason=${encodeURIComponent(reason || '')}`,
      { method: 'POST' }
    ),
  batchRequeue: (data: { statuses?: string[]; limit?: number; dry_run?: boolean; reason?: string }) =>
    request<{ dry_run: boolean; matched: number; selected_order_ids: number[]; requeued: number }>(
      '/admin/orders/requeue',
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

export const adminAuditApi = {
  list: async (params?: {
    actor?: string;
    action?: string;
    target_type?: string;
    target_id?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) => {
    const cleanParams: Record<string, string> = {
      limit: (params?.limit || 50).toString(),
      offset: (((params?.page || 1) - 1) * (params?.limit || 50)).toString(),
    };
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'page' && key !== 'limit') {
          cleanParams[key] = value.toString();
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return request<AdminAuditLogListResponse>(`/admin/audit-logs?${query}`);
  },
};

export const adminSubscriptionsApi = {
  list: async () => {
    logger.warn('[API] GET /admin/subscriptions not implemented in backend. Feature disabled.');
    return { items: [], total: 0, limit: 50, offset: 0 };
  },
  freeze: async (id: number, frozen: boolean, reason?: string) => {
    return request<Subscription>(`/admin/subscriptions/${id}/freeze`, {
      method: 'POST',
      body: JSON.stringify({ frozen, reason }),
    });
  },
};

export const adminTurboFlowAuditApi = {
  run: async (params?: AuditRunRequest) => {
    return request<AuditRunResponse>('/admin/audit/turboflow/run', {
      method: 'POST',
      body: JSON.stringify({
        lookback_days: params?.lookback_days ?? 7,
        max_pages: params?.max_pages ?? 5,
        page_size: params?.page_size ?? 100,
        dry_run: params?.dry_run ?? false,
        mode: params?.mode ?? 'local_only',
      }),
    });
  },
  listRuns: async (params?: { scope?: string; limit?: number; page?: number }) => {
    const limit = params?.limit ?? 50;
    const page = params?.page ?? 1;
    const query = new URLSearchParams({
      scope: params?.scope ?? 'turboflow',
      limit: limit.toString(),
      page: page.toString(),
    }).toString();
    return request<AuditRunListResponse>(`/admin/audit/runs?${query}`);
  },
  getRun: async (runId: number) => {
    return request<AuditRunDetail>(`/admin/audit/runs/${runId}`);
  },
  getRunItems: async (
    runId: number,
    params?: {
      kind?: string;
      severity?: string;
      account_id?: number;
      order_id?: number;
      page_size?: number;
      limit?: number;
      page?: number;
    }
  ) => {
    const pageSize = params?.page_size ?? params?.limit ?? 50;
    const page = params?.page ?? 1;
    const query = new URLSearchParams();
    if (params?.kind) query.append('kind', params.kind);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.account_id) query.append('account_id', params.account_id.toString());
    if (params?.order_id) query.append('order_id', params.order_id.toString());
    query.append('page_size', pageSize.toString());
    query.append('page', page.toString());
    return request<AuditItemPageResponse>(`/admin/audit/runs/${runId}/items?${query.toString()}`);
  },
};

export const adminStatsApi = {
  getOrderTurnover: async (params?: {
    start?: string;
    end?: string;
    exchange?: string;
    group_by?: 'day' | 'user' | 'account' | 'symbol' | 'strategy' | 'subscription';
  }) => {
    const query = new URLSearchParams();
    if (params?.start) query.append('start', params.start);
    if (params?.end) query.append('end', params.end);
    if (params?.exchange) query.append('exchange', params.exchange);
    query.append('group_by', params?.group_by ?? 'day');
    return request<OrderTurnoverStatsRow[]>(`/admin/stats/orders/turnover?${query.toString()}`);
  },
};
