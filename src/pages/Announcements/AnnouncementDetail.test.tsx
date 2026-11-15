import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnnouncementDetail from './AnnouncementDetail';

const mocks = vi.hoisted(() => ({ detail: vi.fn(), language: 'en' }));
vi.mock('@/api', () => ({ announcementApi: { get: mocks.detail } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: mocks.language } }) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
function view() {
  return <MemoryRouter initialEntries={['/announcements/7']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes><Route path="/announcements/:id" element={<AnnouncementDetail />} /></Routes>
  </MemoryRouter>;
}
beforeEach(() => { mocks.detail.mockReset(); mocks.language = 'en'; });
afterEach(cleanup);
describe('announcement detail states', () => {
  it('shows original-language content and a notice without fabricating a publication date', async () => {
    mocks.detail.mockResolvedValue({ id: 7, title: 'Original title', lang: 'zh', content: 'Original body' });
    render(view());
    await screen.findByText('Original title');
    expect(screen.getByText('Original body')).toBeDefined();
    expect(screen.getByText('announcements:original_language')).toBeDefined();
    expect(screen.queryByText('Invalid Date')).toBeNull();
  });
  it('localizes a genuine missing announcement instead of exposing raw backend English', async () => {
    mocks.language = 'zh';
    mocks.detail.mockRejectedValue(Object.assign(new Error('Announcement not found'), { status: 404 }));
    render(view());
    await screen.findByText('announcements:not_found');
    expect(screen.queryByText('Announcement not found')).toBeNull();
  });
});
