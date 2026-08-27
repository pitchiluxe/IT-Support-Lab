/**
 * The post-hoc validator. After the model returns a complete response, the
 * UI calls `validateTutorResponse`. If `ok` is false, the response is dropped
 * (and the user sees a fallback Socratic question) and the leak attempt is
 * recorded in `tutorActions` for the audit log.
 *
 * Heuristics:
 *  1. Question density: at least one question mark per 200 chars.
 *  2. No declarative answers: reject sentences that start with "the answer is",
 *     "you should", "do this", or "run <command>".
 *  3. No option-label leak: if any forbidden substring (decision option label
 *     or feedback string) appears verbatim, reject.
 *  4. Length cap: response must be < 600 chars (or the model is lecturing).
 */

export interface ValidateInput {
  response: string;
  /** Strings that must NOT appear in the response. */
  forbiddenSubstrings: readonly string[];
  /** Maximum response length. */
  maxLength?: number;
}

export interface ValidateResult {
  ok: boolean;
  reason?: string;
  /** Heuristics the response failed. */
  flags: string[];
}

const DECLARATIVE_PREFIXES: RegExp[] = [
  /^\s*the answer is\b/i,
  /^\s*you should\b/i,
  /^\s*you need to\b/i,
  /^\s*do this\b/i,
  /^\s*run\s+[`'"]/i,
  /^\s*use\s+[`'"]/i,
  /^\s*the correct (option|cause|fix) is\b/i,
  /^\s*it is (caused|fixed) by\b/i,
];

export function validateTutorResponse({
  response,
  forbiddenSubstrings,
  maxLength = 600,
}: ValidateInput): ValidateResult {
  const flags: string[] = [];

  if (response.trim().length === 0) {
    return { ok: false, reason: 'empty-response', flags: ['empty'] };
  }

  if (response.length > maxLength) {
    flags.push('too-long');
  }

  // 1. Question density — at least one '?' per 200 chars
  const questions = (response.match(/\?/g) ?? []).length;
  if (response.length > 100 && questions === 0) {
    flags.push('no-question');
  }
  if (response.length > 200 && questions / response.length < 0.005) {
    flags.push('low-question-density');
  }

  // 2. Declarative prefixes — sentence by sentence
  const sentences = response.split(/(?<=[.!?])\s+/);
  for (const s of sentences) {
    if (DECLARATIVE_PREFIXES.some((re) => re.test(s))) {
      flags.push('declarative-prefix');
      break;
    }
  }

  // 3. Forbidden substrings — option labels, feedback, expected commands
  const lower = response.toLowerCase();
  for (const f of forbiddenSubstrings) {
    if (!f) continue;
    if (lower.includes(f.toLowerCase())) {
      flags.push(`forbidden-substring:${truncate(f, 30)}`);
    }
  }

  // 4. Hard reject if any critical flag
  const critical = ['forbidden-substring', 'declarative-prefix', 'no-question', 'empty'];
  const hasCritical = flags.some((f) => critical.some((c) => f.startsWith(c)));
  const ok = !hasCritical;

  return {
    ok,
    flags,
    ...(ok ? {} : { reason: flags[0] ?? 'unknown' }),
  };
}

/** Truncate a string for logging. */
function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

/**
 * Build the forbidden-substrings list from a lab's decision points.
 * Each option's `label` and `feedback` string is added. The lab itself is
 * not the prompt builder's concern — this is the validator's way of saying
 * "if the model repeats any of these, it has leaked."
 */
export function forbiddenFromLab(decisions: ReadonlyArray<{
  options: ReadonlyArray<{ label: string; feedback: string }>;
}>): string[] {
  const out: string[] = [];
  for (const dp of decisions) {
    for (const opt of dp.options) {
      if (opt.label) out.push(opt.label);
      if (opt.feedback) out.push(opt.feedback);
    }
  }
  return out;
}
