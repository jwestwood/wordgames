import { describe, expect, it, vi } from 'vitest';
import { submitGuessOnEnter } from './keyboard';

function keyEvent(controlId: string | null) {
  return {
    target: {
      closest: () => (controlId === null ? null : { id: controlId }),
    } as unknown as EventTarget,
    preventDefault: vi.fn(),
  };
}

describe('Enter after closing the Words tray', () => {
  it('submits an already-found guess instead of natively reopening the focused opener', () => {
    // Closing returns focus to Words. Typing AIDE leaves that focus in place.
    const event = keyEvent('words-opener');
    const alreadyFound = vi.fn();
    const openTray = vi.fn();
    submitGuessOnEnter(event, true, 'words-opener', alreadyFound);
    // Emulate the browser default only if the handler did not prevent it.
    if (!event.preventDefault.mock.calls.length) openTray();
    expect(alreadyFound).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(openTray).not.toHaveBeenCalled();
  });
  it('still allows explicitly opening Words with Enter when no guess is pending', () => {
    const event = keyEvent('words-opener');
    const submit = vi.fn();
    submitGuessOnEnter(event, false, 'words-opener', submit);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });
  it('preserves native activation of other buttons and links', () => {
    const event = keyEvent('shuffle-button');
    const submit = vi.fn();
    submitGuessOnEnter(event, true, 'words-opener', submit);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });
  it('still submits from a noninteractive page target and suppresses default activation', () => {
    const event = keyEvent(null);
    const submit = vi.fn();
    submitGuessOnEnter(event, true, 'words-opener', submit);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(submit).toHaveBeenCalledOnce();
  });
});

it('does not submit a locked incorrect guess, and still suppresses Words activation', () => {
  const event = keyEvent('words-opener');
  const submit = vi.fn();
  const openTray = vi.fn();
  submitGuessOnEnter(event, true, 'words-opener', submit, false);
  if (!event.preventDefault.mock.calls.length) openTray();
  expect(event.preventDefault).toHaveBeenCalledOnce();
  expect(submit).not.toHaveBeenCalled();
  expect(openTray).not.toHaveBeenCalled();
});
