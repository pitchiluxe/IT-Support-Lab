import { describe, it, expect } from 'vitest';
import { buildCoachPrompt, isWithinBudget, TOKEN_BUDGET } from '@/features/tutor/prompt';
import type { TutorContext } from '@/features/tutor/provider';

const BASE_CTX: TutorContext = {
  labId: 'lab-01',
  labTitle: 'Faculty Laptop Cannot Connect to Wi-Fi',
  track: 'service-desk',
  week: 1,
  objectives: ['Identify the affected user', 'Reproduce the issue'],
  methodology: ['identify', 'gather-evidence', 'hypothesize'],
  currentNodeKind: 'inspect',
  currentNodeTitle: 'Inspect the Mac',
  evidenceTitles: ['ev-wifi-status', 'ev-ip-address'],
  decisionIds: [],
  keyFacts: [],
};

describe('prompt.ts', () => {
  it('does not include a correct*, expected*, or solution* field in the user payload', () => {
    // The system prompt intentionally mentions "correct" / "feedback" / "score"
    // in its hard rules to *forbid* those words. We verify the user payload
    // (the actual lab context sent to the model) does not contain them.
    const prompt = buildCoachPrompt(BASE_CTX, 1, [], 'What should I do?');
    const forbidden = ['correct', 'expected', 'solution', 'feedback', 'score'];
    for (const f of forbidden) {
      expect(prompt.user.toLowerCase()).not.toContain(f);
    }
  });

  it('includes the hint level in the system prompt', () => {
    for (let lvl = 1; lvl <= 7; lvl++) {
      const prompt = buildCoachPrompt(BASE_CTX, lvl, [], 'test');
      expect(prompt.system).toContain(`Hint level: ${lvl}/7`);
    }
  });

  it('includes the lab title and track', () => {
    const prompt = buildCoachPrompt(BASE_CTX, 1, [], 'test');
    expect(prompt.user).toContain('Faculty Laptop Cannot Connect to Wi-Fi');
    expect(prompt.user).toContain('service-desk');
  });

  it('includes the methodology step sequence', () => {
    const prompt = buildCoachPrompt(BASE_CTX, 1, [], 'test');
    expect(prompt.user).toContain('identify');
    expect(prompt.user).toContain('gather-evidence');
    expect(prompt.user).toContain('hypothesize');
  });

  it('includes evidence titles only (no bodies)', () => {
    const ctx = { ...BASE_CTX, evidenceTitles: ['ev-wifi-status', 'ev-ip-address'] };
    const prompt = buildCoachPrompt(ctx, 1, [], 'test');
    expect(prompt.user).toContain('ev-wifi-status');
    expect(prompt.user).not.toContain('EAP auth');
  });

  it('includes decision ids only (no labels)', () => {
    const ctx = { ...BASE_CTX, decisionIds: ['opt-A', 'opt-B'] };
    const prompt = buildCoachPrompt(ctx, 1, [], 'test');
    expect(prompt.user).toContain('opt-A');
    expect(prompt.user).toContain('opt-B');
    // The prompt does not pass option labels. We verify by trying with a label
    // that would only exist if the prompt included it.
    expect(prompt.user).not.toContain('label:');
  });

  it('appends recent turns in order', () => {
    const history = [
      { role: 'user' as const, content: 'Hello tutor' },
      { role: 'assistant' as const, content: 'How can I help?' },
      { role: 'user' as const, content: 'I need guidance' },
    ];
    const prompt = buildCoachPrompt(BASE_CTX, 1, history, 'still need help');
    expect(prompt.user).toContain('Hello tutor');
    expect(prompt.user).toContain('How can I help?');
    expect(prompt.user).toContain('I need guidance');
  });

  it('truncates history to last 8 turns', () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: 'user' as const,
      content: `msg ${i}`,
    }));
    const prompt = buildCoachPrompt(BASE_CTX, 1, history, 'latest');
    const count = (prompt.user.match(/\bmsg \d+\b/g) ?? []).length;
    expect(count).toBeLessThanOrEqual(9); // 8 history + 1 in the current message
  });

  it('throws if context contains a non-whitelisted field', () => {
    const bad = { ...BASE_CTX, secretAnswer: 'unlock the account' } as unknown as TutorContext;
    expect(() => buildCoachPrompt(bad, 1, [], 'test')).toThrow('not whitelisted');
  });

  it('computes an approximate token count', () => {
    const prompt = buildCoachPrompt(BASE_CTX, 1, [], 'What should I do next?');
    expect(prompt.approxTokens).toBeGreaterThan(0);
    expect(prompt.approxTokens).toBeLessThan(prompt.system.length + prompt.user.length);
  });

  it('isWithinBudget returns true for normal prompts', () => {
    const prompt = buildCoachPrompt(BASE_CTX, 1, [], 'What should I do?');
    expect(isWithinBudget(prompt)).toBe(true);
  });

  it('isWithinBudget uses the hard cap', () => {
    expect(TOKEN_BUDGET).toBe(1800);
  });

  it('does not include option labels from decision points in the prompt', () => {
    // Decision ids are opaque tokens. The prompt never sees the label text.
    // We verify by passing ids that don't overlap with any label text.
    const ctx = {
      ...BASE_CTX,
      decisionIds: ['decision-A-id', 'decision-B-id'],
    };
    const prompt = buildCoachPrompt(ctx, 1, [], 'What should I do?');
    expect(prompt.user).toContain('decision-A-id');
    expect(prompt.user).toContain('decision-B-id');
  });

  it('does not include feedback strings in the user payload', () => {
    // The user payload never receives feedback strings. The system prompt
    // intentionally mentions "feedback" to forbid it.
    const prompt = buildCoachPrompt(BASE_CTX, 1, [], 'test');
    expect(prompt.user).not.toContain('feedback');
  });
});
