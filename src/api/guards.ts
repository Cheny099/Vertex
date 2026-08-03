// Arrays are `typeof 'object'` too, so they must be excluded explicitly: every caller
// here means "a plain keyed object", and an array slipping through gets stringified or
// cast to JsonObject downstream.
export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const isString = (value: unknown): value is string =>
    typeof value === 'string';

export const toFiniteNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : null;
};
