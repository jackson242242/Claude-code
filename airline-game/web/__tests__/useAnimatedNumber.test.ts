/**
 * useAnimatedNumber hook tests
 */

import { renderHook, act } from '@testing-library/react';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

describe('useAnimatedNumber', () => {
  it('1. returns target immediately if same value on init', () => {
    const { result } = renderHook(() => useAnimatedNumber(100));
    expect(result.current).toBe(100);
  });

  it('2. settles at target value after animation', async () => {
    // Use real RAF via jest's fake timers, or simply test settled state
    // by using a short duration and many RAF ticks
    const rafCallbacks: Array<(t: number) => void> = [];
    const mockRaf = jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      });
    jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);

    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useAnimatedNumber(target, 100),
      { initialProps: { target: 0 } },
    );

    expect(result.current).toBe(0);

    // Change target
    rerender({ target: 500 });

    // Drain RAF callbacks simulating many frames at "end" time (200ms > 100ms duration)
    act(() => {
      let time = 0;
      for (let frame = 0; frame < 20; frame++) {
        time += 20; // 20ms per frame
        const toFlush = rafCallbacks.splice(0);
        toFlush.forEach((cb) => cb(time));
      }
    });

    // After simulating 400ms at 100ms duration, should be settled at target
    expect(result.current).toBe(500);

    mockRaf.mockRestore();
  });

  it('3. progresses toward target during animation', () => {
    const rafCallbacks: Array<(t: number) => void> = [];
    const mockRaf = jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
      });
    jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);

    const { result, rerender } = renderHook(
      ({ target }: { target: number }) => useAnimatedNumber(target, 800),
      { initialProps: { target: 0 } },
    );

    rerender({ target: 1000 });

    // Simulate ~400ms of animation (half duration)
    act(() => {
      let time = 0;
      for (let frame = 0; frame < 20; frame++) {
        time += 20;
        const toFlush = rafCallbacks.splice(0);
        toFlush.forEach((cb) => cb(time));
      }
    });

    // At 400ms of 800ms duration, should have some progress (> 0)
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(1000);

    mockRaf.mockRestore();
  });

  it('4. no RAF call when target unchanged', () => {
    const mockRaf = jest.spyOn(globalThis, 'requestAnimationFrame');
    const callsBefore = mockRaf.mock.calls.length;

    const { result } = renderHook(() => useAnimatedNumber(42, 800));
    expect(result.current).toBe(42);

    // RAF should not have been called for same-value initial render
    const callsAfter = mockRaf.mock.calls.length;
    expect(callsAfter).toBe(callsBefore);

    mockRaf.mockRestore();
  });
});
