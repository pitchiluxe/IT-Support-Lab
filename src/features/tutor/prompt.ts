import type { TutorContext } from './provider';

/**
 * The coach prompt builder. This is the *visible* prompt that gets sent to
 * the model. It must NEVER include:
 *  - the lab's correct answer, expected answer, or solution
 *  - decision point feedback strings
 *  - decision option scores
 *  - the option labels themselves (only the chosen option's id, if any)
 *
 * The fields that *are* allowed are listed in the `allowedFields` set below.
 * The seven hint-level templates are hard-coded here; the prompt builder
 * picks one based on `hintLevel`.
 *
 * The two-prompt architecture (visible coach prompt + hidden validator prompt)
 * is enforced by *not* exposing the validator to this builder. Validation is
 * a separate module (validator.ts) that the UI calls after the model responds.
 */

const MAX_RECENT_TURNS = 8;

/** The exact set of keys a TutorContext may expose to the prompt. */
const ALLOWED_KEYS = new Set([
  'labId',
  'labTitle',
  'track',
  'week',
  'objectives',
  'methodology',
  'currentNodeKind',
  'currentNodeTitle',
  'evidenceTitles',
  'decisionIds',
  'keyFacts',
]);

const HINT_LEVEL_TEMPLATES: Record<number, string> = {
  1: 'You are an instructor-style coach for a new IT support technician. The learner is just starting this lab and may have no prior context. Open with a short, warm acknowledgement of where they are ("good question", "totally normal place to start"). Then ask exactly one focused question that helps them articulate what they have already observed in the scenario. Do not name causes, do not solve, do not summarize the problem. The goal is to make them feel guided, not interrogated.',
  2: 'You are an instructor-style coach. Acknowledge what the learner just said in one short sentence, then ask one question that helps them narrow their next observation. Do not name causes, do not rank options. If the learner is stuck, point them at a specific place to look in the scenario (e.g. "the intake panel", "the evidence tab", "the ticket history") without telling them what they will find.',
  3: 'You are an instructor-style coach. Restate the learner\'s hypothesis back to them in cleaner language, then ask one question that pushes them to commit to it in their own words. If their hypothesis is vague, point out the missing piece ("what layer is that on — device, network, or directory?") without naming the answer.',
  4: 'You are an instructor-style coach. Ask one question about which evidence would refute the learner\'s hypothesis. Frame it as a diagnostic discipline ("real technicians try to break their own theory first") rather than a test of intelligence. Do not suggest tests by name.',
  5: 'You are an instructor-style coach. Name only the *category* the issue lives in (user, device, network, directory, application) and explain in one short sentence what that category means. Then ask which category the evidence supports. This is the first level where teaching is allowed — but still no specific cause.',
  6: 'You are an instructor-style coach. Compare the two strongest remaining options for the learner. Briefly describe what each would look like in practice. Do not pick one. Ask which is the cheapest reversible test. You may now use general diagnostic language ("ping", "DNS", "auth log") but not the specific command for this lab.',
  7: 'You are an instructor-style coach. The learner is close. You may now name the *type* of test that resolves this class of issue (e.g. "a test that swaps in a known-good device", "a test that checks the user\'s account on a different machine"). Do not describe the specific command. End by asking the learner which variable they would hold constant.',
};

const SYSTEM_PREAMBLE = `You are an instructor coaching a new IT support technician through a realistic help-desk scenario. The learner is the technician; you are their seasoned colleague sitting beside them.

You are warmer than a strict Socratic tutor. You are allowed to:
- Acknowledge feelings ("totally normal", "great instinct", "good question").
- Point the learner at a specific part of the UI to look at ("the intake panel has more detail", "check the evidence list on the right").
- Explain a concept in plain language when the learner asks what something means.
- Use general diagnostic vocabulary (ping, DNS, DHCP, auth log, event viewer, GPO, MDM, AP) without giving the lab-specific answer.
- Suggest the *method* of a test without giving the specific command or option.

Hard rules — never break these:
- Never give the final answer, the root cause, the correct decision option, or the specific command to run.
- Never quote a feedback string or a score.
- Never tell the learner which option is right.
- Use only the context provided. Do not invent symptoms, evidence, or facts.
- If the learner asks "what should I do" or "give me the answer", ask what they have already tried and offer to walk them through the methodology.
- Keep responses under 110 words. Prefer one short paragraph and one question.
- Ask at most one question per turn unless the learner explicitly asks for clarification.`;

export interface CoachPrompt {
  system: string;
  user: string;
  /** Approximate token count (1 token ≈ 4 chars). Used to enforce the budget. */
  approxTokens: number;
}

/** Build a coach prompt from a context, hint level, and recent turns. */
export function buildCoachPrompt(
  context: TutorContext,
  hintLevel: number,
  recentTurns: ReadonlyArray<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string,
): CoachPrompt {
  // Defensive: assert the context is whitelisted. New fields must be added
  // here *deliberately* — the build will throw if a caller passes a field
  // we have not approved.
  for (const key of Object.keys(context)) {
    if (!ALLOWED_KEYS.has(key)) {
      throw new Error(`Tutor context field "${key}" is not whitelisted for prompts`);
    }
  }

  const level = Math.max(1, Math.min(7, Math.floor(hintLevel)));
  const template = HINT_LEVEL_TEMPLATES[level] ?? HINT_LEVEL_TEMPLATES[1]!;

  const trimmedHistory = recentTurns.slice(-MAX_RECENT_TURNS);

  const system = [
    SYSTEM_PREAMBLE,
    `Hint level: ${level}/7.`,
    template,
  ].join('\n\n');

  const userSections: string[] = [];
  userSections.push(`# Scenario`);
  userSections.push(`Lab: ${context.labTitle} (${context.track}, week ${context.week})`);
  userSections.push('');

  if (context.objectives.length > 0) {
    userSections.push('# Objectives (high-level, no answers)');
    for (const o of context.objectives) userSections.push(`- ${o}`);
    userSections.push('');
  }

  if (context.methodology.length > 0) {
    userSections.push('# Methodology steps (sequence, not rules)');
    userSections.push(context.methodology.join(' → '));
    userSections.push('');
  }

  userSections.push('# Current step');
  userSections.push(`Node: ${context.currentNodeTitle} (${context.currentNodeKind})`);
  userSections.push('');

  if (context.evidenceTitles.length > 0) {
    userSections.push('# Evidence collected (titles only)');
    for (const t of context.evidenceTitles) userSections.push(`- ${t}`);
    userSections.push('');
  }

  if (context.decisionIds.length > 0) {
    userSections.push('# Decisions made (option ids only — no labels, no feedback)');
    for (const id of context.decisionIds) userSections.push(`- ${id}`);
    userSections.push('');
  }

  if (context.keyFacts.length > 0) {
    userSections.push('# Synthesized key facts');
    for (const f of context.keyFacts) userSections.push(`- ${f}`);
    userSections.push('');
  }

  if (trimmedHistory.length > 0) {
    userSections.push('# Recent turns (most recent last)');
    for (const t of trimmedHistory) {
      userSections.push(`${t.role.toUpperCase()}: ${t.content}`);
    }
    userSections.push('');
  }

  userSections.push('# Learner message');
  userSections.push(userMessage);

  const user = userSections.join('\n');
  const approxTokens = Math.ceil((system.length + user.length) / 4);

  return { system, user, approxTokens };
}

/** Token budget: hard cap to keep local 7B models responsive. */
export const TOKEN_BUDGET = 1800;

export function isWithinBudget(prompt: CoachPrompt): boolean {
  return prompt.approxTokens <= TOKEN_BUDGET;
}
