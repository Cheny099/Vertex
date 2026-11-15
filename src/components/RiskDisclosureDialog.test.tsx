import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import RiskDisclosureDialog from './RiskDisclosureDialog';

const mocks = vi.hoisted(() => ({ get: vi.fn(), accept: vi.fn(), success: vi.fn(), error: vi.fn(), language: 'en' }));
vi.mock('@/api', () => ({ legalApi: { getPublicDoc: mocks.get, accept: mocks.accept } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: mocks.language } }) }));
const props = { open: true, docKey: 'auto_trade_notice' as const, requiredVersion: '1', onOpenChange: vi.fn(), onAccept: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks(); mocks.language = 'en';
  mocks.get.mockReset().mockResolvedValue({ key: 'auto_trade_notice', version: '1', content_md: 'Document one' });
  mocks.accept.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);
async function agree() {
  await screen.findByText('Document one');
  await waitFor(() => expect(screen.getByRole('checkbox').hasAttribute('disabled')).toBe(false));
  fireEvent.click(screen.getByRole('checkbox'));
}

it('requires fresh consent after closing and reopening the disclosure', async () => {
  const view = render(<RiskDisclosureDialog {...props} />);
  await agree();
  view.rerender(<RiskDisclosureDialog {...props} open={false} />);
  view.rerender(<RiskDisclosureDialog {...props} />);
  await screen.findByText('Document one');
  expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('false');
  expect((screen.getByRole('button', { name: 'legal:accept_and_continue' }) as HTMLButtonElement).disabled).toBe(true);
});

it('cannot accept a required version whose content was not loaded', async () => {
  mocks.get.mockResolvedValue({ key: 'auto_trade_notice', version: '2', content_md: 'Document two' });
  render(<RiskDisclosureDialog {...props} />);
  await waitFor(() => expect(screen.queryByRole('alert') || !screen.getByRole('checkbox').hasAttribute('disabled')).toBeTruthy());
  const checkbox = screen.queryByRole('checkbox');
  if (checkbox) fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole('button', { name: 'legal:accept_and_continue' }));
  expect(mocks.accept).not.toHaveBeenCalled();
});

it('accepts the displayed version and continues once', async () => {
  render(<RiskDisclosureDialog {...props} />);
  await agree();
  fireEvent.click(screen.getByRole('button', { name: 'legal:accept_and_continue' }));
  await waitFor(() => expect(props.onAccept).toHaveBeenCalledTimes(1));
  expect(mocks.accept).toHaveBeenCalledExactlyOnceWith('auto_trade_notice', '1');
  expect(props.onOpenChange).toHaveBeenCalledWith(false);
});

it('preserves reading progress during parent polling but resets on a language change', async () => {
  const view = render(<RiskDisclosureDialog {...props} />);
  await agree();
  view.rerender(<RiskDisclosureDialog {...props} onOpenChange={vi.fn()} />);
  expect(mocks.get).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true');
  mocks.language = 'zh';
  view.rerender(<RiskDisclosureDialog {...props} />);
  await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
  expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('false');
});

it('keeps signing disabled after a document load failure', async () => {
  mocks.get.mockRejectedValue(new Error('offline'));
  render(<RiskDisclosureDialog {...props} />);
  expect((await screen.findByRole('alert')).textContent).toBe('common:error_load_failed');
  expect((screen.getByRole('button', { name: 'legal:accept_and_continue' }) as HTMLButtonElement).disabled).toBe(true);
});

it('ignores acceptance completion after the dialog has closed', async () => {
  let resolve!: () => void;
  mocks.accept.mockReturnValue(new Promise<void>(done => { resolve = done; }));
  const view = render(<RiskDisclosureDialog {...props} />);
  await agree();
  fireEvent.click(screen.getByRole('button', { name: 'legal:accept_and_continue' }));
  view.rerender(<RiskDisclosureDialog {...props} open={false} />);
  await act(async () => resolve());
  expect(props.onAccept).not.toHaveBeenCalled();
  expect(mocks.success).not.toHaveBeenCalled();
});

it('reloads and clears consent when the required document version changes', async () => {
  const view = render(<RiskDisclosureDialog {...props} />);
  await agree();
  mocks.get.mockResolvedValue({ key: 'auto_trade_notice', version: '2', content_md: 'Document two' });
  view.rerender(<RiskDisclosureDialog {...props} requiredVersion="2" />);
  await screen.findByText('Document two');
  expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('false');
});
