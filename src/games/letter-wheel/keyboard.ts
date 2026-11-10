/** Route a typed guess ahead of native activation of the focus-return Words opener. */
export function submitGuessOnEnter(
  event: Pick<KeyboardEvent, 'target' | 'preventDefault'>,
  hasGuess: boolean,
  wordsOpenerId: string,
  submit: () => void,
  canSubmit = true,
): void {
  const control = (event.target as HTMLElement).closest<HTMLElement>('button, [role="button"], a');
  // Preserve normal button/link keyboard activation except when a typed guess is pending
  // on the Words opener (which receives focus after closing the tray).
  if (control && !(hasGuess && control.id === wordsOpenerId)) return;
  event.preventDefault(); // Do not also click/reopen the focused Words button.
  if (canSubmit) submit();
}
