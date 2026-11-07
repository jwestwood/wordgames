import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAutoDismiss, DISCOVERY_HOLD_MS } from './autoDismiss';
import { createAnimationQueue } from './queue';

afterEach(() => vi.useRealTimers());

describe('discovery auto-dismiss ownership', () => {
  it('holds the revealed word for a readable 750ms, then permits close', async () => {
    vi.useFakeTimers();
    const owner = createAutoDismiss();
    const token = owner.begin();
    const done = vi.fn();
    const hold = owner.hold(token).then(done);
    await vi.advanceTimersByTimeAsync(DISCOVERY_HOLD_MS - 1);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await hold;
    expect(done).toHaveBeenCalledWith(true);
    expect(owner.isCurrent(token)).toBe(true);
    owner.cancel();
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['manual close', 'clue/browsing interaction', 'seed change/unmount'])(
    '%s releases the hold and forbids a stale close',
    async () => {
      vi.useFakeTimers();
      const owner = createAutoDismiss();
      const token = owner.begin();
      const hold = owner.hold(token);
      owner.cancel();
      expect(await hold).toBe(false);
      expect(owner.isCurrent(token)).toBe(false);
      await vi.advanceTimersByTimeAsync(5000);
      expect(vi.getTimerCount()).toBe(0);
    },
  );
  it('rapid discoveries supersede the earlier hold; only the latest lease can close', async () => {
    vi.useFakeTimers();
    const owner = createAutoDismiss();
    const old = owner.begin();
    const first = owner.hold(old);
    const latest = owner.begin();
    expect(await first).toBe(false);
    expect(await owner.hold(old)).toBe(false);
    const second = owner.hold(latest);
    await vi.advanceTimersByTimeAsync(DISCOVERY_HOLD_MS);
    expect(await second).toBe(true);
    expect(owner.isCurrent(old)).toBe(false);
    expect(owner.isCurrent(latest)).toBe(true);
  });
  it('manual opens (no lease) cannot schedule an automatic close', async () => {
    vi.useFakeTimers();
    const owner = createAutoDismiss();
    expect(owner.isCurrent(undefined)).toBe(false);
    expect(await owner.hold(-1)).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('cancelled holds cannot block stars, completed letters or perfect', async () => {
    vi.useFakeTimers();
    const owner = createAutoDismiss();
    const token = owner.begin();
    const queue = createAnimationQueue();
    const events: string[] = [];
    void queue.enqueue(async () => {
      await owner.hold(token);
    });
    for (const name of ['star', 'letter', 'perfect'])
      void queue.enqueue(() => {
        events.push(name);
      });
    await Promise.resolve();
    owner.cancel();
    await queue.idle();
    expect(events).toEqual(['star', 'letter', 'perfect']);
    expect(queue.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
