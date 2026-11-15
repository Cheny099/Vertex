import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { accountApi, authApi } from './auth-account-user';
import { adminOpsApi } from './admin/operations';

vi.mock('../i18n', () => ({ default: { exists: () => false, t: (key: string) => key } }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const account = { id: 7, name: 'test', exchange: 'week', type: 'real', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' };
const summary = { id: 12, account_id: 7, symbol: 'BTCUSDT', side: 'buy', status: 'COMPLETED', quantity: 2 };
function response(body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })));
}
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => vi.unstubAllGlobals());

describe('response boundaries', () => {
  it.each([{}, null, { items: [] }, [null], [{ ...account, id: 'bad' }]])('rejects malformed account lists with a protocol error', async body => {
    response(body);
    await expect(accountApi.list()).rejects.toMatchObject({ code: 'INVALID_API_RESPONSE' });
  });
  it('filters deleted accounts and preserves inactive accounts and numeric zero', async () => {
    response([{ ...account, is_active: false, equity: '0', last_error: null }, { ...account, id: 8, deleted_at: '2026-01-02' }]);
    const accounts = await accountApi.list();
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({ id: 7, is_active: false, equity: 0 });
  });
  it('accepts read-only exchanges not offered in the create form', async () => {
    response([{ ...account, exchange: 'binance' }]);
    await expect(accountApi.list()).resolves.toMatchObject([{ exchange: 'binance' }]);
  });
  it('rejects malformed identity/privilege data before it reaches the session', async () => {
    response({ id: 7, email: 'a@example.com', is_active: true, is_admin: 'false', created_at: '', updated_at: '' });
    await expect(authApi.getProfile()).rejects.toMatchObject({ code: 'INVALID_API_RESPONSE' });
  });
  it('accepts admin summaries without inventing execution fields', async () => {
    response({ items: [summary], total: 1 });
    const result = await adminOpsApi.listOrders({ page: 1, limit: 10 });
    expect(result.items[0]).toEqual(summary);
    expect(result.items[0]).not.toHaveProperty('executed_qty');
    expect(result.items[0]).not.toHaveProperty('executed_price');
  });
  it('reads execution price from the detail endpoint, preserving zero and null', async () => {
    response({ ...summary, executed_price: 0 });
    await expect(adminOpsApi.getOrder(12)).resolves.toMatchObject({ executed_price: 0 });
    response({ ...summary, executed_price: null });
    await expect(adminOpsApi.getOrder(12)).resolves.toMatchObject({ executed_price: null });
  });
  it('rejects invalid order detail instead of presenting it as a valid order', async () => {
    response({ ...summary, executed_price: 'not a price' });
    await expect(adminOpsApi.getOrder(12)).rejects.toMatchObject({ code: 'INVALID_API_RESPONSE' });
  });
});
