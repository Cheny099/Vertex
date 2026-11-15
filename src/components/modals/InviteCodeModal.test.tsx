import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { InviteCodeModal } from './InviteCodeModal';

const mocks = vi.hoisted(() => ({ redeem: vi.fn(), update: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/api', () => ({ authApi: { redeemInvite: mocks.redeem } }));
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ updateUser: mocks.update }) }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
let client: QueryClient;
const props = { open: true, onOpenChange: vi.fn(), onSuccess: vi.fn() };
beforeEach(() => { client = new QueryClient(); vi.clearAllMocks(); mocks.redeem.mockReset(); localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { cleanup(); client.clear(); localStorage.clear(); });
function view(open = true) { return <QueryClientProvider client={client}><InviteCodeModal {...props} open={open} /></QueryClientProvider>; }
function submit() {
  fireEvent.change(screen.getByLabelText('Invite Code'), { target: { value: 'fixture-code' } });
  const form = screen.getByLabelText('Invite Code').closest('form')!;
  act(() => { fireEvent.submit(form); fireEvent.submit(form); });
}

it.each(['close', 'session'])('ignores a late redemption after %s changes', async reason => {
  let resolve!: (value: unknown) => void;
  mocks.redeem.mockReturnValue(new Promise(done => { resolve = done; }));
  const mounted = render(view());
  submit();
  await waitFor(() => expect(mocks.redeem).toHaveBeenCalledTimes(1));
  if (reason === 'close') mounted.rerender(view(false));
  else localStorage.setItem('auth_token', 'different-session');
  await act(async () => resolve({ can_subscribe: true, channel: 'fixture' }));
  expect(mocks.update).not.toHaveBeenCalled();
  expect(props.onSuccess).not.toHaveBeenCalled();
  expect(mocks.success).not.toHaveBeenCalled();
});

it('can redeem a new code after closing an unresolved attempt and reopening', async () => {
  let resolveOld!: (value: unknown) => void;
  mocks.redeem.mockReturnValueOnce(new Promise(done => { resolveOld = done; }))
    .mockResolvedValue({ can_subscribe: true, channel: 'new' });
  const mounted = render(view()); submit();
  await waitFor(() => expect(mocks.redeem).toHaveBeenCalledTimes(1));
  mounted.rerender(view(false)); mounted.rerender(view()); submit();
  await waitFor(() => expect(mocks.update).toHaveBeenCalledExactlyOnceWith({ can_subscribe: true, invite_channel: 'new' }));
  await act(async () => resolveOld({ can_subscribe: true, channel: 'old' }));
  expect(mocks.update).toHaveBeenCalledTimes(1);
  expect(props.onSuccess).toHaveBeenCalledTimes(1);
});
