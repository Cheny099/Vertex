export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface ApiError extends Error {
    status?: number | string;
    code?: string;
    detail?: unknown;
    raw?: unknown;
    last_error?: string | null;
}

export const createApiError = (message: string, extra?: Partial<ApiError>): ApiError => {
    const err = new Error(message) as ApiError;
    if (extra) {
        Object.assign(err, extra);
    }
    return err;
};
