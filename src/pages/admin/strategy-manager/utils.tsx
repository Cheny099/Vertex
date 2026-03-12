import { AlertTriangle, Check, Pause } from 'lucide-react';
import type { Strategy, StrategyMetricsItem, StrategyWebhookSecretResponse } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

export interface ActionConfirmState {
    open: boolean;
    title: string;
    desc: string;
    onConfirm: () => void;
}

export const DEFAULT_ACTION_CONFIRM: ActionConfirmState = {
    open: false,
    title: '',
    desc: '',
    onConfirm: () => {},
};

export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
} as const;

export const itemVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
} as const;

export const parseStrategyConfig = (strategy: Strategy, allPairsLabel: string) => {
    let config = strategy.config || {};
    if (typeof strategy.config === 'string') {
        try {
            config = JSON.parse(strategy.config);
        } catch {
            logger.warn('Failed to parse strategy config', strategy.config);
            config = {};
        }
    }

    const configRecord = typeof config === 'object' && config !== null ? config as Record<string, unknown> : {};
    return {
        type: typeof configRecord.type === 'string' ? configRecord.type : 'Signal',
        pair: typeof configRecord.pair === 'string' ? configRecord.pair : allPairsLabel,
    };
};

export const getStrategyMetrics = (strategy: Strategy): Partial<StrategyMetricsItem> => strategy.metrics?.all || {};

export const renderStrategyTypeBadge = (type: string, t: (key: string, fallback?: string) => string) => {
    const typeLower = type?.toLowerCase() || 'signal';
    switch (typeLower) {
        case 'grid':
            return <Badge className="bg-blue-500/10 text-blue-600 border-none shadow-none">{t('strategy_types.grid')}</Badge>;
        case 'signal':
            return <Badge className="bg-purple-500/10 text-purple-600 border-none shadow-none">{t('strategy_types.signal')}</Badge>;
        case 'trend':
            return <Badge className="bg-emerald-500/10 text-emerald-600 border-none shadow-none">{t('strategy_types.trend')}</Badge>;
        case 'dca':
            return <Badge className="bg-orange-500/10 text-orange-600 border-none shadow-none">{t('strategy_types.dca')}</Badge>;
        default:
            return <Badge variant="outline" className="text-slate-400 border-slate-200">{type}</Badge>;
    }
};

export const renderStrategyStatusBadge = (status: string, t: (key: string, fallback?: string) => string) => {
    switch (status) {
        case 'active':
            return (
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none px-3 py-1">
                    <Check className="w-3 h-3 mr-1.5" /> {t('admin:active', 'Active')}
                </Badge>
            );
        case 'inactive':
            return (
                <Badge variant="outline" className="text-slate-400 border-slate-200 px-3 py-1">
                    <Pause className="w-3 h-3 mr-1.5" /> {t('admin:inactive', 'Inactive')}
                </Badge>
            );
        case 'error':
        case 'frozen':
        case 'maintenance':
        case 'blocked':
        case 'paused':
            return (
                <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none px-3 py-1">
                    <AlertTriangle className="w-3 h-3 mr-1.5" /> {t(`strategies:detail.status_${status}`, status)}
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="text-slate-400 border-slate-200 px-3 py-1">
                    {t(`strategies:detail.status_${status}`, status)}
                </Badge>
            );
    }
};

export const renderPercentMetric = (value?: number) => {
    if (value === undefined || value === null) {
        return <span className="text-slate-300">--</span>;
    }
    const color = value > 0 ? 'text-emerald-500' : value < 0 ? 'text-rose-500' : 'text-slate-400';
    return (
        <span className={cn('font-bold text-sm', color)}>
            {value > 0 ? '+' : ''}
            {value.toFixed(2)}%
        </span>
    );
};

export const createSecretExample = (secret: StrategyWebhookSecretResponse | null) => `{
  "secret": "${secret?.secret || 'YOUR_SECRET_KEY'}",
  "strategy_key": "YOUR_STRATEGY_KEY",
  "symbol": "{{ticker}}",
  "side": "buy",
  "action": "open"
}`;
