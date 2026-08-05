import type { Strategy, StrategyCreatePayload, StrategyWebhookSecretResponse } from '@/api';

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

export const DEFAULT_STRATEGY_VALUES = {
    name: '',
    description: '',
    type: 'signal',
    pair: '',
    status: 'active',
    strategyKey: '',
} as const;

export type StrategyFormValues = {
    strategyKey?: string;
    name: string;
    description?: string;
    type?: string;
    pair?: string;
    status?: 'active' | 'inactive' | boolean;
};

export type StrategyMutationResult = Strategy & {
    webhookSecret?: StrategyWebhookSecretResponse;
};

export const buildGeneratedStrategyKey = () => `sk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export const toFinalStrategyStatus = (status?: 'active' | 'inactive' | boolean) =>
    status === 'active' || status === true ? 'active' : 'inactive';

export const buildStrategyPayload = ({
    form,
    isEditMode,
    initialConfig,
}: {
    form: StrategyFormValues;
    isEditMode: boolean;
    initialConfig?: Strategy['config'];
}): StrategyCreatePayload => {
    const { name, description, status, type, pair, strategyKey } = form;

    return {
        // The `||` generator is for create, where there is no key yet and minting one is the point.
        // In edit mode it was a trapdoor: clearing the field made this read "generate a replacement",
        // so an admin who emptied the box - to retype it, or by tabbing through - silently rotated a
        // live strategy's identity and broke every TradingView alert aimed at the old key, under a
        // success toast. Edit mode now sends what the form holds, and the schema refuses an empty one.
        strategy_key: isEditMode ? strategyKey ?? '' : strategyKey || buildGeneratedStrategyKey(),
        name,
        description,
        status: toFinalStrategyStatus(status),
        config: {
            ...(isEditMode && initialConfig && typeof initialConfig === 'object' ? initialConfig : {}),
            type: type || 'signal',
            pair: pair || '',
        },
    };
};

export const buildWebhookUrl = () => {
    const apiBase = (import.meta.env.VITE_API_URL as string)
        ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, '')
        : `${window.location.protocol}//${window.location.host}/api/v1`;
    return `${apiBase.replace(/\/api\/v1$/, '')}/api/v1/tradingview/webhook`;
};

export const buildWebhookJson = (webhookData: { secret: string; strategy_key: string } | null) => `{
  "secret": "${webhookData?.secret || ''}",
  "strategy_key": "${webhookData?.strategy_key || ''}",
  "symbol": "{{ticker}}",
  "side": "buy",
  "action": "open"
}`;
