import { describe, it, expect } from 'vitest';
import { LAB_MANIFEST } from '@/data/labs/manifest';
import { evaluateCapstoneGate } from '@/features/capstone/gate';

const capstone = LAB_MANIFEST.find((l) => l.id === 'capstone-01');
if (!capstone) throw new Error('Capstone not in manifest');

describe('evaluateCapstoneGate', () => {
  it('starts locked with 0% progress', () => {
    const status = evaluateCapstoneGate(capstone, []);
    expect(status.unlocked).toBe(false);
    expect(status.completed).toHaveLength(0);
    expect(status.progressPct).toBe(0);
    expect(status.remaining.length).toBe(status.required.length);
  });

  it('counts progress as completed set grows', () => {
    const phase1 = LAB_MANIFEST.filter((l) => l.id !== 'capstone-01' && l.week === 1);
    const status1 = evaluateCapstoneGate(capstone, phase1.map((l) => l.id));
    expect(status1.completed).toHaveLength(phase1.length);
    expect(status1.unlocked).toBe(false);
    expect(status1.progressPct).toBeGreaterThan(0);
    expect(status1.progressPct).toBeLessThan(1);
  });

  it('unlocks when every required lab is completed', () => {
    const required = LAB_MANIFEST.filter(
      (l) => l.id !== 'capstone-01' && l.contentPath !== null,
    );
    const status = evaluateCapstoneGate(capstone, required.map((l) => l.id));
    expect(status.unlocked).toBe(true);
    expect(status.remaining).toHaveLength(0);
    expect(status.progressPct).toBe(1);
  });

  it('unlocks at the default 80% threshold (not strictly 100%)', () => {
    const required = LAB_MANIFEST.filter(
      (l) => l.id !== 'capstone-01' && l.contentPath !== null,
    );
    // Complete the first 80% of phase labs (ceil to nearest whole).
    const target = Math.ceil(required.length * 0.8);
    const completed = required.slice(0, target).map((l) => l.id);
    const status = evaluateCapstoneGate(capstone, completed);
    expect(status.threshold).toBe(0.8);
    expect(status.unlocked).toBe(true);
    expect(status.remaining.length).toBeLessThan(required.length);
  });

  it('stays locked just below the 80% threshold', () => {
    const required = LAB_MANIFEST.filter(
      (l) => l.id !== 'capstone-01' && l.contentPath !== null,
    );
    // 79% should be below the 80% threshold.
    const target = Math.floor(required.length * 0.79);
    const completed = required.slice(0, target).map((l) => l.id);
    const status = evaluateCapstoneGate(capstone, completed);
    expect(status.unlocked).toBe(false);
    expect(status.labsNeeded).toBeGreaterThan(0);
  });

  it('honours a custom threshold of 1 (strict 100%)', () => {
    const required = LAB_MANIFEST.filter(
      (l) => l.id !== 'capstone-01' && l.contentPath !== null,
    );
    // At 80% completion with threshold=1, still locked.
    const target = Math.ceil(required.length * 0.8);
    const completed = required.slice(0, target).map((l) => l.id);
    const status = evaluateCapstoneGate(capstone, completed, { threshold: 1 });
    expect(status.threshold).toBe(1);
    expect(status.unlocked).toBe(false);
  });

  it('clamps an out-of-range threshold to the safe default', () => {
    const required = LAB_MANIFEST.filter(
      (l) => l.id !== 'capstone-01' && l.contentPath !== null,
    );
    const completed = required.slice(0, required.length).map((l) => l.id);
    const tooHigh = evaluateCapstoneGate(capstone, completed, { threshold: 5 });
    expect(tooHigh.threshold).toBe(1);
    const tooLow = evaluateCapstoneGate(capstone, completed, { threshold: -1 });
    expect(tooLow.threshold).toBe(0);
  });

  it('ignores attempts on the capstone itself in the completed list', () => {
    const status = evaluateCapstoneGate(capstone, ['capstone-01']);
    expect(status.unlocked).toBe(false);
    expect(status.completed).toHaveLength(0);
  });

  it('reports a stable remaining list (sorted by manifest order)', () => {
    const phase1 = LAB_MANIFEST.filter((l) => l.id !== 'capstone-01' && l.week === 1);
    const status = evaluateCapstoneGate(capstone, phase1.map((l) => l.id));
    const expected = LAB_MANIFEST.filter(
      (l) => l.id !== 'capstone-01' && l.contentPath !== null && l.week !== 1,
    ).map((l) => l.id);
    expect(status.remaining).toEqual(expected);
  });
});
