import { describe, it, expect } from 'vitest';
import { validateTutorResponse, forbiddenFromLab } from '@/features/tutor/validator';

describe('validator.ts', () => {
  it('accepts a valid Socratic question', () => {
    const r = validateTutorResponse({
      response: 'What have you observed so far?',
      forbiddenSubstrings: [],
    });
    expect(r.ok).toBe(true);
    expect(r.flags).toHaveLength(0);
  });

  it('accepts a short question', () => {
    const r = validateTutorResponse({
      response: 'What is the IP address?',
      forbiddenSubstrings: [],
    });
    expect(r.ok).toBe(true);
  });

  it('rejects empty response', () => {
    const r = validateTutorResponse({ response: '', forbiddenSubstrings: [] });
    expect(r.ok).toBe(false);
    expect(r.flags).toContain('empty');
  });

  it('rejects "the answer is X"', () => {
    const r = validateTutorResponse({
      response: 'The answer is that the account is locked. You should unlock it.',
      forbiddenSubstrings: [],
    });
    expect(r.ok).toBe(false);
    expect(r.flags).toContain('declarative-prefix');
  });

  it('rejects "you should" prefix', () => {
    const r = validateTutorResponse({
      response: 'You should reset the password in the directory.',
      forbiddenSubstrings: [],
    });
    expect(r.ok).toBe(false);
    expect(r.flags).toContain('declarative-prefix');
  });

  it('rejects "run <command>" prefix', () => {
    const r = validateTutorResponse({
      response: 'run `dsquery user -name "Mrs. Hayes"` to find the account.',
      forbiddenSubstrings: [],
    });
    expect(r.ok).toBe(false);
    expect(r.flags).toContain('declarative-prefix');
  });

  it('rejects verbatim option label in forbidden substrings', () => {
    const r = validateTutorResponse({
      response: 'The correct choice is: Account is locked in the directory and Wi-Fi auth is rejecting valid credentials.',
      forbiddenSubstrings: [
        'Account is locked in the directory and Wi-Fi auth is rejecting valid credentials',
      ],
    });
    expect(r.ok).toBe(false);
    expect(r.flags.some((f) => f.startsWith('forbidden-substring'))).toBe(true);
  });

  it('rejects verbatim feedback string in forbidden substrings', () => {
    const r = validateTutorResponse({
      response: 'Strong hypothesis: You have no evidence yet that the password is wrong vs. an account lockout vs. an AP issue.',
      forbiddenSubstrings: ['You have no evidence yet that the password is wrong vs. an account lockout vs. an AP issue'],
    });
    expect(r.ok).toBe(false);
  });

  it('accepts a response with a question even if long', () => {
    const r = validateTutorResponse({
      response: 'Before you reset the password, consider this: what is the smallest test that would rule out the most common cause? Think about the IP address pattern, the auth error, and what changed this morning.',
      forbiddenSubstrings: [],
      maxLength: 50,
    });
    // Too-long is a flag but not critical
    expect(r.flags).toContain('too-long');
    expect(r.ok).toBe(true);
  });

  it('flags but does not reject low question density for short responses', () => {
    const r = validateTutorResponse({
      response: 'Try the known-good device test.',
      forbiddenSubstrings: [],
    });
    // Short responses < 200 chars don't need a question mark
    expect(r.flags).not.toContain('low-question-density');
  });

  it('forbiddenFromLab extracts option labels and feedback', () => {
    const decisions = [
      {
        options: [
          {
            label: 'Account is locked',
            feedback: 'Strong hypothesis.',
          },
          {
            label: 'Wrong password',
            feedback: 'Reasonable guess.',
          },
        ],
      },
    ];
    const forbidden = forbiddenFromLab(decisions);
    expect(forbidden).toContain('Account is locked');
    expect(forbidden).toContain('Wrong password');
    expect(forbidden).toContain('Strong hypothesis.');
    expect(forbidden).toContain('Reasonable guess.');
  });

  it('forbiddenFromLab handles empty decisions', () => {
    expect(forbiddenFromLab([])).toHaveLength(0);
  });

  it('is case-insensitive on forbidden substrings', () => {
    const r = validateTutorResponse({
      response: 'The ANSWER is: ACCOUNT IS LOCKED.',
      forbiddenSubstrings: ['account is locked'],
    });
    expect(r.ok).toBe(false);
  });
});
