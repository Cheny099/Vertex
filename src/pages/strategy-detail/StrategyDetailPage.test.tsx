import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import type { Subscription } from '@/api';
import StrategyDetailRoute from './StrategyDetailPage';

const mocks = vi.hoisted(() => ({ update: vi.fn(), success: vi.fn() }));
vi.mock('@/api', () => ({ subscriptionApi: { update: mocks.update } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: vi.fn() } }));
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: { can_subscribe: true }, isAdmin: false }) }));
vi.mock('@/hooks/use-page-visibility', () => ({ usePageVisibility: () => false }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('./hooks/useStrategyDetailQueries', () => ({ useStrategyDetailQueries: ({ strategyId }: { strategyId: number }) => ({
  strategy: { id: strategyId, strategy_key: `strategy-${strategyId}`, name: `Strategy ${strategyId}` },
  subscriptions: [{ id: 11, strategy_id: strategyId, account_id: 7, position_mode: 'fixed_amount', position_value: 100, leverage: 50 }],
  accounts: [], fixedAmountMax: null, parsedConfig: {}, displayParams: [],
}) }));
vi.mock('./components/StrategyDetailHeader', () => ({ StrategyDetailHeader: ({ strategy }: { strategy: { name: string } }) => <h1>{strategy.name}</h1> }));
vi.mock('./components/StrategyPeriodMetrics', () => ({ StrategyPeriodMetrics: () => null }));
vi.mock('./components/StrategyConfigWebhookPanel', () => ({ StrategyConfigWebhookPanel: () => null }));
vi.mock('./components/StrategyMainInfoGrid', () => ({ StrategyMainInfoGrid: ({ subscriptions, onEditSub }: { subscriptions: Subscription[]; onEditSub: (sub: Subscription) => void }) => <button onClick={() => onEditSub(subscriptions[0])}>Edit subscription</button> }));
vi.mock('./components/StrategySubscriptionDialog', () => ({ StrategySubscriptionDialog: ({ open, onSubmit }: { open: boolean; onSubmit: () => void }) => open ? <button onClick={onSubmit}>Save subscription</button> : null }));
vi.mock('@/components/modals/InviteCodeModal', () => ({ InviteCodeModal: () => null }));
vi.mock('@/components/strategies/WebhookSecretDialog', () => ({ WebhookSecretDialog: () => null }));
vi.mock('@/components/RiskDisclosureDialog', () => ({ default: () => null }));
const client = new QueryClient();
afterEach(() => { cleanup(); client.clear(); vi.clearAllMocks(); });

it('starts a fresh editor when the route changes and ignores the previous route’s save result', async () => {
  let resolve!: (value: unknown) => void;
  mocks.update.mockReturnValue(new Promise(done => { resolve = done; }));
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/strategies/5']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Link to="/strategies/6">Next strategy</Link>
    <Routes><Route path="/strategies/:id" element={<StrategyDetailRoute />} /></Routes>
  </MemoryRouter></QueryClientProvider>);
  fireEvent.click(screen.getByText('Edit subscription'));
  fireEvent.click(screen.getByText('Save subscription'));
  expect(mocks.update.mock.calls[0][0]).toBe(11);
  fireEvent.click(screen.getByText('Next strategy'));
  await screen.findByText('Strategy 6');
  expect(screen.queryByText('Save subscription')).toBeNull();
  await act(async () => resolve({ id: 11 }));
  expect(mocks.success).not.toHaveBeenCalled();
});
