import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/use-auth';
import { useLoginCardModel } from '@/components/login-card/hooks/useLoginCardModel';
import { persistAuth } from '@/lib/auth-storage';
import ProtectedRoute from './ProtectedRoute';

const mocks = vi.hoisted(() => ({ profile: vi.fn(), login: vi.fn() }));
vi.mock('@/api', () => ({ authApi: { getProfile: mocks.profile, login: mocks.login } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
const clients: QueryClient[] = [];
function PrivatePage() {
  const auth = useAuth();
  const location = useLocation();
  return <><p>{location.pathname}</p><p>{auth.user?.email}</p><button onClick={auth.logout}>Sign out</button></>;
}
function LoginPage() {
  const model = useLoginCardModel();
  const location = useLocation();
  return <><p data-testid="return-path">{location.state?.from?.pathname ?? 'none'}</p><form onSubmit={model.handleSubmit}>
    <input aria-label="email" value={model.email} onChange={event => model.setEmail(event.target.value)} />
    <input aria-label="password" value={model.password} onChange={event => model.setPassword(event.target.value)} />
    <button type="submit">Sign in</button>
  </form></>;
}
function renderRoutes() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  client.setQueryData(['private-data'], { owner: 'A' });
  render(<QueryClientProvider client={client}><AuthProvider><MemoryRouter initialEntries={['/strategies/17']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
    <Route path="/strategies/:id" element={<ProtectedRoute><PrivatePage /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><PrivatePage /></ProtectedRoute>} />
    <Route path="/login" element={<LoginPage />} />
  </Routes></MemoryRouter></AuthProvider></QueryClientProvider>);
  return client;
}
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); mocks.profile.mockReset(); mocks.login.mockReset();
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()); });

describe('protected route lifecycle', () => {
  it('does not render a private page while the saved token is being checked', () => {
    persistAuth({ id: '1', username: 'A', email: 'a@example.com', is_admin: true }, 'a-token', true);
    mocks.profile.mockReturnValue(new Promise(() => {}));
    renderRoutes();
    expect(screen.queryByText('a@example.com')).toBeNull();
    expect(screen.queryByText('Sign out')).toBeNull();
    expect(screen.queryByText('Sign in')).toBeNull();
  });

  it('offers retry after a verification outage and then renders the verified identity', async () => {
    localStorage.setItem('auth_token', 'a-token');
    mocks.profile.mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ id: 1, email: 'a@example.com' });
    renderRoutes();
    await screen.findByText('session_validation_failed');
    expect(screen.queryByText('/strategies/17')).toBeNull();
    fireEvent.click(screen.getByText('session_retry'));
    await screen.findByText('a@example.com');
  });

  it('drops the prior private return path and cache before the next user signs in', async () => {
    persistAuth({ id: '1', username: 'A', email: 'a@example.com' }, 'a-token', true);
    mocks.profile.mockImplementation((token: string) => Promise.resolve(token === 'a-token'
      ? { id: 1, email: 'a@example.com', full_name: 'A' }
      : { id: 2, email: 'b@example.com', full_name: 'B' }));
    mocks.login.mockResolvedValue({ access_token: 'b-token' });
    const client = renderRoutes();
    await screen.findByText('a@example.com');
    client.setQueryData(['private-data'], { owner: 'A' });
    fireEvent.click(screen.getByText('Sign out'));
    await screen.findByText('Sign in');
    expect(screen.getByTestId('return-path').textContent).toBe('none');
    expect(client.getQueryData(['private-data'])).toBeUndefined();
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'b@example.com' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'test-password' } });
    fireEvent.click(screen.getByText('Sign in'));
    await screen.findByText('b@example.com');
    expect(screen.getByText('/dashboard')).toBeDefined();
    expect(screen.queryByText('/strategies/17')).toBeNull();
  });
});
