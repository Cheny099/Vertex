import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStrategyDetailModel } from './useStrategyDetailModel';

const mocks = vi.hoisted(() => ({
  auth: { user: { can_subscribe: false }, isAdmin: false } as {
    user: { can_subscribe: boolean } | null;
    isAdmin: boolean;
  },
}));

vi.mock('@/hooks/use-auth', () => ({ useAuth: () => mocks.auth }));
vi.mock('@/hooks/use-page-visibility', () => ({ usePageVisibility: () => true }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '5' }),
  useNavigate: () => vi.fn(),
}));

// The two composed hooks reach the network; only their shape matters here.
vi.mock('./useStrategyDetailQueries', () => ({
  useStrategyDetailQueries: () => ({ accounts: [], fixedAmountMax: null, availableMargin: null }),
}));
vi.mock('./useStrategySubscriptionActions', () => ({
  useStrategySubscriptionActions: () => ({}),
}));

describe('handleAddSub access gate', () => {
  beforeEach(() => {
    mocks.auth = { user: { can_subscribe: false }, isAdmin: false };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('opens the invite modal for a user without invite access', () => {
    const { result } = renderHook(() => useStrategyDetailModel());

    act(() => result.current.handleAddSub());

    expect(result.current.isInviteModalOpen).toBe(true);
    expect(result.current.isAddSubOpen).toBe(false);
  });

  it('does not treat a click event as the force flag', () => {
    // The "+" button in the subscription card was wired point-free, so React handed this a
    // MouseEvent. A truthiness test read that as force=true and opened the full dialog for a user
    // with no invite; they filled it in and were refused by the server, losing every field.
    const { result } = renderHook(() => useStrategyDetailModel());

    act(() => result.current.handleAddSub({ type: 'click', preventDefault() {} }));

    expect(result.current.isInviteModalOpen).toBe(true);
    expect(result.current.isAddSubOpen).toBe(false);
  });

  it('still forces for a literal true', () => {
    // What the invite modal's onSuccess passes once a code has been redeemed.
    const { result } = renderHook(() => useStrategyDetailModel());

    act(() => result.current.handleAddSub(true));

    expect(result.current.isAddSubOpen).toBe(true);
    expect(result.current.isInviteModalOpen).toBe(false);
  });

  it('lets an admin and an invited user through without forcing', () => {
    mocks.auth = { user: { can_subscribe: true }, isAdmin: false };
    const invited = renderHook(() => useStrategyDetailModel());
    act(() => invited.result.current.handleAddSub());
    expect(invited.result.current.isAddSubOpen).toBe(true);
    invited.unmount();

    mocks.auth = { user: { can_subscribe: false }, isAdmin: true };
    const admin = renderHook(() => useStrategyDetailModel());
    act(() => admin.result.current.handleAddSub());
    expect(admin.result.current.isAddSubOpen).toBe(true);
  });
});
