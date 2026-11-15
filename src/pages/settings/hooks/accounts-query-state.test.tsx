import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSettingsPageModel } from './useSettingsPageModel';
import { AccountsSection } from '../components/AccountsSection';

const mocks = vi.hoisted(() => ({ accounts: vi.fn(), profile: vi.fn(), status: vi.fn() }));
vi.mock('@/api', () => ({ accountApi: { list: mocks.accounts, getStatus: mocks.status }, userApi: { getProfile: mocks.profile } }));
vi.mock('@/hooks/use-theme', () => ({ useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: vi.fn() }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', exists: () => false } }) }));
let client: QueryClient;
const account = { id: 7, name: 'My existing account', exchange: 'week', type: 'real', is_active: true, created_at: '', updated_at: '' };
beforeEach(() => {
  Object.values(mocks).forEach(mock => mock.mockReset());
  mocks.profile.mockResolvedValue({ id: 7 }); mocks.status.mockResolvedValue({ status: 'ok' });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => { cleanup(); client.clear(); });
function Page() {
  const model = useSettingsPageModel();
  return <AccountsSection {...model.accountsSectionProps} />;
}
function renderPage() { render(<QueryClientProvider client={client}><Page /></QueryClientProvider>); }

it('renders an account query error, then retries successfully without showing a false empty state', async () => {
  mocks.accounts.mockRejectedValueOnce(Object.assign(new Error('Service unavailable'), { status: 503 })).mockResolvedValue([account]);
  renderPage();
  expect((await screen.findByRole('alert')).textContent).toContain('settings:accounts_load_failed');
  expect(screen.queryByText('settings:accounts.no_accounts')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'common:retry' }));
  await screen.findByText(account.name);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(mocks.accounts).toHaveBeenCalledTimes(2);
});

it('shows the empty state only after a successful empty response', async () => {
  mocks.accounts.mockResolvedValue([]);
  renderPage();
  await screen.findByText('settings:accounts.no_accounts');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('keeps cached accounts visible and identifies a failed refresh', async () => {
  mocks.accounts.mockResolvedValueOnce([account]).mockRejectedValue(new Error('offline'));
  renderPage();
  await screen.findByText(account.name);
  await act(async () => { await client.invalidateQueries({ queryKey: ['accounts'] }); });
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('settings:accounts_refresh_failed'));
  expect(screen.getByText(account.name)).toBeTruthy();
  expect(screen.queryByText('settings:accounts.no_accounts')).toBeNull();
});
