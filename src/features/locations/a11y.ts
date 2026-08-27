/**
 * Accessibility helpers for the 2D location panel.
 *
 * The full keyboard walkthrough is documented in docs/a11y.md. For now, we
 * provide the small focus-management utilities the panel relies on.
 */

/** Build an aria-label for an object in the location list. */
export function objectAriaLabel(name: string, isHighlighted: boolean): string {
  return isHighlighted ? `${name} (current focus of the lab)` : name;
}

/** Returns the index that follows the given id in a list, wrapping. */
export function nextIndex(ids: readonly string[], currentId: string | null, delta: 1 | -1): number {
  if (ids.length === 0) return -1;
  const idx = currentId ? ids.indexOf(currentId) : -1;
  if (idx === -1) return delta === 1 ? 0 : ids.length - 1;
  return (idx + delta + ids.length) % ids.length;
}
