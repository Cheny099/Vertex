import { describe, expect, it } from 'vitest';
import { closePositionRequest, type CloseParams } from './close-position';

const form: CloseParams = { account_id: '7', symbol: ' btcusdt ', pos_side: 'long', mode: 'quantity', qty: '2.5', reason: 'close' };
describe('force close intent', () => {
  it('sends an exact positive quantity only for quantity mode', () => {
    expect(closePositionRequest(form)).toEqual({ account_id: 7, symbol: 'BTCUSDT', pos_side: 'long', qty: 2.5, reason: 'close' });
  });
  it.each(['', '0', '-1', 'NaN', 'Infinity', '2btc'])('does not turn invalid quantity %s into a full close', qty => {
    expect(closePositionRequest({ ...form, qty })).toBeNull();
  });
  it.each(['', '0', '-1', '1.5', '7junk', '9007199254740993'])('does not coerce invalid account %s to another account', account_id => {
    expect(closePositionRequest({ ...form, account_id })).toBeNull();
  });
  it('omits quantity only when full close is explicitly selected', () => {
    expect(closePositionRequest({ ...form, mode: 'all', qty: '' })).toEqual({ account_id: 7, symbol: 'BTCUSDT', pos_side: 'long', reason: 'close' });
    expect(closePositionRequest({ ...form, mode: 'all', qty: '99' })).not.toHaveProperty('qty');
  });
  it('rejects a whitespace-only symbol', () => {
    expect(closePositionRequest({ ...form, symbol: '   ' })).toBeNull();
  });
});
