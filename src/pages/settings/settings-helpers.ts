import type { AccountStatusResponse } from '@/api';

import type { UiAccountStatusKey } from '@/lib/account-status';
export { normalizeStatusKey, type UiAccountStatusKey } from '@/lib/account-status';

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
