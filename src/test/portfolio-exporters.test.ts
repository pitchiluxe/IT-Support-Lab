import { describe, it, expect } from 'vitest';
import { encodeShareLink, decodeShareLink } from '@/features/portfolio/exporters';
import type { CaseStudy } from '@/features/portfolio/hooks';

const sample: CaseStudy[] = [
  {
    attemptId: 'a-1',
    labId: 'lab-01',
    labTitle: 'Lab 01 — Sample',
    scenario: 'A ticket arrives from a teacher.',
    kbOpportunity: 'Document the reset procedure.',
    score: 0.9,
    completedAt: 1_700_000_000_000,
    ticket: {
      type: 'incident',
      category: 'account',
      priority: 'p3',
      description: 'Locked out.',
      resolution: 'Reset password.',
    },
    evidence: [
      { id: 'e1', title: 'Ticket screenshot', body: 'shows the error', type: 'screenshot' },
    ],
    evidenceCount: 1,
    ticketCount: 1,
  },
];

describe('portfolio share link', () => {
  it('round-trips a portfolio through base64-url', () => {
    const { url, tooLarge } = encodeShareLink('Alex Smith', sample);
    expect(tooLarge).toBe(false);
    expect(url).toMatch(/^https?:\/\/.+#p=[A-Za-z0-9_-]+$/);

    // Simulate opening the URL in a new tab.
    const hash = url.split('#')[1]!;
    // jsdom's window.location.hash can be set; we'll just decode directly.
    // The decoder is keyed on the `#p=` prefix.
    const oldHash = window.location.hash;
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: `#${hash}` },
      configurable: true,
    });
    try {
      const decoded = decodeShareLink();
      expect(decoded).not.toBeNull();
      expect(decoded?.profile).toBe('Alex Smith');
      expect(decoded?.caseStudies).toHaveLength(1);
      expect(decoded?.caseStudies[0]?.labTitle).toBe('Lab 01 — Sample');
      expect(decoded?.caseStudies[0]?.ticket?.resolution).toBe('Reset password.');
    } finally {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, hash: oldHash },
        configurable: true,
      });
    }
  });

  it('rejects payloads with the wrong schema version', () => {
    const oldHash = window.location.hash;
    // `v: 99` is invalid; the decoder returns null.
    const fake = 'p=' + btoa(JSON.stringify({ v: 99, caseStudies: [] })).replace(/=+$/, '');
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: `#${fake}` },
      configurable: true,
    });
    try {
      expect(decodeShareLink()).toBeNull();
    } finally {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, hash: oldHash },
        configurable: true,
      });
    }
  });

  it('returns null when no share link is present', () => {
    const oldHash = window.location.hash;
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hash: '' },
      configurable: true,
    });
    try {
      expect(decodeShareLink()).toBeNull();
    } finally {
      Object.defineProperty(window, 'location', {
        value: { ...window.location, hash: oldHash },
        configurable: true,
      });
    }
  });

  it('marks too-large payloads instead of producing a giant URL', () => {
    const huge: CaseStudy[] = Array.from({ length: 200 }, (_, i) => ({
      ...sample[0]!,
      attemptId: `a-${i}`,
      labTitle: `Lab with an absurdly long title ${i} ${'x'.repeat(200)}`,
      scenario: 'x'.repeat(500),
    }));
    const { url, tooLarge } = encodeShareLink('Alex', huge);
    expect(tooLarge).toBe(true);
    expect(url).toBe('');
  });
});
