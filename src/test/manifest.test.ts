import { describe, it, expect } from 'vitest';
import { LAB_MANIFEST, TOTAL_LABS, skillsForArea, availableLabs } from '@/data/labs/manifest';

describe('LAB_MANIFEST', () => {
  it('has a unique id for every entry', () => {
    const ids = LAB_MANIFEST.map((l) => l.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has sequential week numbers for the first few entries', () => {
    for (let i = 1; i < LAB_MANIFEST.length; i++) {
      const prev = LAB_MANIFEST[i - 1]!;
      const curr = LAB_MANIFEST[i]!;
      expect(curr.week).toBeGreaterThanOrEqual(prev.week);
    }
  });

  it('lab-01 is in the manifest with content', () => {
    const lab01 = LAB_MANIFEST.find((l) => l.id === 'lab-01');
    expect(lab01).toBeDefined();
    expect(lab01?.contentPath).toBe('lab-01.json');
  });
});

describe('skillsForArea', () => {
  it('returns a non-empty array for networking', () => {
    const labs = skillsForArea('networking');
    expect(labs.length).toBeGreaterThan(0);
  });
});

describe('availableLabs', () => {
  it('returns at least lab-01', () => {
    const labs = availableLabs();
    expect(labs.some((l) => l.id === 'lab-01')).toBe(true);
  });
});

describe('TOTAL_LABS', () => {
  it('is a positive integer', () => {
    expect(TOTAL_LABS).toBeGreaterThan(0);
  });

  it('matches the manifest length', () => {
    expect(TOTAL_LABS).toBe(LAB_MANIFEST.length);
  });
});
