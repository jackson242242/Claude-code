import { ApiError } from '@/services/api';
import { clearKeys, isSessionGoneError } from '@/lib/session';

describe('isSessionGoneError (S1)', () => {
  it('treats a 404 ApiError as a gone session', () => {
    expect(isSessionGoneError(new ApiError('Game not found', 'not_found', 404))).toBe(true);
  });

  it('does not treat other statuses as gone', () => {
    expect(isSessionGoneError(new ApiError('bad', 'invalid', 400))).toBe(false);
    expect(isSessionGoneError(new ApiError('boom', 'server', 500))).toBe(false);
  });

  it('ignores plain errors and non-errors', () => {
    expect(isSessionGoneError(new Error('offline'))).toBe(false);
    expect(isSessionGoneError('Game not found')).toBe(false);
    expect(isSessionGoneError(null)).toBe(false);
  });
});

describe('clearKeys (S1)', () => {
  it('removes every listed key from localStorage', () => {
    window.localStorage.setItem('skyempire.gameId', 'g1');
    window.localStorage.setItem('skyempire.matchCode', 'ABC123');
    window.localStorage.setItem('keep', 'me');

    clearKeys(['skyempire.gameId', 'skyempire.matchCode']);

    expect(window.localStorage.getItem('skyempire.gameId')).toBeNull();
    expect(window.localStorage.getItem('skyempire.matchCode')).toBeNull();
    expect(window.localStorage.getItem('keep')).toBe('me');
  });
});
