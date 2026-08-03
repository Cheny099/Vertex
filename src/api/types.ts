// ==========================================
// Backend Aligned Types (Source of Truth)
// ==========================================
import type { JsonObject, JsonValue } from './contracts';

export interface StrategyWebhookSecretResponse {
    strategy_id: number;
    strategy_key: string;
    secret: string;
    hint: string;
}


export interface Account {
    id: number;
    name: string;
    type: string;
    description?: string;
    exchange: 'week' | 'turboflow' | 'binance_futures' | 'gate_futures';
    week_mode?: string;
    week_status?: string; // 'need_login' | 'connected' | 'expired' | 'api_ready' | 'config_missing' | 'api_invalid'
    week_last_ok_at?: string;
    api_key?: string; // Masked
    base_url?: string;
    lang?: string;
    is_active: boolean;
    is_ready?: boolean;
    last_login_at?: string;
    last_verified_at?: string;
    last_error?: string;
    deleted_at?: string; // 软删除标�?

    // �?Money Fields
    available_margin?: number;
    equity?: number;
    wallet_balance?: number;
    currency?: string;

    created_at: string;
    updated_at: string;
}

export interface AccountCreateDto {
    name: string;
    type: string; // 'real' | 'demo'
    description?: string;
    exchange: 'week' | 'turboflow' | 'binance_futures' | 'gate_futures';
    week_mode?: 'real' | 'demo';
    api_key?: string;
    api_secret?: string;
    base_url?: string;
    lang?: string;
}

// 对应后端 /strategies/ 返回的数据结�?
export interface Strategy {
    id: number;
    strategy_key: string;
    name: string;
    description?: string;
    status: string;
    config?: JsonValue; // JSON 格式的策略配�?
    public_stats?: StrategyPublicStats; // �?Phase 75: Metrics from CSV import
    created_at: string;
    updated_at: string;

    // �?Security Fields (Backend Sync)
    has_webhook_secret?: boolean;
    webhook_secret_hint?: string;

    // �?Phase 6: Sync Metrics
    metrics?: Record<string, StrategyMetricsItem>; // Record<PeriodKey, ...>
    metrics_as_of?: string;
    metrics_source?: string;

    // �?config 解析出的辅助字段（前端读取用�?
    pair?: string;
    type?: string;
    investment?: string;
}

/**
 * �?订阅跟单模式�?
 * - fixed: 账户比例
 * - fixed_amount: 固定金额（USDT�?
 * - multiplier: 倍数（已下线，仅用于兼容历史数据；UI 会移除这个选项�?
 */
export type PositionMode = 'fixed_amount' | 'fixed' | 'multiplier';

export interface Subscription {
    id: number;
    user_id: number;
    strategy_id: number;
    account_id: number;
    position_mode: PositionMode;
    position_value: number;
    position_pct?: number; // 0.02 - 1.0
    leverage?: number; // 1 - 200
    created_at: string;
    updated_at: string;

    // Relationships
    strategy?: Strategy;
    account?: Account;

    // Emergency Status
    is_frozen?: boolean;
    frozen_at?: string;
    frozen_reason?: string;
    // �?Phase 132: Block Open
    block_open?: boolean;
    block_open_reason?: string;
}

export interface SubscriptionCreateDto {
    strategy_id: number;
    strategy_key: string;
    account_id: number;
    position_mode: PositionMode;
    position_value: number;
    position_pct?: number;
    leverage?: number;
}

export interface Order {
    id: number;
    user_id: number;
    account_id: number;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price?: number;
    executed_price?: number;
    executed_qty?: number;
    executed_notional_usd?: number;
    exchange?: string;
    action?: string;
    ex_order_id?: string;
    ex_order_status?: string;
    tf_order_id?: string;
    tf_position_id?: string;
    tf_order_status?: string;
    /** Client-side only: the un-narrowed TurboFlow id, for use as a stable list key. */
    tf_row_key?: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

    // Backend specific logic
    signal_received_at: string;
    expires_at: string;
    processing_started_at?: string;
    processed_at?: string;
    executed_at?: string;
    error_message?: string;
    last_error?: string;
    retry_count: number;
    next_retry_at?: string;

    // �?New: Failure Attribution (Backend Sync) - Flat Fields
    failure_code?: string;
    failure_message?: string;
    failure_action?: string;

    // �?Phase 136: Block/Freeze Status
    block_open?: boolean;
    block_reason?: string;
    is_frozen?: boolean;
    freeze_reason?: string;

    // �?New: Failure Attribution (Backend Sync) - Object Field (Standard)
    public_error?: {
        code: string;
        message: string;
        action: string;
        // Always an object on the wire (see subscription_guard.build_public_error), and consumers
        // read named keys out of it - `blocked_by` in particular. Typing it as the wider JsonValue
        // made every one of those reads a type error.
        details?: JsonObject;
    };

    // �?New: PnL Backfill
    realized_pnl?: number;
    realized_pnl_usd?: number;
    roi?: number;
    closed_at?: string;

    // Strategy/Risk info
    take_profit_price?: number;
    stop_loss_price?: number;
    position_pct?: number;
    leverage?: number;

    strategy_id?: number | null;
    subscription_id?: number | null;
    created_at: string;
    updated_at: string;

    // Frontend compatibility helpers (Optional)
    time?: string; // Mapped from created_at in UI
    pair?: string; // Mapped from symbol
    type?: 'buy' | 'sell'; // Match side
    strategy?: string; // Name of strategy?
    total?: string;
    fee?: string;
    profit?: string;
}

export interface OrderCreateRequest {
    account_id: number;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    position_pct?: number; // 0.02 - 1.0
    leverage?: number; // 1 - 200
    price?: number;
    take_profit_price?: number;
    stop_loss_price?: number;
}

export interface StrategyUpdateDto {
    strategy_key?: string;
    name?: string;
    description?: string;
    config?: JsonValue;
    status?: string;
}

export interface TurboFlowPositionItem {
    position_id?: string;
    unpnl?: string | number;
    [key: string]: unknown;
}

export interface PublicStrategyCard {
    id: number;
    strategy_key: string;
    name: string;
    description?: string;
    status: string; // 'active' | 'inactive'
    last_signal_at?: string;
    subscribers: number;
    // �?Phase 6: Sync Metrics
    metrics?: Record<string, StrategyMetricsItem>; // Record<PeriodKey, ...>
    metrics_as_of?: string;
    metrics_source?: string;
}

export interface TurboFlowPositionListResponse {
    http_status?: number;
    errno?: string;
    msg?: string;
    data?: { data?: TurboFlowPositionItem[] };
}

// �?新增：TurboFlow 账户资产/可用保证金（用于固定金额模式�?max 限制�?
export interface TurboFlowAccountInfo {
    available_margin?: number | string;   // 可用保证金（推荐用这个做上限�?
    equity?: number | string;             // 总权�?
    wallet_balance?: number | string;     // 钱包余额
    currency?: string;                    // 'USDT' etc.
    [key: string]: unknown;
}

// ==========================================
// Frontend Specific Types (Dashboard, etc.)
// ==========================================

export interface CreateStrategyDto {
    name: string;
    type: string;
    pair: string;
    investment: string | number;
    description?: string;
    [key: string]: unknown; // Allow other config fields
}

// �?Explicit Backend Payload Types
export interface StrategyCreatePayload {
    strategy_key: string;
    name: string;
    description?: string;
    config: JsonValue;
    status?: string;
}

export interface StrategyUpdatePayload {
    strategy_key?: string;
    name?: string;
    description?: string;
    config?: JsonValue;
    status?: string;
}

export interface Position {
    id: string;
    symbol: string;
    name: string;
    fullName: string;
    amount: string;
    avgPrice: string;
    currentPrice: string;
    value: string;
    pnl: string;
    pnlValue: string;
    isProfit: boolean;
    allocation: number;
}

export interface Signal {
    id: number;
    pair: string;
    timeframe: string;
    timestamp: string;
    direction: 'long' | 'short' | 'unknown';
    entryPrice: number | string;
    exitPrice: number | null;
    status: 'active' | 'closed' | 'failed';
    strategy_key?: string;
    duplicate_count?: number;
}

export interface SignalStats {
    totalSignals: number;
    activeSignals: number;
    failedSignals: number;
    winRate: number;
}

export interface WebhookEventRead {
    id: number;
    strategy_key: string;
    payload_hash: string;
    duplicate_count: number;
    created_at: string;
    last_seen_at: string;
    is_duplicate?: boolean;
    // Frontend helpers
    status?: 'active' | 'closed' | 'failed';
}

// Previously defined Trade interface is now merged into Order or we keep a mapping
export type Trade = Order;

export interface OrderListResponse {
    items: Order[];
    total: number;
    has_more: boolean;
    next_page_num?: number;
}

export interface TradeHistoryParams {
    page_num?: number;
    page_size?: number;
    account_id?: number;
    status?: string;
    page?: number;
    limit?: number;
    pair?: string;
    type?: string;
    search?: string;
    timeRange?: string;
}

// 对应后端 /dashboard/stats 返回的数据结�?
export interface DashboardStats {
    // today 订单统计
    todayTotal: number;
    todayPending: number;
    todayProcessing: number;
    todayCompleted: number;
    todayFailed: number;
    todayExpired: number;
    // 策略统计
    totalStrategies: number;
    strategies: Array<{
        strategy_id: number;
        strategy_key: string;
        name: string;
        subscription_count: number;
    }>;
    // 账户统计
    totalAccounts: number;
    activeAccounts: number;
    accounts: Array<{
        account_id: number;
        name: string;
        is_active: boolean;
        deleted_at?: string;
        last_order_at?: string;
        last_error?: string;
    }>;
}

export interface TurboFlowOrderItem {
    id: string;
    symbol?: string;
    pair_id?: string;
    status?: string;
    unpnl?: string | number;
    done_pnl?: string | number;
    [key: string]: unknown;
}

export interface TurboFlowOrderListResponse {
    http_status: number;
    errno: string; // 确保�?string
    msg: string;
    data: {
        page_size: number;
        page_num: number;
        count: number;
        page_count: number;
        data: TurboFlowOrderItem[];
    };
}

// ==========================================
// User Profile
// ==========================================

// 对齐后端 UserRead schema
export interface UserProfile {
    id: number;
    email: string;
    full_name?: string;
    external_key?: string;
    is_active: boolean;
    is_admin?: boolean; // �?New backend field
    can_subscribe?: boolean; // Added for Invite Codes
    invite_code_id?: number | null; // Added for Invite Codes
    invite_channel?: string | null; // Added for Invite Codes
    created_at: string;
    updated_at: string;
    // Frontend UI legacy (won't be populated from backend)
    username?: string;
    phone?: string;
    avatar?: string;
    timezone?: string;
}

export interface ApiKey {
    id: string | number;
    exchange: string;
    name: string;
    apiKey: string;
    status: 'connected' | 'disconnected' | 'error';
    createdAt: string;
}

export interface ExchangeOption {
    id: string;
    name: string;
    logo: string;
}

export interface TickerData {
    symbol: string;
    price: string;
    change: string;
    isUp: boolean;
}

// Auth Request Types
export interface ForgotPasswordRequest {
    email: string;
}

export interface SendRegisterCodeRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    code: string;
    new_password: string;
}

export interface SendLoginCodeRequest {
    email: string;
}

export interface LoginWithCodeRequest {
    email: string;
    password: string;
    code: string;
}

export interface UserRegisterRequest {
    email: string;
    password: string;
    full_name?: string;
    code: string;
}

// types.ts 末尾加一行就�?
export type AccountBalance = TurboFlowAccountInfo;

// �?New: Account Status Detailed Response
export interface AccountStatusResponse {
    status: 'ok' | 'need_verify' | 'uid_mismatch' | 'config_missing' | 'inactive' | 'not_ready' | 'disabled' | 'unknown' | string;
    last_error: string | null;
    last_seen_at: string | null;
    detail?: {
        exchange: string;
        is_ready?: boolean;
        // Fields for "uid_mismatch" / "verify result"
        code?: string;
        message?: string;
        action?: string;
        // Fields for "need_verify"
        hint?: string;
        // Debug
        db_uid?: string;
        api_uid?: string;
        [key: string]: unknown;
    };
}


// ==========================================
// Leaderboard
// ==========================================
export interface LeaderboardItem {
    user_id: number;
    display_name: string;
    pnl: number;
}

export interface LeaderboardResponse {
    scope: 'daily' | 'total' | string;
    items: LeaderboardItem[];
}

// ==========================================
// Exchange Metadata
// ==========================================
export interface SymbolMeta {
    symbol: string;
    min_notional: number;
    min_qty: number;
    step_size: number;
    tick_size: number;
    market_min_qty?: number;
    market_step_size?: number;
    updated_at: string;
}

export interface ExchangeMetaResponse {
    exchange: string;
    symbols: SymbolMeta[];
}

// ==========================================
// Phase 16: Invite Codes
// ==========================================

export interface InviteRedeemRequest {
    code: string;
}

export interface InviteRedeemResponse {
    status: 'ok' | 'already_redeemed';
    can_subscribe: boolean;
    channel?: string | null;
}

export interface AdminInviteCreateRequest {
    channel?: string | null;
    notes?: string | null;
    max_uses: number;
    expires_at?: string | null;
}

export interface AdminInviteCreateResponse {
    id: number;
    code: string;
    code_hint: string;
    channel?: string | null;
    notes?: string | null;
    max_uses: number;
    used_count: number;
    expires_at?: string | null;
    revoked_at?: string | null;
    created_at: string;
}

export interface AdminInviteListItem {
    id: number;
    code_hint: string;
    channel?: string | null;
    notes?: string | null;
    max_uses: number;
    used_count: number;
    expires_at?: string | null;
    revoked_at?: string | null;
    created_at: string;
}

export interface AdminInviteListResponse {
    items: AdminInviteListItem[];
    total: number;
}

// ==========================================
// Phase 6: Announcements, Legal, Metrics
// ==========================================

// --- Announcements ---
// --- Announcements ---
export type AnnouncementLang = 'zh' | 'en' | 'all';

// Combined Announcement Interface
export interface Announcement {
    id: number;
    title: string;
    content: string; // Unified content field
    lang: string;
    popup: boolean;
    priority: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Legacy/Derived fields for compatibility
    published_at?: string;
    is_pinned?: boolean;
}

export interface AnnouncementDetail extends Announcement {
    content_md?: string; // Optional if using content
}

export interface PopupAnnouncement extends Announcement {
    content_md?: string;
}

// --- Legal & Risk ---
export type LegalDocKey = 'terms' | 'privacy' | 'auto_trade_notice';

export interface PublicLegalDoc {
    key: LegalDocKey;
    lang: string;
    version: string;
    title: string;
    content_md: string;
    content?: string; // �?Added for admin detail
    effective_at: string;
}

export interface LegalStatusItem {
    required_version: string | null;
    accepted_version: string | null;
    accepted_at: string | null;
    is_accepted: boolean;
}

export interface LegalStatusResponse {
    terms: LegalStatusItem;
    privacy: LegalStatusItem;
    auto_trade_notice: LegalStatusItem;
}

// --- Strategy Metrics ---
export type PeriodKey = '1m' | '3m' | '6m' | '1y' | 'all';

export interface StrategyPublicStats {
    metrics?: Record<string, StrategyMetricsItem>;
    [key: string]: unknown;
}

export interface StrategyMetricsItem {
    return_pct: number;
    profit_factor: number | null;
    win_rate: number;
    max_drawdown_pct: number;
}

// --- Admin Ops & Audit ---
export interface AnnouncementAdminResponse extends Announcement {
    content_md?: string;
    show_popup?: boolean;
    is_published?: boolean;
    popup_start_at?: string | null;
    popup_end_at?: string | null;
    deleted_at?: string | null;
}
export interface AnnouncementAdminListResponse {
    items: AnnouncementAdminResponse[];
    total: number;
    limit?: number;
    offset?: number;
}

export interface AdminLegalDocResponse extends PublicLegalDoc {
    id: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AdminLegalDocListResponse {
    items: AdminLegalDocResponse[];
    total: number;
}

export interface AdminAuditLogItem {
    id: number;
    actor_email: string;
    action: string;
    target_type: string;
    target_id: string | null;
    reason: string | null;
    meta: JsonObject;
    created_at: string;
}

export interface AdminAuditLogListResponse {
    items: AdminAuditLogItem[];
    total: number;
    limit: number;
    offset: number;
}

export interface AdminSubscriptionListResponse {
    items: Subscription[];
    total: number;
    limit: number;
    offset: number;
}

export interface AdminOrderEventItem {
    source: 'last_error' | 'tf_submit_raw';
    stage: string;
    note?: string;
    data?: unknown;
    raw?: string;
}

export interface AdminOrderEventsResponse {
    order_id: number;
    events: AdminOrderEventItem[];
}

export interface AdminSubscriptionFreezeRequest {
    frozen: boolean;
    reason?: string;
}

// --- Admin Ops (Optional) ---
// --- Admin Ops (Optional) ---

// =============================================
// Phase 12: Audit & Stats Types
// =============================================

// === 审计请求 ===
export interface AuditRunRequest {
    lookback_days?: number;
    max_pages?: number;
    page_size?: number;
    dry_run?: boolean;
    mode?: 'local_only' | 'full';
    scope?: 'users' | 'exchanges';
}

// === 审计响应 ===
export interface AuditRunResponse {
    id: number;
    status: string;
    scope?: 'users' | 'exchanges';
    started_at: string;
    finished_at?: string;
    params?: {
        lookback_days?: number;
        mode?: 'local_only' | 'full';
        dry_run?: boolean;
        [key: string]: unknown;
    };
    summary?: {
        scanned?: number;
        updated?: number;
        found?: number;
        mismatched?: number;
        fixed?: number;
        // �?Multi-exchange Audit Structure
        exchanges?: string[];
        backfill_enabled?: boolean;
        backfill?: {
            status: string;
            total_backfilled: number;
            total_failed: number;
            [key: string]: unknown;
        };
        stats_by_exchange?: Record<string, {
            total: number;
            completed: number;
            completed_missing_external_id: number;
            completed_missing_price: number;
            completed_missing_notional: number;
            completed_missing_executed_at: number;
            [key: string]: unknown;
        }>;
        [key: string]: unknown;
    };
    error?: string;
}

export interface AuditRunListResponse {
    items: AuditRunResponse[];
    total: number;
    limit: number;
    page: number;
}

export interface AuditRunDetail extends AuditRunResponse {
    total_items: number;
}

// === 审计�?===
export type AuditItemKind =
    | 'FIELDS_BACKFILLED'
    | 'NOTIONAL_MISMATCH'
    | 'LOCAL_NOT_FOUND_IN_ORDER_LIST'
    | 'LOCAL_COMPLETED_MISSING_TF_ORDER_ID'
    | 'EXTERNAL_MISSING_LOCAL'
    | 'STATUS_MISMATCH'
    | 'COMPLETED_NO_EXEC_PRICE'
    | 'CLOSE_NO_PNL';

export interface AuditItem {
    id: number;
    run_id: number;
    kind: AuditItemKind | string;
    severity: 'info' | 'warning' | 'error';
    account_id?: number;
    order_id?: number;
    detail: Record<string, unknown>;
    created_at: string;
}

export interface AuditItemPageResponse {
    items: AuditItem[];
    total: number;
    page: number;
    page_size: number;
}

// === 交易统计 ===
export interface OrderTurnoverStatsRow {
    // Group by 字段（根�?group_by 参数动态出现）
    day?: string;
    user_id?: number;
    account_id?: number;
    symbol?: string;
    strategy_id?: number;
    subscription_id?: number;

    // 核心统计
    turnover_usd: number;
    turnover_usd_executed_notional: number;
    turnover_usd_fallback: number;
    close_cnt: number;
    realized_pnl_usd_sum: number;
    win_cnt: number;
    lose_cnt: number;
    win_rate: number;

    // 状�?
    turnover_mode: 'executed_notional' | 'fallback_qty_price' | 'mixed';
    executed_notional_covered: {
        covered: number;
        total: number;
        pct: number;
    };

    // �?Phase 132: New Stats
    completed_cnt?: number;
    open_cnt?: number;
    flat_cnt?: number;

    quality_warnings: string[];
}

// =============================================
// Phase 132: Strategy Switch Types
// =============================================
export interface StrategySwitchRequest {
    request_id: string; // UUID
    account_id: number;
    symbol: string;
    from_subscription_id: number;
    to_subscription_id: number;
    handover_mode: 'FLAT_THEN_SWITCH' | 'KEEP_POSITION_ADOPT';
    reason?: string;
}

export interface StrategySwitchResponse {
    run_id: number;
    status: string;
    idempotent_reused: boolean;
}

export interface StrategySwitchPreviewRequest {
    account_id: number;
    symbol: string;
    from_subscription_id: number;
    to_subscription_id: number;
    handover_mode: 'FLAT_THEN_SWITCH' | 'KEEP_POSITION_ADOPT';
}

export interface StrategySwitchPreviewResponse {
    handover_mode: string;
    plan: unknown;
}

export interface StrategySwitchRun {
    id: number;
    status: string;
    request_id: string;
    account_id: number;
    symbol: string;
    from_subscription_id: number;
    to_subscription_id: number;
    handover_mode: string;
    created_at: string;
    updated_at: string;
    finished_at?: string;
    error_message?: string;
    failed_step?: string;
    meta?: Record<string, unknown>;
    account?: Account;
    from_subscription?: Subscription;
    to_subscription?: Subscription;
}

export interface StrategySwitchBulkFailedRun {
    run_id: number;
    account_id: number;
    status: string;
    failed_step?: string;
    error_message?: string;
    updated_at?: string;
}

// Bulk types
export interface StrategySwitchBulkPreviewRequest {
    request_id?: string;
    symbol: string;
    from_strategy_id: number;
    to_strategy_id: number;
    handover_mode: 'FLAT_THEN_SWITCH' | 'KEEP_POSITION_ADOPT';
    reason: string;
}

export interface StrategySwitchBulkExecuteRequest {
    request_id: string;
    symbol: string;
    from_strategy_id: number;
    to_strategy_id: number;
    handover_mode: 'FLAT_THEN_SWITCH' | 'KEEP_POSITION_ADOPT';
    reason: string;
}

export interface StrategySwitchBulkExecuteResponse {
    campaign_id: number;
    status: string;
    idempotent_reused: boolean;
}

export interface StrategySwitchBulkPreviewSample {
    account_id: number;
    user_id: number;
    from_sub_id: number;
    to_sub_id: number | null;
    params_digest: string;
}

export interface StrategySwitchBulkPreviewResponse {
    total_candidates: number;
    will_create_to_sub: number;
    will_update_to_sub_params: number;
    will_create_runs: number;
    will_reuse_runs: number;
    sample: StrategySwitchBulkPreviewSample[];
}

export interface StrategySwitchCampaign {
    campaign_id: number;
    status: string;
    request_id: string;
    counts: Record<string, number>;
    created_at: string | null;
    updated_at: string | null;
    finished_at?: string;
    meta?: Record<string, unknown>;
    runs?: StrategySwitchRun[];
    recent_failed_runs?: StrategySwitchBulkFailedRun[];
}

