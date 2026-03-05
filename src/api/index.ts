/**
 * @anchor-id API_CLIENT
 * @module-type api
 * @disposable false
 * @description API client - fully connected to backend (/api/v1)
 */

import { z } from 'zod';
import { toast } from 'sonner';
import i18n from '../i18n'; // Import i18n instance
export * from './types';
import {
    Strategy,
    Position,
    DashboardStats,
    UserProfile,
    TradeHistoryParams,
    CreateStrategyDto,
    TickerData,
    Account,
    AccountCreateDto,
    Subscription,
    SubscriptionCreateDto,
    OrderListResponse,
    Signal,
    // Auth types
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SendRegisterCodeRequest,
    SendLoginCodeRequest,
    LoginWithCodeRequest,
    UserRegisterRequest,
    StrategyUpdateDto,
    OrderCreateRequest,
    Order,
    TurboFlowPositionItem,
    TurboFlowPositionListResponse,
    TurboFlowOrderItem,
    TurboFlowOrderListResponse,
    AccountBalance, // Available margin type
    StrategyWebhookSecretResponse,
    WebhookEventRead,
    PublicStrategyCard,
    AccountStatusResponse, // Imported
    ExchangeMetaResponse, // Imported
    // Phase 6 types
    Announcement,
    AnnouncementDetail,
    PopupAnnouncement,
    LegalDocKey,
    PublicLegalDoc,
    LegalStatusResponse,
    PeriodKey,
    StrategyMetricsItem,
    AdminAuditLogListResponse,
    AdminOrderEventsResponse,
    AdminLegalDocListResponse,
    AdminLegalDocResponse,
    AdminSubscriptionListResponse,
    AnnouncementAdminListResponse,
    AnnouncementAdminResponse,
    StrategyCreatePayload, // Imported
    StrategyUpdatePayload,  // Imported
    // Phase 12: Audit & Stats
    AuditRunRequest,
    AuditRunResponse,
    AuditRunListResponse,
    AuditRunDetail,
    AuditItem,
    AuditItemPageResponse,
    OrderTurnoverStatsRow,
    // Phase 132: Strategy Switch
    StrategySwitchRequest,
    StrategySwitchResponse,
    StrategySwitchPreviewRequest,
    StrategySwitchPreviewResponse,
    StrategySwitchRun,
    StrategySwitchBulkPreviewRequest,
    StrategySwitchBulkExecuteRequest,
    StrategySwitchBulkExecuteResponse,
    StrategySwitchBulkPreviewResponse,
    StrategySwitchCampaign, // Phase 132
    // Phase 16: Invite Codes
    InviteRedeemRequest,
    InviteRedeemResponse,
    AdminInviteCreateRequest,
    AdminInviteCreateResponse,
    AdminInviteListItem,
    AdminInviteListResponse,
} from './types';

// API config
// Recommended: VITE_API_URL should be origin only, e.g. https://api.vertexquant.com
// If omitted, frontend uses same-origin /api/v1 (reverse proxy can avoid CORS)
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api/v1` : '/api/v1';
const TOKEN_KEY = 'auth_token';

// API Client - Fully connected to production backend

// Generic request helper
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

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Always read the latest token before each request
    const token =
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY);


    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options?.headers,
        },
    });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        // Cleanup legacy key names (optional)
        localStorage.removeItem('panda_quant_user');
        localStorage.removeItem('user_data');

        // Show notification only outside auth pages
        if (
            window.location.pathname !== '/' &&
            window.location.pathname !== '/login' &&
            window.location.pathname !== '/register'
        ) {

            // Notify AuthContext via event instead of hard redirect
            // This avoids React Router redirect conflicts
            window.dispatchEvent(new CustomEvent('panda-auth-unauthorized'));

            // Keep singleton toast message
            toast.error(i18n.t('common:session_expired'), {
                id: 'auth-error',
            });
        }
        const err: any = new Error('Unauthorized');
        err.status = 401;
        err.raw = null;
        throw err;
    }

    if (!response.ok) {
        try {
            const errBody = await response.json();
            // Smart translate: try mapped backend error first
            let errMsg = errBody.detail || errBody.msg || errBody.message || response.statusText;

            // Critical: support object-shaped error details
            // Backend may return { code: "LEGAL_ACCEPTANCE_REQUIRED", message: "...", ... }
            if (typeof errMsg === 'object' && errMsg !== null) {
                const err: any = new Error(errMsg.message || JSON.stringify(errMsg));
                // Attach structured data for interceptors (e.g. RiskDisclosureDialog)
                err.code = errMsg.code;
                err.detail = errMsg;
                err.status = response.status;
                err.raw = errBody;
                throw err;
            }

            // Translate known backend errors (exact + dynamic prefix mappings)
            if (typeof errMsg === 'string') {
                errMsg = translateBackendErrorMessage(errMsg);
            }

            const err: any = new Error(errMsg as string);
            err.status = response.status;
            err.detail = errBody?.detail;
            err.raw = errBody;
            throw err;
        } catch (e: any) {
            // Check if it's already an Error object we just threw (with detail, etc.)
            if (e.message && !e.message.includes('Unexpected token') && !e.message.includes('is not valid JSON')) {
                throw e;
            }
            // Fallback to HTTP status text (e.g. "Internal Server Error")
            const err: any = new Error(response.statusText || `Error ${response.status}`);
            err.status = response.status;
            err.raw = null;
            throw err;
        }
    }

    try {
        const result = await response.json();
        return result;
    } catch (e) {
        // 204 No Content
        return {} as T;
    }
}

// ===============================================
// Auth API
// ===============================================
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
            } catch (e) { /* ignore */ }
            throw new Error(errorMsg);
        }
        return response.json();
    },

    sendRegisterCode: async (data: SendRegisterCodeRequest) => {
        return request<{ message: string }>('/auth/send-register-code', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    register: async (data: UserRegisterRequest) => {
        return request<UserProfile>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getProfile: async () => {
        return request<UserProfile>('/auth/me');
    },

    forgotPassword: async (data: ForgotPasswordRequest) => {
        return request<{ message: string }>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    resetPassword: async (data: ResetPasswordRequest) => {
        return request<{ message: string }>('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    sendLoginCode: async (data: SendLoginCodeRequest) => {
        return request<{ message: string }>('/auth/send-login-code', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    loginWithCode: async (data: LoginWithCodeRequest) => {
        return request<AuthResponse>('/auth/login-with-code', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    redeemInvite: async (data: InviteRedeemRequest) => {
        return request<InviteRedeemResponse>('/auth/redeem-invite', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

// ===============================================
// Accounts API
// ===============================================
export const accountApi = {
    list: async () => {
        const accounts = await request<Account[]>('/accounts/');
        // Backend uses soft delete; filter records with deleted_at
        return accounts.filter(acc => !acc.deleted_at);
    },

    create: async (data: AccountCreateDto) => {
        return request<Account>('/accounts/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    get: async (id: number) => {
        return request<Account>(`/accounts/${id}`);
    },

    update: async (id: number, data: Partial<Account>) => {
        return request<Account>(`/accounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Checklist 2.5: safe update (simulate PATCH /profile)
    // Only allows changing name, api_key, api_secret.
    // Strictly filters out exchange/base_url to prevent config corruption.
    updateProfile: async (id: number, data: { name?: string; api_key?: string; api_secret?: string }) => {
        // Construct a safe payload
        const safePayload: any = {};
        if (data.name !== undefined) safePayload.name = data.name;
        if (data.api_key !== undefined) safePayload.api_key = data.api_key;
        if (data.api_secret !== undefined) safePayload.api_secret = data.api_secret;

        // Use PUT but with limited fields. 
        // Backend Pydantic `AccountUpdate` fields are Optional, so this works perfectly.
        return request<Account>(`/accounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(safePayload)
        });
    },

    toggleActive: async (id: number, is_active: boolean) => {
        return request<Account>(`/accounts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ is_active })
        });
    },

    delete: async (id: number) => {
        return request<void>(`/accounts/${id}`, {
            method: 'DELETE'
        });
    },

    getStatus: async (id: number) => {
        return request<AccountStatusResponse>(`/accounts/${id}/status`);
    },

    connect: async (id: number) => {
        return request<any>(`/accounts/${id}/connect`, {
            method: 'POST'
        });
    },

    verify: async (id: number) => {
        const res = await request<AccountStatusResponse>(`/accounts/${id}/verify`, {
            method: 'POST'
        });
        // Backend may return 200 for verify failures; throw to trigger error handling
        // We must throw here so toast.promise catches it as an error.
        if (res.status !== 'ok') {
            const err: any = new Error(res.last_error || (res.detail as any)?.message || 'Verification failed');
            err.status = res.status;
            err.detail = res.detail;
            err.last_error = res.last_error;
            err.raw = res;
            throw err;
        }
        return res;
    },

    resetSession: async (id: number, mode: 'soft' | 'hard' = 'soft') => {
        return request<any>(`/accounts/${id}/reset-session`, {
            method: 'POST',
            body: JSON.stringify({ mode })
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
        } catch (e: any) {
            if (e?.message?.includes('404')) return null;
            return null;
        }
    },
};

export const userApi = {
    getProfile: authApi.getProfile,

    // Safe profile update (simulated PATCH with restricted PUT)
    // Checklist 2.5: Only allow name/api_key/api_secret
    updateProfile: async (data: Partial<UserProfile> & { api_key?: string; api_secret?: string; name?: string }) => {
        // 1. Get current account ID (Using user ID as account ID? No, this is User Profile, not Account Profile)
        // Wait, Checklist says PATCH /accounts/{id}/profile, this is `userApi`.
        // The userApi.updateProfile was for User entity (email, etc).
        // Checklist item 2.5 is for TRADING ACCOUNT profile (name, keys).

        // Let's clarify:
        // `userApi` corresponds to `/auth/me` (User).
        // `accountApi` corresponds to `/accounts/{id}` (Trading Account).

        // The checklists refers to TRADING ACCOUNT.
        // So I should implement this in `accountApi.updateProfile`, NOT `userApi`.
        // `userApi` stays as "Not Implemented" because backend has no PATCH /auth/me.

        throw new Error(i18n.t('common.feature_coming_soon'));
    }
};

// ===============================================
// Strategies API
// ===============================================
// ===== Strategy helpers: config + metrics normalization =====
function toNumber(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
}

function normalizeMetricItem(raw: any): StrategyMetricsItem {
    const obj = raw && typeof raw === 'object' ? raw : {};
    const return_pct = toNumber((obj as any).return_pct) ?? 0;
    const win_rate = toNumber((obj as any).win_rate) ?? 0;
    const max_drawdown_pct = toNumber((obj as any).max_drawdown_pct) ?? 0;
    const profit_factor = toNumber((obj as any).profit_factor);
    // Keep backend ratio as-is. Do not auto-convert 0~1 to 0~100 in frontend.
    return {
        return_pct,
        win_rate,
        max_drawdown_pct,
        profit_factor: profit_factor === null ? null : profit_factor,
    };
}

function normalizeMetrics(raw: any): Record<string, StrategyMetricsItem> {
    if (!raw || typeof raw !== 'object') {
        return {};
    }

    const out: Record<string, StrategyMetricsItem> = {};
    for (const [k, v] of Object.entries(raw)) {
        const key = String(k).toLowerCase();
        const normKey =
            key === 'all' ? 'all' :
                key === '1m' || key === '3m' || key === '6m' || key === '1y' ? key :
                    key;

        out[normKey] = normalizeMetricItem(v);
    }

    // Ensure all metric exists for default card/detail rendering
    return out;
}

function parseStrategyConfig(raw: any): any {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    if (typeof raw !== 'string') return {};
    if (raw === 'string') return {}; // Compatible with swagger mock / dirty data
    try {
        const obj = JSON.parse(raw);
        return obj && typeof obj === 'object' ? obj : {};
    } catch {
        return {};
    }
}

export const strategyApi = {
    getAll: async (): Promise<Strategy[]> => {
        const strategies = await request<any[]>('/strategies/');
        return strategies.map((s) => {
            const config = parseStrategyConfig(s.config);
            const metricsRaw = (s as any).metrics ?? (s as any).public_stats?.metrics ?? {};
            const metrics = normalizeMetrics(metricsRaw);

            return {
                ...s,
                pair: config.pair ?? config.symbol ?? config.contract,
                type: config.type ?? config.trend,
                investment: config.investment ?? config.amount,
                metrics,
                config
            };
        });
    },

    get: async (id: number): Promise<Strategy> => {
        const s = await request<any>(`/strategies/${id}`);
        const config = parseStrategyConfig(s.config);
        const metricsRaw = (s as any).metrics ?? (s as any).public_stats?.metrics ?? {};
        const metrics = normalizeMetrics(metricsRaw);

        return {
            ...s,
            pair: config.pair ?? config.symbol ?? config.contract,
            type: config.type ?? config.trend,
            investment: config.investment ?? config.amount,
            metrics,
            config
        };
    },

    // CRUD operations use admin endpoints (backend /strategies/ only supports GET)
    create: async (data: CreateStrategyDto) => {
        // Delegate to admin API
        const payload: StrategyCreatePayload = {
            strategy_key: `sk_${Math.random().toString(36).substring(7)}`,
            name: data.name,
            description: data.description,
            status: 'active',
            config: data
        };
        return adminApi.strategies.create(payload);
    },

    update: async (id: number, data: StrategyUpdateDto) => {
        // Delegate to admin API
        return adminApi.strategies.update(id, data as StrategyUpdatePayload);
    },

    delete: async () => {
        // Backend does not provide DELETE /admin/strategies/{id}
        // Keep method for compatibility but prevent sending a non-existent request.
        throw new Error(i18n.t('admin:error_operation_failed', 'Strategy delete is not supported by backend'));
    },

    // ... Webhook Secret methods
    getWebhookSecret: async (id: number) => {
        // Admin-only endpoint on backend
        return request<StrategyWebhookSecretResponse>(`/admin/strategies/${id}/webhook-secret`);
    },

    rotateWebhookSecret: async (id: number) => {
        // Admin-only endpoint on backend
        return request<StrategyWebhookSecretResponse>(`/admin/strategies/${id}/webhook-secret/rotate`, {
            method: 'POST'
        });
    }
};


// ===============================================
// Exchange Meta API
// ===============================================
export const exchangeApi = {
    /**
     * Get exchange symbol metadata (min_notional, step_size, etc.)
     * @param exchange exchange type: 'binance_futures' | 'gate_futures'
     * @param symbols optional symbol list
     */
    getSymbolsMeta: async (exchange: string, symbols?: string[]): Promise<ExchangeMetaResponse> => {
        const params = new URLSearchParams();
        if (symbols && symbols.length > 0) {
            params.append('symbols', symbols.join(','));
        }

        return request<ExchangeMetaResponse>(`/exchanges/${exchange}/symbols/meta?${params.toString()}`);
    }
};


// ===============================================
// Subscriptions API
// ===============================================
export const subscriptionApi = {
    list: async () => {
        return request<Subscription[]>('/subscriptions/');
    },

    create: async (data: SubscriptionCreateDto) => {
        // Strict payload construction based on mode
        const payload: any = {
            strategy_id: data.strategy_id,
            strategy_key: data.strategy_key,
            account_id: data.account_id,
            position_mode: data.position_mode,
            leverage: data.leverage
        };

        if (data.position_mode === 'fixed') {
            payload.position_pct = data.position_pct;
            // Ensure position_value is NOT sent
        } else if (data.position_mode === 'fixed_amount') {
            payload.position_value = data.position_value;
            // Ensure position_pct is NOT sent
        }

        return request<Subscription>('/subscriptions/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    update: async (id: number, data: Partial<SubscriptionCreateDto>) => {
        // Similar strict filtering for update if needed, but Partial makes it flexible.
        // For safety, we can apply similar logic if data.position_mode is present.
        return request<Subscription>(`/subscriptions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    delete: async (id: number) => {
        return request<void>(`/subscriptions/${id}`, {
            method: 'DELETE'
        });
    }
};

// ===============================================
// Orders / Trades API
// ===============================================
export const orderApi = {
    list: async (params?: { page_num?: number, page_size?: number, status?: string, account_id?: number, strategy_id?: number, include_pnl?: boolean }) => {
        const query = buildQuery(params as any);
        return request<OrderListResponse>(`/orders/?${query}`);
    },

    create: async (data: OrderCreateRequest) => {
        return request<Order>('/orders/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getById: async (id: number, include_pnl?: boolean) => {
        const query = include_pnl ? `?include_pnl=true` : '';
        return request<Order>(`/orders/${id}${query}`);
    },

    cancel: async (id: number) => {
        return request<Order>(`/orders/${id}/cancel`, {
            method: 'POST'
        });
    },

    retry: async (id: number) => {
        return request<Order>(`/orders/${id}/retry`, {
            method: 'POST'
        });
    },

    debug: async (id: number) => {
        return request<any>(`/orders/${id}/debug`);
    },

    // Get trade history (use turboflowApi.getOrders for real PnL when needed)
    getHistory: async (params?: TradeHistoryParams & { include_pnl?: boolean }) => {
        const query = buildQuery({
            ...(params as any),
            ...(params?.include_pnl ? { include_pnl: true } : {})
        });

        const response = await request<OrderListResponse>(`/orders/?${query}`);
        const mappedItems = response.items.map(order => {
            const executedPrice = order.executed_price ?? order.price;
            const executedQty = order.executed_qty ?? order.quantity;
            return {
                ...order,
                pair: order.symbol,
                type: order.side as 'buy' | 'sell',
                amount: executedQty !== undefined && executedQty !== null ? executedQty.toString() : undefined,
                price: executedPrice !== undefined && executedPrice !== null ? executedPrice.toString() : undefined,
                status: order.status, // Keep uppercase raw status for frontend comparisons
                time: new Date(order.executed_at || order.created_at).toLocaleString(),
                // Use realized_pnl if available (backend sync)
                profit: order.realized_pnl !== undefined && order.realized_pnl !== null
                    ? order.realized_pnl.toString()
                    : (order.status === 'COMPLETED' ? "Pending settlement" : undefined),
                total: (executedQty && executedPrice) ? (executedQty * executedPrice).toFixed(2) : undefined
            }
        });

        return {
            ...response,
            items: mappedItems as any[]
        };
    },
};

export const tradeApi = orderApi; // Alias for backward compatibility

// ===============================================
// Dashboard API
// ===============================================
export const dashboardApi = {
    getStats: async (): Promise<DashboardStats> => {
        const raw = await request<any>('/dashboard/stats');
        // Backend response: { today: {...}, strategies: [...], accounts: [...] }
        const today = raw?.today || {};
        const strategies = raw?.strategies || [];
        const accounts = raw?.accounts || [];

        const accountsClean = accounts.filter((a: any) => !a.deleted_at);

        return {
            // Today's order stats
            todayTotal: today.total || 0,
            todayPending: today.pending || 0,
            todayProcessing: today.processing || 0,
            todayCompleted: today.completed || 0,
            todayFailed: today.failed || 0,
            todayExpired: today.expired || 0,
            // Strategy stats
            totalStrategies: strategies.length,
            strategies: strategies,
            // Account stats (deleted accounts filtered)
            totalAccounts: accountsClean.length,
            activeAccounts: accountsClean.filter((a: any) => a.is_active).length,
            accounts: accountsClean,
        };
    }
};

// ===============================================
// Leaderboard API
// ===============================================
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
function buildQuery(params?: Record<string, any>) {
    if (!params) return '';
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        clean[k] = String(v);
    }
    return new URLSearchParams(clean).toString();
}

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
        }
    ) => {
        const scope = params?.scope;
        const q = buildQuery({
            ...params,
            ...(scope ? { range: scope } : {}),
        });
        return request<LeaderboardResponse>(`/leaderboard/strategy/${strategyId}${q ? `?${q}` : ''}`);
    }
};

// ===============================================
// TurboFlow API (real order/PnL data)
// ===============================================
export const turboflowApi = {
    getOrders: async (params: { account_id: number; status?: string; page_num?: number; page_size?: number; debug?: boolean }) => {
        const query = buildQuery(params as any);
        try {
            const resp = await request<TurboFlowOrderListResponse>(`/turboflow/orders?${query}`);
            // Return data object to preserve pagination fields
            return resp.data || { data: [], count: 0, page_count: 0, page_num: 1, page_size: 20 };
        } catch (e: any) {
            // Only fallback to empty data when the route itself is unavailable.
            // Business 404s like "Account not found" must be surfaced to UI.
            const detail = String(e?.detail ?? e?.message ?? '').trim().toLowerCase();
            if (e?.status === 404 && detail === 'not found') {
                console.warn('[turboflowApi] /turboflow/orders unavailable, returning empty dataset');
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
            page_size: page_size.toString()
        }).toString();
        try {
            const resp = await request<TurboFlowPositionListResponse>(`/turboflow/positions?${query}`);
            return resp.data?.data ?? [];
        } catch (e: any) {
            if (e.message?.includes('404')) {
                console.warn('[turboflowApi] /turboflow/positions unavailable, returning empty dataset');
                return [];
            }
            throw e;
        }
    }
};

// ===============================================
// Market API
// ===============================================
export const marketApi = {
    // Note: symbol is a path parameter, not a query parameter
    getOhlcv: async (symbol: string, limit: number = 20) => {
        return request<any>(`/market/ohlcv/${symbol}?limit=${limit}`);
    }
};

export const signalApi = {
    getByStrategyId: async (strategyId: number) => {
        // 1) Fetch orders related to this strategy
        const response = await orderApi.list({ strategy_id: strategyId, page_size: 100 });
        const orders = response.items;

        // 2) Map Order to frontend Signal shape
        const signals = orders.map(order => {
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
            activeSignals: orders.filter(o => o.status === 'PROCESSING' || o.status === 'PENDING').length,
            failedSignals: orders.filter(o => o.status === 'FAILED').length,
            winRate: 0 // Backend doesn't provide closed-position PnL here
        };

        return { signals, stats };
    }
};

export const webhookEventsApi = {
    list: async (params: { strategy_key: string; limit?: number }) => {
        const query = new URLSearchParams({
            strategy_key: params.strategy_key,
            limit: (params.limit || 50).toString()
        }).toString();
        return request<WebhookEventRead[]>(`/webhook-events/?${query}`);
    }
};

// ===============================================
// Announcements API (Phase 6.1)
// ===============================================
export const announcementApi = {
    // List (default limit 10) - public read
    list: (lang: string, limit: number = 10) => request<Announcement[]>(`/public/announcements?lang=${lang}&limit=${limit}`),

    // Detail - public read
    get: (id: number, lang: string) => request<AnnouncementDetail>(`/public/announcements/${id}?lang=${lang}`),

    // Homepage popup - public read
    getPopup: (lang: string) => request<PopupAnnouncement | null>(`/public/announcements/popup?lang=${lang}`)
};

// ===============================================
// Legal API (Phase 6.2)
// ===============================================
export const legalApi = {
    getPublicDoc: (key: LegalDocKey, lang: string = 'zh') => request<PublicLegalDoc>(`/public/legal/${key}?lang=${lang}`),
    getStatus: (lang: string = 'zh') => request<LegalStatusResponse>(`/legal/status?lang=${lang}`),
    accept: (key: LegalDocKey, version: string) => request<void>(`/legal/accept`, {
        method: 'POST',
        body: JSON.stringify({ key, version })
    })
};

// ===============================================
// Admin API - Segregated
// ===============================================
export const adminApi = {
    strategies: {
        create: (data: StrategyCreatePayload) => request<Strategy>('/admin/strategies/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: StrategyUpdatePayload) => request<Strategy>(`/admin/strategies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: async () => {
            // Backend does not provide DELETE /admin/strategies/{id}
            throw new Error(i18n.t('admin:error_operation_failed', 'Strategy delete is not supported by backend'));
        },
        publish: (id: number) => request<void>(`/admin/strategies/${id}/publish`, { method: 'POST' }),
        unpublish: (id: number) => request<void>(`/admin/strategies/${id}/unpublish`, { method: 'POST' }),
        getWebhookSecret: (id: number) => request<StrategyWebhookSecretResponse>(`/admin/strategies/${id}/webhook-secret`),
        rotateWebhookSecret: (id: number) => request<StrategyWebhookSecretResponse>(`/admin/strategies/${id}/webhook-secret/rotate`, { method: 'POST' }),
        // Fixed: use FormData for upload and align auth logic with request()
        importStats: async (id: number, file: File) => {
            const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
            const formData = new FormData();
            // Backend requires field name: 'file'
            formData.append('file', file, file.name);

            const response = await fetch(`${API_BASE_URL}/admin/strategies/${id}/public-stats/import-tv-csv`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                sessionStorage.removeItem(TOKEN_KEY);
                window.dispatchEvent(new CustomEvent('panda-auth-unauthorized'));
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                let errorDetail = 'CSV upload failed';
                // Clone the response to allow multiple reads (JSON vs Text)
                const clone = response.clone();
                try {
                    const errBody = await response.json();
                    if (Array.isArray(errBody.detail)) {
                        // FastAPI standard validation error: [{loc: [...], msg: "...", type: "..."}]
                        errorDetail = errBody.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
                    } else {
                        errorDetail = errBody.detail || errBody.message || JSON.stringify(errBody);
                    }
                } catch (e) {
                    const text = await clone.text().catch(() => '');
                    // Extract common backend error patterns (e.g. 500 HTML or stack traces)
                    if (text) {
                        errorDetail = text.length > 300 ? text.slice(0, 300) + '...' : text;
                    }
                }
                throw new Error(errorDetail);
            }
            return response.json();
        },
    },
    announcements: {
        list: (params?: {
            lang?: 'zh' | 'en' | 'all';
            include_deleted?: boolean;
            include_unpublished?: boolean;
            limit?: number;
            offset?: number;
        }) => {
            const query = new URLSearchParams();
            // Backend treats lang as exact value (zh/en/all). For UI "all languages",
            // we should omit the lang filter so backend returns every language.
            if (params?.lang && params.lang !== 'all') query.append('lang', params.lang);
            if (params?.include_deleted !== undefined) query.append('include_deleted', String(params.include_deleted));
            if (params?.include_unpublished !== undefined) query.append('include_unpublished', String(params.include_unpublished));
            if (params?.limit !== undefined) query.append('limit', String(params.limit));
            if (params?.offset !== undefined) query.append('offset', String(params.offset));
            const qs = query.toString();
            return request<AnnouncementAdminListResponse>(`/admin/announcements/${qs ? `?${qs}` : ''}`);
        },
        get: (id: number, params?: { include_deleted?: boolean }) => {
            const query = new URLSearchParams();
            if (params?.include_deleted !== undefined) query.append('include_deleted', String(params.include_deleted));
            const qs = query.toString();
            return request<AnnouncementAdminResponse>(`/admin/announcements/${id}${qs ? `?${qs}` : ''}`);
        },
        create: (data: any) => request<AnnouncementAdminResponse>('/admin/announcements/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: any) => request<AnnouncementAdminResponse>(`/admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: number) => request<void>(`/admin/announcements/${id}`, { method: 'DELETE' }),
        publish: (id: number) => request<AnnouncementAdminResponse>(`/admin/announcements/${id}/publish`, { method: 'POST' }),
        unpublish: (id: number) => request<AnnouncementAdminResponse>(`/admin/announcements/${id}/unpublish`, { method: 'POST' }),
    },
    legal: {
        list: (params?: { key?: string; lang?: string; is_active?: boolean; limit?: number; offset?: number }) => {
            const query = new URLSearchParams();
            if (params?.key) query.append('key', params.key);
            if (params?.lang) query.append('lang', params.lang);
            if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));
            if (params?.limit !== undefined) query.append('limit', String(params.limit));
            if (params?.offset !== undefined) query.append('offset', String(params.offset));
            const qs = query.toString();
            return request<AdminLegalDocListResponse>(`/admin/legal/${qs ? `?${qs}` : ''}`);
        },
        get: (id: number) => request<AdminLegalDocResponse>(`/admin/legal/${id}`),
        create: (data: any) => request<AdminLegalDocResponse>('/admin/legal/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: any) => request<AdminLegalDocResponse>(`/admin/legal/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        activate: (id: number) => request<AdminLegalDocResponse>(`/admin/legal/${id}/activate`, { method: 'POST' }),
    },
    // Phase 7.4: Ops Console
    ops: {
        listOrders: (params: any) => {
            const limit = params.limit || 50;
            const offset = (params.page ? (params.page - 1) * limit : 0);
            const cleanParams: any = { limit, offset };

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '' && key !== 'page' && key !== 'limit') {
                    cleanParams[key] = value.toString();
                }
            });

            return request<OrderListResponse>(`/admin/orders?${new URLSearchParams(cleanParams).toString()}`);
        },
        getOrder: (id: number) => request<Order>(`/admin/orders/${id}`), // Detail view
        getOrderEvents: (id: number) => request<AdminOrderEventsResponse>(`/admin/orders/${id}/events`), // Timeline
        cancelOrder: (id: number, reason?: string) => request<{ success: boolean; detail: string }>(`/admin/orders/${id}/cancel?reason=${encodeURIComponent(reason || '')}`, { method: 'POST' }),
        closePosition: (data: { account_id: number; symbol: string; pos_side: 'long' | 'short'; position_id?: string; qty?: number; reason?: string }) => request<void>('/admin/positions/close', { method: 'POST', body: JSON.stringify(data) }),
        requeueOrder: (id: number, reason?: string) => request<any>(`/admin/orders/${id}/requeue?reason=${encodeURIComponent(reason || '')}`, { method: 'POST' }), // Requeue
        batchRequeue: (data: { statuses?: string[]; limit?: number; dry_run?: boolean; reason?: string }) => request<{ dry_run: boolean; matched: number; selected_order_ids: number[]; requeued: number }>('/admin/orders/requeue', { method: 'POST', body: JSON.stringify(data) }), // Batch requeue
    },

    // Phase 7.5: Audit Logs
    audit: {
        list: async (params?: { actor?: string; action?: string; target_type?: string; target_id?: string; date_from?: string; date_to?: string; page?: number; limit?: number }) => {
            const cleanParams: any = {
                limit: (params?.limit || 50).toString(),
                offset: (((params?.page || 1) - 1) * (params?.limit || 50)).toString()
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
        }
    },

    // Phase 7.7: Subscription Management
    // NOTE: Backend does NOT have GET /admin/subscriptions list endpoint
    // Only freeze endpoint exists: POST /admin/subscriptions/{id}/freeze
    subscriptions: {
        // REMOVED: list endpoint does not exist in backend
        // Use subscriptionApi.list() for user's own subscriptions instead
        list: async () => {
            console.warn('[API] GET /admin/subscriptions not implemented in backend. Feature disabled.');
            return { items: [], total: 0, limit: 50, offset: 0 };
        },
        freeze: async (id: number, frozen: boolean, reason?: string) => {
            return request<Subscription>(`/admin/subscriptions/${id}/freeze`, {
                method: 'POST',
                body: JSON.stringify({ frozen, reason })
            });
        },
        // Also add it to adminApi.ops for convenience if needed, 
        // but it's already in adminApi.subscriptions. Let's keep it consistent.
    },

    // Phase 12: TurboFlow Audit
    auditTurboflow: {
        run: async (params?: AuditRunRequest) => {
            return request<AuditRunResponse>('/admin/audit/turboflow/run', {
                method: 'POST',
                body: JSON.stringify({
                    lookback_days: params?.lookback_days ?? 7,
                    max_pages: params?.max_pages ?? 5,
                    page_size: params?.page_size ?? 100,
                    dry_run: params?.dry_run ?? false,
                    mode: params?.mode ?? 'local_only'
                })
            });
        },

        listRuns: async (params?: { scope?: string; limit?: number; page?: number }) => {
            const limit = params?.limit ?? 50;
            const page = params?.page ?? 1;
            const query = new URLSearchParams({
                scope: params?.scope ?? 'turboflow',
                limit: limit.toString(),
                page: page.toString()
            }).toString();
            return request<AuditRunListResponse>(`/admin/audit/runs?${query}`);
        },

        getRun: async (runId: number) => {
            return request<AuditRunDetail>(`/admin/audit/runs/${runId}`);
        },

        getRunItems: async (runId: number, params?: {
            kind?: string;
            severity?: string;
            account_id?: number;
            order_id?: number;
            page_size?: number;
            limit?: number;
            page?: number;
        }) => {
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
        }
    },

    // Phase 12: Order Statistics
    stats: {
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
        }
    },

    // Phase 132: Strategy Switch
    strategySwitch: {
        // Single Run
        preview: (data: StrategySwitchPreviewRequest) => request<StrategySwitchPreviewResponse>('/admin/strategy-switch/preview', { method: 'POST', body: JSON.stringify(data) }),
        execute: (data: StrategySwitchRequest) => request<StrategySwitchResponse>('/admin/strategy-switch/execute', { method: 'POST', body: JSON.stringify(data) }),
        getRun: (id: number) => request<StrategySwitchRun>(`/admin/strategy-switch/runs/${id}`),
        cancelRun: (id: number) => request<void>(`/admin/strategy-switch/runs/${id}/cancel`, { method: 'POST' }),

        // Bulk Campaign
        bulkPreview: (data: StrategySwitchBulkPreviewRequest) => request<StrategySwitchBulkPreviewResponse>('/admin/strategy-switch/bulk/preview', { method: 'POST', body: JSON.stringify(data) }),
        bulkExecute: (data: StrategySwitchBulkExecuteRequest) => request<StrategySwitchBulkExecuteResponse>('/admin/strategy-switch/bulk/execute', { method: 'POST', body: JSON.stringify(data) }),
        getCampaign: (id: number) => request<StrategySwitchCampaign>(`/admin/strategy-switch/bulk/${id}`),
    },

    // Phase 16: Invite Codes Management
    invites: {
        create: async (data: AdminInviteCreateRequest) => {
            return request<AdminInviteCreateResponse>('/admin/invites/', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        list: async (params?: { channel?: string; include_revoked?: boolean; page?: number; limit?: number }) => {
            const query = new URLSearchParams();
            if (params?.channel) query.append('channel', params.channel);
            if (params?.include_revoked !== undefined) query.append('include_revoked', String(params.include_revoked));
            if (params?.page !== undefined) query.append('page', String(params.page));
            if (params?.limit !== undefined) query.append('limit', String(params.limit));
            const qs = query.toString();
            return request<AdminInviteListResponse>(`/admin/invites/${qs ? `?${qs}` : ''}`);
        },
        revoke: async (id: number) => {
            return request<AdminInviteListItem>(`/admin/invites/${id}/revoke`, {
                method: 'POST'
            });
        }
    }
};

export const publicApi = {
    getHotStrategies: async (limit: number = 12, only_active: boolean = true) => {
        const query = new URLSearchParams({
            limit: limit.toString(),
            only_active: only_active.toString()
        }).toString();
        const list = await request<PublicStrategyCard[]>(`/public/strategies/hot?${query}`);
        return list.map((s: any) => ({
            ...s,
            metrics: normalizeMetrics(s.metrics)
        }));
    },
    getStrategyDetail: async (id: number) => {
        const s: any = await request<PublicStrategyCard>(`/public/strategies/${id}`);
        return {
            ...s,
            metrics: normalizeMetrics(s.metrics)
        } as PublicStrategyCard;
    }
};

// Zod Schema (Frontend Validation)
// Zod Schema (Frontend Validation)
const strategySchemaBase = z.object({
    strategyKey: z.string().optional(),
    name: z.string().min(1, 'Required'),
    description: z.string().optional(),
    type: z.string().optional().default('signal'),
    pair: z.string().min(1, 'Required'),
    status: z.enum(['active', 'inactive']).optional().default('active'),
});

export type StrategyFormData = z.infer<typeof strategySchemaBase>;

// Dynamic schema generator for i18n
export const getStrategySchema = (t: any) => z.object({
    strategyKey: z.string().optional(),
    name: z.string().min(1, t('strategies:validation.name_required')),
    description: z.string().optional(),
    type: z.string().optional().default('signal'),
    pair: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional().default('active'),
});

// Deprecated: use getStrategySchema(t) instead
export const strategySchema = strategySchemaBase;



