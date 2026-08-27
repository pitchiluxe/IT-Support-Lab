import { describe, it, expect } from 'vitest';
import { nextIndex, objectAriaLabel } from '@/features/locations/a11y';

describe('a11y helpers', () => {
  it('nextIndex moves forward with wrap-around', () => {
    expect(nextIndex(['a', 'b', 'c'], 'a', 1)).toBe(1);
    expect(nextIndex(['a', 'b', 'c'], 'c', 1)).toBe(0);
  });

  it('nextIndex moves backward with wrap-around', () => {
    expect(nextIndex(['a', 'b', 'c'], 'c', -1)).toBe(1);
    expect(nextIndex(['a', 'b', 'c'], 'a', -1)).toBe(2);
  });

  it('nextIndex returns 0 when starting from null (forward)', () => {
    expect(nextIndex(['a', 'b'], null, 1)).toBe(0);
  });

  it('nextIndex returns the last index when starting from null (backward)', () => {
    expect(nextIndex(['a', 'b'], null, -1)).toBe(1);
  });

  it('nextIndex returns -1 for an empty list', () => {
    expect(nextIndex([], null, 1)).toBe(-1);
  });

  it('objectAriaLabel appends a focus marker when highlighted', () => {
    expect(objectAriaLabel('MacBook', false)).toBe('MacBook');
    expect(objectAriaLabel('MacBook', true)).toBe('MacBook (current focus of the lab)');
  });
});
