
// ==========================================
// Phase 6: Announcements, Legal, Metrics
// ==========================================

// --- Announcements ---
export type AnnouncementLang = 'zh' | 'en' | 'all';

export interface Announcement {
    id: number;
    title: string;
    published_at: string; // ISO
    is_pinned: boolean;
}

export interface AnnouncementDetail extends Announcement {
    content_md: string;
}

export interface PopupAnnouncement {
    id: number;
    title: string;
    content_md: string;
    published_at: string;
    is_pinned: boolean;
}

// --- Legal & Risk ---
export type LegalDocKey = 'terms' | 'privacy' | 'auto_trade_notice';

export interface PublicLegalDoc {
    key: LegalDocKey;
    lang: string;
    version: string;
    title: string;
    content_md: string;
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

export interface StrategyMetricsItem {
    return_pct: number;
    profit_factor: number | null;
    win_rate: number;
    max_drawdown_pct: number;
    trades: number;
}
