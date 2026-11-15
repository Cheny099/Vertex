import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnnouncementPopup from './AnnouncementPopup';
import { AuthContext, type AuthContextType } from '@/contexts/auth-context';

const mocks = vi.hoisted(() => ({ popup: vi.fn(), language: 'zh' }));
vi.mock('@/api', () => ({ announcementApi: { getPopup: mocks.popup } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: mocks.language } }) }));
function view(id: string) {
  const value: AuthContextType = {
    user: { id, email: `${id}@example.com`, username: id }, token: id, isAuthenticated: true,
    isAdmin: false, isLoading: false, validationFailed: false, preserveReturnTo: true,
    retryValidation: vi.fn(), login: vi.fn(), logout: vi.fn(), updateUser: vi.fn(),
  };
  return <AuthContext.Provider value={value}><AnnouncementPopup /></AuthContext.Provider>;
}
beforeEach(() => {
  localStorage.clear(); mocks.popup.mockReset(); mocks.language = 'zh';
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('announcement dismissal scope', () => {
  it('does not let a dismissal by A hide the same notice from B', async () => {
    mocks.popup.mockResolvedValue({ id: 99, title: 'Notice', content_md: 'Body' });
    const rendered = render(view('A'));
    await screen.findByText('Notice');
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(localStorage.getItem('vertex_popup_dismissed_A_zh')).toBe('99');
    rendered.rerender(view('B'));
    await screen.findByText('Notice');
    expect(localStorage.getItem('vertex_popup_dismissed_B_zh')).toBeNull();
    rendered.rerender(view('A'));
    await waitFor(() => expect(mocks.popup).toHaveBeenCalledTimes(3));
    expect(screen.queryByText('Notice')).toBeNull();
  });

  it('discards an in-flight popup when the user or language changes', async () => {
    let resolveOld!: (value: unknown) => void;
    mocks.popup.mockImplementation((language: string) => language === 'zh'
      ? new Promise(resolve => { resolveOld = resolve; })
      : Promise.resolve({ id: 100, title: 'New notice', content_md: 'New body' }));
    const rendered = render(view('A'));
    await waitFor(() => expect(mocks.popup).toHaveBeenCalledWith('zh'));
    mocks.language = 'en';
    rendered.rerender(view('B'));
    await screen.findByText('New notice');
    await act(async () => resolveOld({ id: 99, title: 'Stale notice' }));
    expect(screen.queryByText('Stale notice')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(localStorage.getItem('vertex_popup_dismissed_B_en')).toBe('100');
    expect(localStorage.getItem('vertex_popup_dismissed_A_zh')).toBeNull();
  });
});
