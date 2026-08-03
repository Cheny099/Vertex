import { logger } from '@/lib/logger';
import type { ApiError } from './contracts';
import { request } from './core';
import type {
  Order,
  OrderCreateRequest,
  OrderDebugInfo,
  OrderListResponse,
  Signal,
  TradeHistoryParams,
  TurboFlowOrderListResponse,
  TurboFlowPositionListResponse,
  WebhookEventRead,
} from './types';

// Filter undefined/null to avoid params like day=undefined
function buildQuery(params?: Record<string, unknown>) {
  if (!params) return '';
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    clean[k] = String(v);
  }
  return new URLSearchParams(clean).toString();
}

// ===============================================
// Orders / Trades API
// ===============================================
export const orderApi = {
  list: async (params?: { page_num?: number; page_size?: number; status?: string; account_id?: number; strategy_id?: number; include_pnl?: boolean }) => {
    const query = buildQuery(params);
    return request<OrderListResponse>(`/orders/?${query}`);
  },

  create: async (data: OrderCreateRequest) => {
    return request<Order>('/orders/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getById: async (id: number, include_pnl?: boolean) => {
    const query = include_pnl ? '?include_pnl=true' : '';
    return request<Order>(`/orders/${id}${query}`);
  },

  cancel: async (id: number) => {
    return request<Order>(`/orders/${id}/cancel`, {
      method: 'POST',
    });
  },

  retry: async (id: number) => {
    return request<Order>(`/orders/${id}/retry`, {
      method: 'POST',
    });
  },

  debug: async (id: number) => {
    return request<OrderDebugInfo>(`/orders/${id}/debug`);
  },

  // Get trade history (use turboflowApi.getOrders for real PnL when needed)
  getHistory: async (params?: TradeHistoryParams & { include_pnl?: boolean }) => {
    const query = buildQuery({
      ...(params ?? {}),
      ...(params?.include_pnl ? { include_pnl: true } : {}),
    });

    const response = await request<OrderListResponse>(`/orders/?${query}`);
    const mappedItems = response.items.map((order) => {
      const executedPrice = order.executed_price ?? order.price;
      const executedQty = order.executed_qty ?? order.quantity;
      return {
        ...order,
        pair: order.symbol,
        type: order.side as 'buy' | 'sell',
        amount: executedQty !== undefined && executedQty !== null ? executedQty.toString() : undefined,
        // `price` deliberately keeps the numeric value from `...order`. It used to be replaced by
        // its own toString(), which made the mapped item stop being an Order and forced a cast at
        // the only call site; nothing formats or does arithmetic on it, so the rendering is
        // unchanged and the type is now honest.
        status: order.status, // Keep uppercase raw status for frontend comparisons
        time: new Date(order.executed_at || order.created_at).toLocaleString(),
        // Use realized_pnl if available (backend sync)
        profit:
          order.realized_pnl !== undefined && order.realized_pnl !== null
            ? order.realized_pnl.toString()
            : order.status === 'COMPLETED'
              ? 'Pending settlement'
              : undefined,
        total: executedQty && executedPrice ? (executedQty * executedPrice).toFixed(2) : undefined,
      };
    });

    return {
      ...response,
      items: mappedItems,
    };
  },
};

export const tradeApi = orderApi; // Alias for backward compatibility

// ===============================================
// TurboFlow API (real order/PnL data)
// ===============================================
export const turboflowApi = {
  getOrders: async (params: { account_id: number; status?: string; page_num?: number; page_size?: number; debug?: boolean }) => {
    const query = buildQuery(params);
    try {
      const resp = await request<TurboFlowOrderListResponse>(`/turboflow/orders?${query}`);
      // Return data object to preserve pagination fields
      return resp.data || { data: [], count: 0, page_count: 0, page_num: 1, page_size: 20 };
    } catch (e: unknown) {
      // Only fallback to empty data when the route itself is unavailable.
      // Business 404s like "Account not found" must be surfaced to UI.
      const err = e as Partial<ApiError>;
      const detail = String(err.detail ?? err.message ?? '').trim().toLowerCase();
      if (err.status === 404 && detail === 'not found') {
        logger.warn('[turboflowApi] /turboflow/orders unavailable, returning empty dataset');
        return { data: [], count: 0, page_count: 0, page_num: 1, page_size: 20 };
      }
      throw e;
    }
  },

  getPositions: async (params: { account_id: number; status?: 'Holding' | 'Closed'; page_num?: number; page_size?: number }) => {
    const { account_id, status = 'Holding', page_num = 1, page_size = 20 } = params;
    const query = new URLSearchParams({
      account_id: account_id.toString(),
      status,
      page_num: page_num.toString(),
      page_size: page_size.toString(),
    }).toString();
    try {
      const resp = await request<TurboFlowPositionListResponse>(`/turboflow/positions?${query}`);
      return resp.data?.data ?? [];
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('404')) {
        logger.warn('[turboflowApi] /turboflow/positions unavailable, returning empty dataset');
        return [];
      }
      throw e;
    }
  },
};

// ===============================================
// Market API
// ===============================================
export const marketApi = {
  // Note: symbol is a path parameter, not a query parameter
  getOhlcv: async (symbol: string, limit: number = 20) => {
    return request<unknown>(`/market/ohlcv/${symbol}?limit=${limit}`);
  },
};

export const signalApi = {
  getByStrategyId: async (strategyId: number) => {
    // 1) Fetch orders related to this strategy
    const response = await orderApi.list({ strategy_id: strategyId, page_size: 100 });
    const orders = response.items;

    // 2) Map Order to frontend Signal shape
    const signals = orders.map((order) => {
      const orderStatus = order.status.toUpperCase();
      let signalStatus: 'active' | 'closed' | 'failed';

      if (orderStatus === 'COMPLETED') {
        signalStatus = 'closed';
      } else if (orderStatus === 'FAILED') {
        signalStatus = 'failed';
      } else if (orderStatus === 'EXPIRED' || orderStatus === 'CANCELLED') {
        signalStatus = 'closed'; // Expired/cancelled orders are treated as closed
      } else {
        // In-progress statuses like PENDING/PROCESSING
        signalStatus = 'active';
      }

      return {
        id: order.id,
        pair: order.symbol || 'N/A',
        direction: order.side === 'buy' ? 'long' : 'short',
        entryPrice: order.executed_price || order.price || '--',
        exitPrice: null, // Close-position details are not shown in this list
        timestamp: new Date(order.signal_received_at || order.created_at).toLocaleString(),
        status: signalStatus,
        timeframe: order.leverage ? `${order.leverage}x` : '--',
        strategy_key: order.symbol,
        duplicate_count: 0,
        // Keep raw status for UI/debug
        raw_status: orderStatus,
      };
    }) as unknown as Signal[];

    // 3) Aggregate stats
    const stats = {
      totalSignals: orders.length,
      activeSignals: orders.filter((o) => o.status === 'PROCESSING' || o.status === 'PENDING').length,
      failedSignals: orders.filter((o) => o.status === 'FAILED').length,
      winRate: 0, // Backend doesn't provide closed-position PnL here
    };

    return { signals, stats };
  },
};

export const webhookEventsApi = {
  list: async (params: { strategy_key: string; limit?: number }) => {
    const query = new URLSearchParams({
      strategy_key: params.strategy_key,
      limit: (params.limit || 50).toString(),
    }).toString();
    return request<WebhookEventRead[]>(`/webhook-events/?${query}`);
  },
};
