/**
 * @anchor-id API_CLIENT
 * @module-type api
 * @disposable false
 * @description API 瀹㈡埛绔?- 瀹屽叏瀵规帴鐪熷疄鍚庣 (/api/v1)
 */

import { z } from 'zod';
import { toast } from 'sonner';
import i18n from '../i18n'; // 鉁?Import i18n instance
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
    AccountBalance, // 鉁?鏂板锛氬彲鐢ㄤ繚璇侀噾绫诲瀷
    StrategyWebhookSecretResponse,
    WebhookEventRead,
    PublicStrategyCard,
    AccountStatusResponse, // 鉁?Imported
    ExchangeMetaResponse, // 鉁?Imported
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
    StrategyCreatePayload, // 鉁?Imported
    StrategyUpdatePayload,  // 鉁?Imported
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

// API 閰嶇疆
// 鉁?VITE_API_URL 鎺ㄨ崘鍙～鍩熷悕锛屽锛歨ttps://api.vertexquant.com
// 鉁?涓嶅～鍒欓粯璁ゅ悓鍩熷悕涓嬬殑 /api/v1锛堥厤鍚?Nginx 鍙嶄唬鍙厤 CORS锛?
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api/v1` : '/api/v1';
const TOKEN_KEY = 'auth_token';

// 馃洝锔?API Client - Fully connected to production backend

// 閫氱敤璇锋眰鍑芥暟
export function translateBackendErrorMessage(rawMsg: string): string {
    const directKey = `common:backend_errors.${rawMsg}`;
    if (i18n.exists(directKey)) return i18n.t(directKey);

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
        if (rawMsg.startsWith(mapping.prefix) && i18n.exists(mapping.key)) {
            const translated = i18n.t(mapping.key);
            if (mapping.preserveSuffix) {
                const suffix = rawMsg.slice(mapping.prefix.length).trim();
                return suffix ? `${translated}: ${suffix}` : translated;
            }
            return translated;
        }
    }

    return rawMsg;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // 鍏抽敭锛氬湪姣忔璇锋眰鏃堕噸鏂拌幏鍙?Token锛岀‘淇濊幏鍙栧埌鐨勬槸鐧诲綍鍚庣殑鏈€鏂板€?
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
        // 娓呯悊鏃ч敭鍚嶏紙鍙€夛紝鎺ㄨ崘娓呯悊涓€娆★級
        localStorage.removeItem('panda_quant_user');
        localStorage.removeItem('user_data');

        // 浠呭湪闈炵櫥褰曢〉瑙﹀彂閫氱煡
        if (
            window.location.pathname !== '/' &&
            window.location.pathname !== '/login' &&
            window.location.pathname !== '/register'
        ) {

            // 閫氳繃骞挎挱浜嬩欢閫氱煡 AuthContext 鏇存柊鐘舵€侊紝鑰屼笉鏄‖璺宠浆
            // 杩欒兘瑙ｅ喅涓?React Router Navigate 浜х敓鐨勯噸瀹氬悜鍐茬獊
            window.dispatchEvent(new CustomEvent('panda-auth-unauthorized'));

            // 渚濈劧淇濇寔寮圭獥鎻愮ず锛堝崟渚嬶級
            toast.error(i18n.t('common:session_expired'), {
                id: 'auth-error',
            });
        }
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        try {
            const errBody = await response.json();
            // 鉁?Smart Translate: Try to find a mapped error message
            let errMsg = errBody.detail || errBody.msg || errBody.message || response.statusText;

            // 鉁?CRITICAL FIX: Support Object error details (e.g. Legal 409 Conflict)
            // Backend may return { code: "LEGAL_ACCEPTANCE_REQUIRED", message: "...", ... }
            if (typeof errMsg === 'object' && errMsg !== null) {
                const err = new Error(errMsg.message || JSON.stringify(errMsg));
                // Attach structured data for interceptors (e.g. RiskDisclosureDialog)
                (err as any).code = errMsg.code;
                (err as any).detail = errMsg;
                throw err;
            }

            // Translate known backend errors (exact + dynamic prefix mappings)
            if (typeof errMsg === 'string') {
                errMsg = translateBackendErrorMessage(errMsg);
            }

            throw new Error(errMsg as string);
        } catch (e: any) {
            // Check if it's already an Error object we just threw (with detail, etc.)
            if (e.message && !e.message.includes('Unexpected token') && !e.message.includes('is not valid JSON')) {
                throw e;
            }
            // Fallback to HTTP status text (e.g. "Internal Server Error")
            throw new Error(response.statusText || `Error ${response.status}`);
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
// 璁よ瘉 API (Auth)
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
// 璐︽埛 API (Accounts)
// ===============================================
export const accountApi = {
    list: async () => {
        const accounts = await request<Account[]>('/accounts/');
        // 鍚庣浣跨敤杞垹闄わ紝鍓嶇闇€瑕佽繃婊ゆ帀 deleted_at 涓嶄负绌虹殑璐︽埛
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

    // 鉁?Checklist 2.5: Safe Update (Simulating PATCH /profile)
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
        // 鉁?Fix: Backend returns 200 even if verify fails (with status='not_ready'/'config_missing').
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
     * 鉁?鏂板锛氳幏鍙栬处鎴峰彲鐢ㄤ繚璇侀噾锛堢敤浜庘€滃浐瀹氶噾棰濃€濇ā寮忎笂闄愶級
     * - 鍏堝皾璇?/accounts/{id}/balance锛堟帹鑽愪綘鍚庣瀹炵幇锛?
     * - 鑻ュ悗绔湭瀹炵幇锛岃繑鍥?null锛屽墠绔細 fallback
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

    // 鉁?Safe Profile Update (Simulated PATCH using restricted PUT)
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
// 绛栫暐 API (Strategies)
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

    // 鍏抽敭锛氱‘淇濅竴瀹氭湁 all锛堝惁鍒欏崱鐗?璇︽儏榛樿 all 浼氭嬁涓嶅埌锛?
    return out;
}

function parseStrategyConfig(raw: any): any {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    if (typeof raw !== 'string') return {};
    if (raw === 'string') return {}; // 鍏煎锛歋wagger 绀轰緥/鑴忓€?
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

    // 鉁?CRUD operations use admin endpoints (backend /strategies/ only supports GET)
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

    delete: async (id: number, purgeTvCsv: boolean = true) => {
        // Delegate to admin API
        return adminApi.strategies.delete(id, purgeTvCsv);
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
// 浜ゆ槗鎵€鍏冩暟鎹?API (Exchange Meta)
// ===============================================
export const exchangeApi = {
    /**
     * 鑾峰彇浜ゆ槗鎵€浜ゆ槗瀵瑰厓鏁版嵁 (min_notional, step_size 绛?
     * @param exchange 浜ゆ槗鎵€绫诲瀷: 'binance_futures' | 'gate_futures'
     * @param symbols 鍙€夛紝鎸囧畾浜ゆ槗瀵瑰垪琛?
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
// 璁㈤槄 API (Subscriptions)
// ===============================================
export const subscriptionApi = {
    list: async () => {
        return request<Subscription[]>('/subscriptions/');
    },

    create: async (data: SubscriptionCreateDto) => {
        // 鉁?Strict Payload Construction based on Mode
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
// 璁㈠崟/浜ゆ槗 API (Orders)
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

    // 鑾峰彇浜ゆ槗鍘嗗彶 (榛樿浣跨敤鏈湴绯荤粺璁㈠崟锛屽缓璁垏鎹㈠埌 turboflowApi.getOrders 浠ヨ幏鍙栨敹鐩?
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
                status: order.status, // 淇濇寔澶у啓鍘熸牱锛屼互渚垮墠绔兘澶熸纭?if (status === 'COMPLETED')
                time: new Date(order.executed_at || order.created_at).toLocaleString(),
                // 鉁?Use realized_pnl if available (Backend Sync)
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
        // 鍚庣杩斿洖: { today: {...}, strategies: [...], accounts: [...] }
        const today = raw?.today || {};
        const strategies = raw?.strategies || [];
        const accounts = raw?.accounts || [];

        const accountsClean = accounts.filter((a: any) => !a.deleted_at);

        return {
            // 浠婃棩璁㈠崟缁熻
            todayTotal: today.total || 0,
            todayPending: today.pending || 0,
            todayProcessing: today.processing || 0,
            todayCompleted: today.completed || 0,
            todayFailed: today.failed || 0,
            todayExpired: today.expired || 0,
            // 绛栫暐缁熻
            totalStrategies: strategies.length,
            strategies: strategies,
            // 璐︽埛缁熻锛堚渽 杩囨护 deleted锛?
            totalAccounts: accountsClean.length,
            activeAccounts: accountsClean.filter((a: any) => a.is_active).length,
            accounts: accountsClean,
        };
    }
};

// ===============================================
// 鎺掕姒?API (Leaderboard)
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

// 鉁?杩囨护 undefined / null锛岄伩鍏?day=undefined 杩欑鍧?
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
    // 鉁?鍚屾椂鍙?scope + range锛堝吋瀹逛綘鏃х増鍚庣 ?range=total锛?
    getGlobal: async (params?: {
        scope?: 'daily' | 'total';
        day?: string;
        limit?: number;
        only_close_pos?: boolean;
    }) => {
        const scope = params?.scope;
        const q = buildQuery({
            ...params,
            ...(scope ? { range: scope } : {}), // 鍏煎鑰佸弬鏁?
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
// 瀹炵洏浜ゆ槗 API (TurboFlow - 鐪熷疄鏀剁泭鏁版嵁)
// ===============================================
export const turboflowApi = {
    getOrders: async (params: { account_id: number; status?: string; page_num?: number; page_size?: number; debug?: boolean }) => {
        const query = buildQuery(params as any);
        try {
            const resp = await request<TurboFlowOrderListResponse>(`/turboflow/orders?${query}`);
            // 杩斿洖 data 瀵硅薄浠ヤ繚鐣?pagination 淇℃伅 (count, page_count)
            return resp.data || { data: [], count: 0, page_count: 0, page_num: 1, page_size: 20 };
        } catch (e: any) {
            // 鍚庣 turboflow 璺敱鏈敞鍐屾椂杩斿洖 404锛岄潤榛樿繑鍥炵┖鏁版嵁
            if (e.message?.includes('404')) {
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
// 甯傚満琛屾儏 API (Market)
// ===============================================
export const marketApi = {
    // 娉ㄦ剰: symbol 鏄矾寰勫弬鏁帮紝涓嶆槸鏌ヨ鍙傛暟
    getOhlcv: async (symbol: string, limit: number = 20) => {
        return request<any>(`/market/ohlcv/${symbol}?limit=${limit}`);
    }
};

export const signalApi = {
    getByStrategyId: async (strategyId: number) => {
        // 1. 鑾峰彇璇ョ瓥鐣ュ叧鑱旂殑鎵ц璁㈠崟
        const response = await orderApi.list({ strategy_id: strategyId, page_size: 100 });
        const orders = response.items;

        // 2. 灏?Order 鏄犲皠涓哄墠绔湡鏈涚殑 Signal 鏍煎紡
        const signals = orders.map(order => {
            const orderStatus = order.status.toUpperCase();
            let signalStatus: 'active' | 'closed' | 'failed';

            if (orderStatus === 'COMPLETED') {
                signalStatus = 'closed';
            } else if (orderStatus === 'FAILED') {
                signalStatus = 'failed';
            } else if (orderStatus === 'EXPIRED' || orderStatus === 'CANCELLED') {
                signalStatus = 'closed'; // 杩囨湡鍜屽彇娑堢殑璁㈠崟瑙嗕负宸插叧闂?
            } else {
                // PENDING, PROCESSING 绛夎繘琛屼腑鐨勭姸鎬?
                signalStatus = 'active';
            }

            return {
                id: order.id,
                pair: order.symbol || 'N/A',
                direction: order.side === 'buy' ? 'long' : 'short',
                entryPrice: order.executed_price || order.price || '--',
                exitPrice: null, //骞充粨閫昏緫鏆備笉鍦ㄦ灞曠ず璇︽儏
                timestamp: new Date(order.signal_received_at || order.created_at).toLocaleString(),
                status: signalStatus,
                timeframe: order.leverage ? `${order.leverage}x` : '--',
                strategy_key: order.symbol,
                duplicate_count: 0,
                // 棰濆娣诲姞鍘熷鐘舵€佺敤浜庢樉绀?
                raw_status: orderStatus,
            };
        }) as unknown as Signal[];

        // 3. 缁熻鏁版嵁
        const stats = {
            totalSignals: orders.length,
            activeSignals: orders.filter(o => o.status === 'PROCESSING' || o.status === 'PENDING').length,
            failedSignals: orders.filter(o => o.status === 'FAILED').length,
            winRate: 0 //鍚庣鏈彁渚涘钩浠撴敹鐩婏紝鏆備笉璁＄畻
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
// 鍏憡 API (Announcements) - Phase 6.1
// ===============================================
export const announcementApi = {
    // 鍒楄〃 (榛樿 limit 10) - 鍏紑璇诲彇
    list: (lang: string, limit: number = 10) => request<Announcement[]>(`/public/announcements?lang=${lang}&limit=${limit}`),

    // 璇︽儏 - 鍏紑璇诲彇
    get: (id: number, lang: string) => request<AnnouncementDetail>(`/public/announcements/${id}?lang=${lang}`),

    // 棣栭〉寮圭獥 - 鍏紑璇诲彇
    getPopup: (lang: string) => request<PopupAnnouncement | null>(`/public/announcements/popup?lang=${lang}`)
};

// ===============================================
// 娉曞姟 API (Legal) - Phase 6.2
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
// 绠＄悊鍛?API (Admin) - Segregated
// ===============================================
export const adminApi = {
    strategies: {
        create: (data: StrategyCreatePayload) => request<Strategy>('/admin/strategies/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: StrategyUpdatePayload) => request<Strategy>(`/admin/strategies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: number, purgeTvCsv: boolean = true) => request<void>(`/admin/strategies/${id}?purge_tv_csv=${purgeTvCsv}`, { method: 'DELETE' }),
        publish: (id: number) => request<void>(`/admin/strategies/${id}/publish`, { method: 'POST' }),
        unpublish: (id: number) => request<void>(`/admin/strategies/${id}/unpublish`, { method: 'POST' }),
        getWebhookSecret: (id: number) => request<StrategyWebhookSecretResponse>(`/admin/strategies/${id}/webhook-secret`),
        rotateWebhookSecret: (id: number) => request<StrategyWebhookSecretResponse>(`/admin/strategies/${id}/webhook-secret/rotate`, { method: 'POST' }),
        // 鉁?Fixed: Use FormData for file upload & aligned auth logic with request()
        importStats: async (id: number, file: File) => {
            const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
            const formData = new FormData();
            // 鉁?Backend verification result: field MUST BE 'file'
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
        list: () => request<AnnouncementAdminListResponse>('/admin/announcements/'),
        get: (id: number) => request<AnnouncementAdminResponse>(`/admin/announcements/${id}`),
        create: (data: any) => request<AnnouncementAdminResponse>('/admin/announcements/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: any) => request<AnnouncementAdminResponse>(`/admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (id: number) => request<void>(`/admin/announcements/${id}`, { method: 'DELETE' }),
        publish: (id: number) => request<AnnouncementAdminResponse>(`/admin/announcements/${id}/publish`, { method: 'POST' }),
        unpublish: (id: number) => request<AnnouncementAdminResponse>(`/admin/announcements/${id}/unpublish`, { method: 'POST' }),
    },
    legal: {
        list: () => request<AdminLegalDocListResponse>('/admin/legal/'),
        get: (id: number) => request<AdminLegalDocResponse>(`/admin/legal/${id}`),
        create: (data: any) => request<AdminLegalDocResponse>('/admin/legal/', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: number, data: any) => request<AdminLegalDocResponse>(`/admin/legal/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        activate: (id: number) => request<AdminLegalDocResponse>(`/admin/legal/${id}/activate`, { method: 'POST' }),
    },
    // 鉁?Phase 7.4: Ops Console
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
        getOrder: (id: number) => request<Order>(`/admin/orders/${id}`), // 鉁?Detail View
        getOrderEvents: (id: number) => request<AdminOrderEventsResponse>(`/admin/orders/${id}/events`), // 鉁?Timeline
        cancelOrder: (id: number, reason?: string) => request<{ success: boolean; detail: string }>(`/admin/orders/${id}/cancel?reason=${encodeURIComponent(reason || '')}`, { method: 'POST' }),
        closePosition: (data: { account_id: number; symbol: string; pos_side: 'long' | 'short'; position_id?: string; qty?: number; reason?: string }) => request<void>('/admin/positions/close', { method: 'POST', body: JSON.stringify(data) }),
        requeueOrder: (id: number, reason?: string) => request<any>(`/admin/orders/${id}/requeue?reason=${encodeURIComponent(reason || '')}`, { method: 'POST' }), // 鉁?Requeue
        batchRequeue: (data: { statuses?: string[]; limit?: number; dry_run?: boolean; reason?: string }) => request<{ dry_run: boolean; matched: number; selected_order_ids: number[]; requeued: number }>('/admin/orders/requeue', { method: 'POST', body: JSON.stringify(data) }), // 鉁?Batch Requeue
    },

    // 鉁?Phase 7.5: Audit Logs
    audit: {
        list: async (params?: { actor?: string; action?: string; target_type?: string; date_from?: string; date_to?: string; page?: number; limit?: number }) => {
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

    // 鉁?Phase 7.7: Subscription Management
    // NOTE: Backend does NOT have GET /admin/subscriptions list endpoint
    // Only freeze endpoint exists: POST /admin/subscriptions/{id}/freeze
    subscriptions: {
        // 鉂?REMOVED: list endpoint does not exist in backend
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

    // 鉁?Phase 12: TurboFlow Audit
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
                offset: ((page - 1) * limit).toString()
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
            limit?: number;
            page?: number;
        }) => {
            const limit = params?.limit ?? 50;
            const page = params?.page ?? 1;
            const query = new URLSearchParams();
            if (params?.kind) query.append('kind', params.kind);
            if (params?.severity) query.append('severity', params.severity);
            if (params?.account_id) query.append('account_id', params.account_id.toString());
            if (params?.order_id) query.append('order_id', params.order_id.toString());
            query.append('limit', limit.toString());
            query.append('page', page.toString()); // Backend changed offset to page in schemas/admin_audit.py
            return request<AuditItemPageResponse>(`/admin/audit/runs/${runId}/items?${query.toString()}`);
        }
    },

    // 鉁?Phase 12: Order Statistics
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

    // 鉁?Phase 132: Strategy Switch (New)
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

    // 鉁?Phase 16: Invite Codes Management
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

// 鉁?Dynamic Schema Generator for I18n
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



