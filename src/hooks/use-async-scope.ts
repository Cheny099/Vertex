import { useCallback, useLayoutEffect, useRef } from 'react';
import { getStoredAuthToken } from '@/lib/auth-storage';

export type IsCurrent = () => boolean;

/** Async results belong to the initiating view and session, including queued storage events.
 * Invalidating a scope suppresses client side effects; it does not undo a server operation.
 */
export function useAsyncScope(key: string | number = '') {
  const mounted = useRef(false);
  const generation = useRef(0);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current += 1; };
  }, [key]);
  const invalidate = useCallback(() => { generation.current += 1; }, []);
  const capture = useCallback((): IsCurrent => {
    const attempt = generation.current;
    const token = getStoredAuthToken();
    return () => mounted.current && attempt === generation.current && token === getStoredAuthToken();
  }, []);
  return { capture, invalidate };
}
