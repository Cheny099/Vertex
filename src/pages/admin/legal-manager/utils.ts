import { format } from 'date-fns';

export type LegalKey = 'terms' | 'privacy' | 'auto_trade_notice';
export type LegalLang = 'zh' | 'en';
export type EditorTab = 'edit' | 'preview';

export interface LegalFormData {
    key: LegalKey;
    lang: LegalLang;
    version: string;
    title: string;
    content_md: string;
    effective_at?: string;
}

export const DEFAULT_ACTIVE_TAB: LegalKey = 'terms';

export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
} as const;

export const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
} as const;

export const createDefaultLegalFormData = (key: LegalKey, title: string): LegalFormData => ({
    key,
    lang: 'zh',
    version: format(new Date(), 'yyyy-MM-dd'),
    title,
    content_md: '',
});

export const generateNextVersion = (currentVersion: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (/^\d{4}-\d{2}-\d{2}$/.test(currentVersion) && currentVersion !== today) {
        return today;
    }
    return `${currentVersion}-v${Math.floor(Math.random() * 1000)}`;
};

export const formatLegalEffectiveAt = (effectiveAt?: string, createdAt?: string) => {
    try {
        const d = new Date(effectiveAt || createdAt || Date.now());
        return Number.isNaN(d.getTime()) ? '-' : format(d, 'yyyy-MM-dd HH:mm');
    } catch {
        return '-';
    }
};
