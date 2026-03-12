/**
 * @anchor-id API_CLIENT
 * @module-type api
 * @disposable false
 * @description API client - fully connected to backend (/api/v1)
 */

import { request, translateBackendErrorMessage } from './core';
import { adminApi } from './admin';
import { strategyApi, publicApi } from './strategy-api';
import { accountApi, authApi, userApi } from './auth-account-user';
import { announcementApi, legalApi } from './content-api';
import { marketApi, orderApi, signalApi, tradeApi, turboflowApi, webhookEventsApi } from './trading-api';
import { dashboardApi, leaderboardApi } from './stats-api';
export * from './types';
export { translateBackendErrorMessage } from './core';
export { adminApi };
export { strategyApi, publicApi };
export { authApi, accountApi, userApi };
export { announcementApi, legalApi };
export { orderApi, tradeApi, turboflowApi, marketApi, signalApi, webhookEventsApi };
export { dashboardApi, leaderboardApi };
export type { LeaderboardItem, LeaderboardResponse } from './stats-api';
export type { AuthCredentials, AuthResponse } from './auth-account-user';
export { getStrategySchema, strategySchema } from './strategy-schema';
export type { StrategyFormData } from './strategy-schema';
import {
    Strategy,
    Position,
    TickerData,
    Subscription,
    SubscriptionCreateDto,
    ExchangeMetaResponse, // Imported
    // Phase 6 types
    PeriodKey,
} from './types';

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
        const payload: Partial<SubscriptionCreateDto> = {
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

