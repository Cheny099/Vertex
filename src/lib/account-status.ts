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

export const normalizeStatusKey = (raw?: string | null): UiAccountStatusKey => {
  const status = String(raw || '').trim().toLowerCase();
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

