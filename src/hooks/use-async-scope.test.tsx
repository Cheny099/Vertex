import { act, cleanup, renderHook } from '@testing-library/react';
import { StrictMode, type PropsWithChildren } from 'react';
import { afterEach, expect, it } from 'vitest';
import { useAsyncScope } from './use-async-scope';
const wrapper = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>;
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); });

it('never reactivates an earlier request when a view key changes away and back', () => {
  const { result, rerender, unmount } = renderHook(key => useAsyncScope(key), { wrapper, initialProps: 'a' });
  const old = result.current.capture();
  expect(old()).toBe(true);
  rerender('b'); rerender('a');
  expect(old()).toBe(false);
  const current = result.current.capture();
  expect(current()).toBe(true);
  unmount();
  expect(current()).toBe(false);
});

it('invalidates immediately on cancellation or token replacement without waiting for a storage event', () => {
  const { result } = renderHook(() => useAsyncScope(), { wrapper });
  const cancelled = result.current.capture();
  act(() => result.current.invalidate());
  expect(cancelled()).toBe(false);
  const beforeLogin = result.current.capture();
  localStorage.setItem('auth_token', 'replacement-token');
  expect(beforeLogin()).toBe(false);
});
