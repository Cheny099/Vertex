import { request } from './core';
import { toFiniteNumber } from './guards';
import type { DashboardStats } from './types';

// The dashboard counters arrive inside an untyped bag, so they are narrowed rather than asserted:
// a non-numeric or missing value becomes 0 instead of flowing into the UI as `unknown`.
const toCount = (value: unknown): number => toFiniteNumber(value) ?? 0;

export interface LeaderboardItem {
  user_id: number;
  display_name: string;
  pnl: number;
}

export interface LeaderboardResponse {
  scope: string;
  items: LeaderboardItem[];
}

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
// Dashboard API
// ===============================================
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const raw = await request<{
      today?: Record<string, unknown>;
      strategies?: DashboardStats['strategies'];
      accounts?: DashboardStats['accounts'];
    }>('/dashboard/stats');
    // Backend response: { today: {...}, strategies: [...], accounts: [...] }
    const today = raw?.today || {};
    const strategies = raw?.strategies || [];
    const accounts = raw?.accounts || [];

    const accountsClean = accounts.filter((a) => !a.deleted_at);

    return {
      // Today's order stats
      todayTotal: toCount(today.total),
      todayPending: toCount(today.pending),
      todayProcessing: toCount(today.processing),
      todayCompleted: toCount(today.completed),
      todayFailed: toCount(today.failed),
      todayExpired: toCount(today.expired),
      // Strategy stats
      totalStrategies: strategies.length,
      strategies: strategies,
      // Account stats (deleted accounts filtered)
      totalAccounts: accountsClean.length,
      activeAccounts: accountsClean.filter((a) => a.is_active).length,
      accounts: accountsClean,
    };
  },
};

// ===============================================
// Leaderboard API
// ===============================================
export const leaderboardApi = {
  // Support both scope + range (compat with old backend range param)
  getGlobal: async (params?: {
    scope?: 'daily' | 'total';
    day?: string;
    limit?: number;
    only_close_pos?: boolean;
  }) => {
    const scope = params?.scope;
    const q = buildQuery({
      ...params,
      ...(scope ? { range: scope } : {}), // Compatibility with old parameter
    });
    return request<LeaderboardResponse>(`/leaderboard${q ? `?${q}` : ''}`);
  },

  getByStrategy: async (
    strategyId: number,
    params?: {
      scope?: 'daily' | 'total';
      day?: string;
      limit?: number;
      only_close_pos?: boolean;
    },
  ) => {
    const scope = params?.scope;
    const q = buildQuery({
      ...params,
      ...(scope ? { range: scope } : {}),
    });
    return request<LeaderboardResponse>(`/leaderboard/strategy/${strategyId}${q ? `?${q}` : ''}`);
  },
};
