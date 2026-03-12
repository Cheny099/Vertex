import type { JsonObject } from './contracts';
import type { StrategyMetricsItem } from './types';
import { isRecord, toFiniteNumber } from './guards';

export function normalizeMetricItem(raw: unknown): StrategyMetricsItem {
    const obj = isRecord(raw) ? raw : {};
    const return_pct = toFiniteNumber(obj.return_pct) ?? 0;
    const win_rate = toFiniteNumber(obj.win_rate) ?? 0;
    const max_drawdown_pct = toFiniteNumber(obj.max_drawdown_pct) ?? 0;
    const profit_factor = toFiniteNumber(obj.profit_factor);
    // Keep backend ratio as-is. Do not auto-convert 0~1 to 0~100 in frontend.
    return {
        return_pct,
        win_rate,
        max_drawdown_pct,
        profit_factor: profit_factor === null ? null : profit_factor,
    };
}

export function normalizeMetrics(raw: unknown): Record<string, StrategyMetricsItem> {
    if (!isRecord(raw)) {
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

    return out;
}

export function parseStrategyConfig(raw: unknown): JsonObject {
    if (!raw) return {};
    if (isRecord(raw)) return raw as JsonObject;
    if (typeof raw !== 'string') return {};
    if (raw === 'string') return {}; // Compatible with swagger mock / dirty data
    try {
        const obj: unknown = JSON.parse(raw);
        return isRecord(obj) ? (obj as JsonObject) : {};
    } catch {
        return {};
    }
}
