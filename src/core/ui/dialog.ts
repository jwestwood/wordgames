/** Reference-counted document lock: nested sheets/dialogs must not unlock each other. */
let locks = 0;
let restore: (() => void) | undefined;
export function lockBodyScroll(): () => void {
  if (locks++ === 0) {
    const body = document.body;
    const html = document.documentElement;
    const before = [body.style.overflow, html.style.overflow];
    body.style.overflow = html.style.overflow = 'hidden';
    restore = () => {
      body.style.overflow = before[0];
      html.style.overflow = before[1];
    };
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) {
      restore?.();
      restore = undefined;
    }
  };
}

/** Make everything outside this branch inert, without touching another modal's portal. */
export function isolateDialog(branch: HTMLElement): () => void {
  const changed: Array<[HTMLElement, boolean]> = [];
  let child: HTMLElement = branch;
  while (child.parentElement) {
    for (const sibling of Array.from(child.parentElement.children)) {
      if (sibling === child || !(sibling instanceof HTMLElement)) continue;
      changed.push([sibling, sibling.inert]);
      sibling.inert = true;
    }
    if (child.parentElement === document.body) break;
    child = child.parentElement;
  }
  return () =>
    changed.forEach(([el, before]) => {
      el.inert = before;
    });
}
