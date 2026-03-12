import type { AccountStatusResponse } from '@/api';

export type UiAccountStatusKey =
  | 'ok'
  | 'need_login'
  | 'need_verify'
  | 'not_ready'
  | 'uid_mismatch'
  | 'config_missing'
  | 'disabled'
  | 'inactive'
  | 'unknown_exchange'
  | 'unknown';

export const LIMIT_TF = 3;
export const LIMIT_OTHER = 10;

export const normalizeStatusKey = (raw?: string | null): UiAccountStatusKey => {
  const status = String(raw || '').toLowerCase();
  if (status === 'ok' || status === 'connected' || status === 'api_ready' || status === 'apiready') return 'ok';
  if (status === 'need_login') return 'need_login';
  if (status === 'need_verify') return 'need_verify';
  if (
    status === 'not_ready' ||
    status === 'error' ||
    status === 'failed' ||
    status === 'expired' ||
    status === 'session_busy' ||
    status === 'profile_locked'
  ) {
    return 'not_ready';
  }
  if (status === 'uid_mismatch') return 'uid_mismatch';
  if (status === 'config_missing') return 'config_missing';
  if (status === 'disabled') return 'disabled';
  if (status === 'inactive') return 'inactive';
  if (status === 'unknown_exchange') return 'unknown_exchange';
  return 'unknown';
};

export const getStatusBadgeClass = (status: UiAccountStatusKey): string => {
  switch (status) {
    case 'ok':
      return 'bg-profit/10 text-profit border-profit/20';
    case 'need_login':
    case 'need_verify':
    case 'not_ready':
    case 'config_missing':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'uid_mismatch':
    case 'disabled':
    case 'unknown_exchange':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'inactive':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

export type SettingsStatusMap = Map<number, AccountStatusResponse>;
