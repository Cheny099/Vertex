import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { StrictMode, useEffect, useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/use-auth';
import { useLoginCardModel } from './useLoginCardModel';

const mocks = vi.hoisted(() => ({ login: vi.fn(), otp: vi.fn(), profile: vi.fn(), toast: vi.fn() }));
vi.mock('@/api', () => ({ authApi: { login: mocks.login, loginWithCode: mocks.otp, getProfile: mocks.profile } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); Object.values(mocks).forEach(mock => mock.mockReset());
  mocks.profile.mockImplementation((token: string) => Promise.resolve({ id: token === 'a-token' ? 1 : 2, email: token === 'a-token' ? 'a@example.com' : 'b@example.com' }));
});
afterEach(() => { cleanup(); client.clear(); localStorage.clear(); sessionStorage.clear(); });

function Form({ email }: { email: string }) {
  const model = useLoginCardModel();
  const { setEmail, setPassword } = model;
  useEffect(() => { setEmail(email); setPassword('test-password'); }, [email, setEmail, setPassword]);
  return <form onSubmit={model.handleSubmit}>
    <button type="submit">Login {email}</button>
    <button type="button" onClick={model.toggleLoginMode}>Toggle mode</button>
    <input aria-label="code" value={model.code} onChange={e => model.setCode(e.target.value)} />
    <p>{model.isLoading ? 'submitting' : 'idle'}</p>
  </form>;
}
function Page() {
  const [email, setEmail] = useState('a@example.com');
  const auth = useAuth();
  const location = useLocation();
  return <><p data-testid="identity">{auth.user?.email ?? 'anonymous'}</p><p data-testid="path">{location.pathname}</p>
    <button onClick={() => setEmail('b@example.com')}>Remount for B</button>
    <button onClick={auth.logout}>Logout</button>
    <Form key={email} email={email} />
  </>;
}
function renderPage() {
  return render(<StrictMode><QueryClientProvider client={client}><MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider><Page /></AuthProvider>
  </MemoryRouter></QueryClientProvider></StrictMode>);
}

it.each(['credentials', 'profile'])('discards unmounted login A at the %s stage after B signs in', async stage => {
  let resolveA!: (value: unknown) => void;
  mocks.login.mockImplementation(({ username }: { username: string }) => username === 'a@example.com' && stage === 'credentials'
    ? new Promise(resolve => { resolveA = resolve; })
    : Promise.resolve({ access_token: username === 'a@example.com' ? 'a-token' : 'b-token' }));
  if (stage === 'profile') mocks.profile.mockImplementation((token: string) => token === 'a-token'
    ? new Promise(resolve => { resolveA = resolve; }) : Promise.resolve({ id: 2, email: 'b@example.com' }));
  renderPage();
  fireEvent.click(screen.getByText('Login a@example.com'));
  if (stage === 'profile') await waitFor(() => expect(mocks.profile).toHaveBeenCalled());
  const signal = mocks.login.mock.calls[0][1] as AbortSignal;
  fireEvent.click(screen.getByText('Remount for B'));
  expect(signal.aborted).toBe(true);
  fireEvent.click(screen.getByText('Login b@example.com'));
  await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('b@example.com'));
  await act(async () => resolveA(stage === 'credentials' ? { access_token: 'a-token' } : { id: 1, email: 'a@example.com' }));
  expect(screen.getByTestId('identity').textContent).toBe('b@example.com');
  expect(localStorage.getItem('auth_token')).toBe('b-token');
  expect(mocks.toast).toHaveBeenCalledTimes(1);
});

it('does not establish a session or navigate after explicit logout during login', async () => {
  let resolve!: (value: unknown) => void;
  mocks.login.mockReturnValue(new Promise(done => { resolve = done; }));
  renderPage();
  fireEvent.click(screen.getByText('Login a@example.com'));
  fireEvent.click(screen.getByText('Logout'));
  await act(async () => resolve({ access_token: 'a-token' }));
  expect(screen.getByTestId('identity').textContent).toBe('anonymous');
  expect(screen.getByTestId('path').textContent).toBe('/login');
  expect(localStorage.getItem('auth_token')).toBeNull();
  expect(mocks.profile).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
});

it('does not overwrite a new cross-tab session even before its storage event arrives', async () => {
  let resolve!: (value: unknown) => void;
  mocks.login.mockReturnValue(new Promise(done => { resolve = done; }));
  renderPage();
  fireEvent.click(screen.getByText('Login a@example.com'));
  localStorage.setItem('auth_token', 'b-token');
  await act(async () => resolve({ access_token: 'a-token' }));
  expect(localStorage.getItem('auth_token')).toBe('b-token');
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token' })));
  await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('b@example.com'));
  expect(mocks.toast).not.toHaveBeenCalled();
});

it('prevents same-render duplicate submissions and supports a new attempt after rejection', async () => {
  let reject!: (error: unknown) => void;
  mocks.login.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; })).mockResolvedValue({ access_token: 'a-token' });
  renderPage();
  act(() => { fireEvent.click(screen.getByText('Login a@example.com')); fireEvent.click(screen.getByText('Login a@example.com')); });
  expect(mocks.login).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('Invalid credentials')));
  fireEvent.click(screen.getByText('Login a@example.com'));
  await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('a@example.com'));
  expect(mocks.login).toHaveBeenCalledTimes(2);
});

it('invalidates a pending password login when switching to OTP', async () => {
  let resolvePassword!: (value: unknown) => void;
  mocks.login.mockReturnValue(new Promise(resolve => { resolvePassword = resolve; }));
  mocks.otp.mockResolvedValue({ access_token: 'b-token' });
  renderPage();
  fireEvent.click(screen.getByText('Login a@example.com'));
  fireEvent.click(screen.getByText('Toggle mode'));
  fireEvent.change(screen.getByLabelText('code'), { target: { value: '1234' } });
  fireEvent.click(screen.getByText('Login a@example.com'));
  await waitFor(() => expect(screen.getByTestId('identity').textContent).toBe('b@example.com'));
  await act(async () => resolvePassword({ access_token: 'a-token' }));
  expect(localStorage.getItem('auth_token')).toBe('b-token');
  expect(mocks.toast).toHaveBeenCalledTimes(1);
});
