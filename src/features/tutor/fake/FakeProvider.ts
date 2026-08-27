import type {
  TutorChunk,
  TutorContext,
  TutorDiagnostics,
  TutorProvider,
  TutorTurn,
} from '../provider';

/**
 * The FakeProvider. Returns scripted Socratic responses that are guaranteed
 * to never give the final answer. The responses are chosen by matching the
 * user's message against simple intent patterns. When no pattern matches, a
 * generic Socratic question is returned based on the lab's `currentNodeKind`.
 *
 * Determinism: given the same `turn`, the same sequence of tokens is yielded.
 * This is what makes the test suite stable.
 */

const BYPASS_PATTERNS: RegExp[] = [
  /\bjust tell me\b/i,
  /\bgive me the answer\b/i,
  /\bwhat is the answer\b/i,
  /\bwhat should i do\b/i,
  /\btell me (what|how|which)\b/i,
  /\bsolve it\b/i,
  /\bjust do it\b/i,
];

function isBypass(text: string): boolean {
  return BYPASS_PATTERNS.some((re) => re.test(text));
}

function pickIntent(text: string): string {
  const t = text.toLowerCase();
  if (isBypass(text)) return 'bypass';
  // Onboarding / feeling-stuck messages get their own warmer branch
  if (/\b(stuck|lost|confused|overwhelmed|don'?t know|i have no idea|where do i start|help me|new to this|first time)\b/.test(t))
    return 'onboard';
  if (/\b(what is|what does|what'?s|define|meaning of|explain)\b/.test(t) && !/\bwhat should i\b/.test(t))
    return 'define';
  if (/\b(where|which tab|which panel|where can i|how do i (get|find|see|open))\b/.test(t))
    return 'navigate';
  if (/\b(intake|caller|phone|calling|on the line|hello|hi|received)\b/.test(t))
    return 'intake';
  if (/\b(scope|everyone|others|other teachers|building|campus)\b/.test(t))
    return 'scope';
  if (/\b(evidence|log|screenshot|show|see|see the|ip address|error|message)\b/.test(t))
    return 'evidence';
  if (/\b(hypothesis|hypothesi[sz]e|think|cause|why|reason)\b/.test(t))
    return 'hypothesis';
  if (/\b(test|try|check|next step|next test|verify|validate)\b/.test(t))
    return 'test';
  if (/\b(decision|choose|option|pick|select)\b/.test(t))
    return 'decision';
  if (/\b(remediat|fix|repair|resolve|change|reboot|reset)\b/.test(t))
    return 'remediate';
  if (/\b(document|write up|notes|follow.?up|customer)\b/.test(t))
    return 'document';
  if (/\b(thanks|thank you|thx|great|nice|got it)\b/.test(t)) return 'closing';
  return 'generic';
}

interface ScriptedResponse {
  intent: string;
  hintLevel: number;
  text: string;
}

const SCRIPT: ScriptedResponse[] = [
  // ─── New learner onboarding ─────────────────────────────────────────
  // For "I'm new" / "where do I start" / "I'm stuck". Warm, not interrogating.
  {
    intent: 'onboard',
    hintLevel: 1,
    text: 'Welcome — totally normal to feel that way at the start. Here is the flow: first read the ticket carefully, then look at the evidence panel for any attached logs or screenshots, then form a one-sentence hypothesis, then pick the cheapest test. Where are you in that flow right now?',
  },
  {
    intent: 'onboard',
    hintLevel: 2,
    text: 'Good instinct to ask. Let\'s anchor you: what does the ticket actually say, in your own words? Don\'t worry about the jargon — I just want the one-sentence problem statement.',
  },
  {
    intent: 'onboard',
    hintLevel: 3,
    text: 'That\'s a fair place to get stuck. Most tickets are solved by getting one solid piece of evidence before changing anything. What is the *exact* thing the user is seeing on their screen — error message, popup, behavior? Capture it word for word.',
  },
  {
    intent: 'onboard',
    hintLevel: 4,
    text: 'You have evidence, good. Now: the question real technicians ask is "what would prove me *wrong*?" If you can\'t think of anything that would refute your theory, you don\'t have a hypothesis yet — you have a guess. What observation would change your mind?',
  },
  {
    intent: 'onboard',
    hintLevel: 5,
    text: 'Good. The category helps you narrow the search. I\'ll tell you: most help-desk tickets live in one of five layers — user account, the device itself, the local network, the central directory, or the application. Which of those do your two strongest pieces of evidence point at?',
  },
  {
    intent: 'onboard',
    hintLevel: 6,
    text: 'You\'re close. You have two candidates. Here\'s the move: pick the option where a *known-good* test exists. In IT, that usually means a second device, a second user, or a second cable. Which option lets you swap one variable at a time?',
  },
  {
    intent: 'onboard',
    hintLevel: 7,
    text: 'Last hint from me: the kind of test that resolves this is one that holds one thing constant and changes only the suspect. The "known-good" can be a working device, a working user account, or a working network drop. Which variable are you going to hold constant?',
  },

  // ─── Concept / definition request ───────────────────────────────────
  {
    intent: 'define',
    hintLevel: 1,
    text: 'Good question — that term gets used loosely. What does *your* textbook or IT glossary say it means? I\'ll help you connect it to this scenario once we agree on a definition.',
  },
  {
    intent: 'define',
    hintLevel: 2,
    text: 'Quick version: most of these concepts describe a *layer* (user / device / network / directory / app) or an *action* (authenticate, resolve, route, replicate). Which kind is the term you asked about — a layer or an action?',
  },
  {
    intent: 'define',
    hintLevel: 3,
    text: 'OK, here is the gist without going into the textbook. The term you asked about is the part of the system that is responsible for X. In this scenario, the symptom you\'re seeing happens when that part is doing Y. Where in the lab can you see evidence of Y?',
  },
  {
    intent: 'define',
    hintLevel: 4,
    text: 'Fair — let me be more concrete. The term you asked about controls the *thing the user is complaining about*. The evidence panel should show you whether that thing is succeeding or failing. What does it show?',
  },
  {
    intent: 'define',
    hintLevel: 5,
    text: 'Now I can be direct. The term you asked about = the *category* this issue lives in. The other four categories to compare against are: user, device, network, application. Which of those four is *not* the issue here?',
  },
  {
    intent: 'define',
    hintLevel: 6,
    text: 'You\'re ready. The term you asked about governs the part of the stack that this symptom is failing in. Two options in front of you are both about that stack — one is reversible, one is not. Which is which?',
  },
  {
    intent: 'define',
    hintLevel: 7,
    text: 'Almost there. The term you asked about is the *thing you would test*. A test of this class uses a known-good X to confirm the suspect Y is bad. Which X do you have available in this scenario?',
  },

  // ─── "Where in the UI is X" / navigation request ────────────────────
  {
    intent: 'navigate',
    hintLevel: 1,
    text: 'Good question — the UI is a lot at first. The three panels to know are: the ticket on the left (what the user said), the scenario / inspector in the middle (the actual lab state), and the evidence + tutor tabs on the right. Which of those three are you looking for?',
  },
  {
    intent: 'navigate',
    hintLevel: 2,
    text: 'Look at the tabs above the middle panel — the one that matches the step you\'re on (intake, scope, evidence, decide, etc.) is where the relevant data appears. Which step are you on?',
  },
  {
    intent: 'navigate',
    hintLevel: 3,
    text: 'That step has its own panel with a short list of items. The first item is usually the user\'s request, the rest are context you can act on. What is the first item there in your own words?',
  },
  {
    intent: 'navigate',
    hintLevel: 4,
    text: 'You\'re on the right screen. Each item in that list can be opened for detail. The detail view is what you need for the next step. Open the first item and tell me the top-line value.',
  },
  {
    intent: 'navigate',
    hintLevel: 5,
    text: 'You have the detail. The decision options live in a different tab — switch to the decision tab when you have evidence. First: is the detail you just opened enough to form a hypothesis?',
  },
  {
    intent: 'navigate',
    hintLevel: 6,
    text: 'Great, switch to the decision tab. Each option has a short description and a risk. You don\'t need to pick yet — just read all of them and tell me which one sounds most reversible.',
  },
  {
    intent: 'navigate',
    hintLevel: 7,
    text: 'Final piece: the ticket document tab on the right is where you write up what you did. Save a 2-sentence note before you remediate so you have a clean audit trail. What two sentences will you write?',
  },

  // ─── Bypass attempts: return a meta-question, never the answer ─────
  {
    intent: 'bypass',
    hintLevel: 1,
    text: 'I can\'t give you the final answer — that\'s part of how the assessment works. But I *can* walk you through it. So: what do you see on the screen right now, and where are you in the flow?',
  },
  {
    intent: 'bypass',
    hintLevel: 2,
    text: 'Imagine a colleague handed you this ticket cold. What is the first question you would ask them before you acted?',
  },
  {
    intent: 'bypass',
    hintLevel: 3,
    text: 'Try this: name the specific symptom in one sentence, then list the two most likely causes. Which of those do you have the least evidence for?',
  },
  {
    intent: 'bypass',
    hintLevel: 4,
    text: 'You are close. Tell me the single piece of evidence that would change your mind about your leading hypothesis, and how you would collect it.',
  },
  {
    intent: 'bypass',
    hintLevel: 5,
    text: 'I will name the *category* of the issue but not the specific cause. Look at the evidence you have collected: does it point to the user, the device, the network, or the directory?',
  },
  {
    intent: 'bypass',
    hintLevel: 6,
    text: 'Compare the two strongest remaining options. What is the cheapest reversible test that would distinguish them?',
  },
  {
    intent: 'bypass',
    hintLevel: 7,
    text: 'I cannot give you the answer directly. But I will tell you the kind of test that resolves this: one that uses a *known-good* variable. What variable can you hold constant?',
  },

  // ─── Intake (multi-level so the new learner can go deeper) ──────────
  {
    intent: 'intake',
    hintLevel: 1,
    text: 'Good — you took the call. What is the caller\'s name, role, location, and the exact words they used to describe the problem?',
  },
  {
    intent: 'intake',
    hintLevel: 2,
    text: 'Nice intake. The four things you captured are: who, where, what, when. The "when" piece is the one most techs miss — does the user know when the problem started, and what changed just before?',
  },
  {
    intent: 'intake',
    hintLevel: 3,
    text: 'You have intake. Now: pick the *one* word from the user\'s description that is most diagnostic. "It\'s broken" is not diagnostic; "I get error 0x80070035" is. Which word in their description points at a layer?',
  },

  // ─── Scope ──────────────────────────────────────────────────────────
  {
    intent: 'scope',
    hintLevel: 1,
    text: 'Before you change anything, you need scope. Are other users or other classrooms affected? How will you find out?',
  },
  {
    intent: 'scope',
    hintLevel: 2,
    text: 'Scope tells you which layer the issue lives in. If only this user is affected, suspect user or device. If this room is affected, suspect network. If the whole campus is affected, suspect directory or app. Which bucket does the symptom fit?',
  },
  {
    intent: 'scope',
    hintLevel: 3,
    text: 'You have scope. The fastest way to confirm is to ask one peer: "is this happening for you too?" If they say yes, the layer just narrowed. If no, the layer is the user or the device. Have you checked with a peer yet?',
  },

  // ─── Evidence (already had 2 levels; add a third) ──────────────────
  {
    intent: 'evidence',
    hintLevel: 1,
    text: 'Capture the exact symptom in the caller\'s words — error message, IP address, last seen time, OS. Save it before you change anything.',
  },
  {
    intent: 'evidence',
    hintLevel: 2,
    text: 'You have one observation. What is the smallest additional piece of evidence that would confirm or refute your current hypothesis?',
  },
  {
    intent: 'evidence',
    hintLevel: 3,
    text: 'Good evidence set. Now ask: which piece of evidence is *not* consistent with your hypothesis? Naming the weakest link is what separates a guess from a diagnosis.',
  },

  // ─── Hypothesis ─────────────────────────────────────────────────────
  {
    intent: 'hypothesis',
    hintLevel: 1,
    text: 'State your hypothesis in one sentence. What evidence supports it, and what evidence would disprove it?',
  },
  {
    intent: 'hypothesis',
    hintLevel: 2,
    text: 'A good hypothesis is specific *and* falsifiable. "It\'s the network" is not falsifiable. "It\'s the Wi-Fi association on this one AP, because the user has signal everywhere else" is. Tighten yours.',
  },
  {
    intent: 'hypothesis',
    hintLevel: 3,
    text: 'You have a falsifiable hypothesis. The next step is to design a test that *could fail*. If your test cannot fail, it cannot prove you right either. What is the failing condition?',
  },

  // ─── Test ───────────────────────────────────────────────────────────
  {
    intent: 'test',
    hintLevel: 1,
    text: 'Pick the *least risky* test that would distinguish your hypotheses. What is the side effect if you are wrong?',
  },
  {
    intent: 'test',
    hintLevel: 2,
    text: 'A good test holds everything constant except the suspect variable. If your test changes two things at once, you won\'t know which one mattered. What is the one thing you are changing?',
  },
  {
    intent: 'test',
    hintLevel: 3,
    text: 'You have a test. Before you run it, write down the expected outcome for *both* branches (hypothesis A and hypothesis B). That way you\'ll know which side of the line you landed on without re-interpreting.',
  },

  // ─── Decision ───────────────────────────────────────────────────────
  {
    intent: 'decision',
    hintLevel: 1,
    text: 'Before you pick, ask: does this option destroy state? If yes, you need stronger evidence first.',
  },
  {
    intent: 'decision',
    hintLevel: 2,
    text: 'Rank the options from least destructive to most. The least-destructive option that *could* still resolve the issue is your best first move. What is the order?',
  },
  {
    intent: 'decision',
    hintLevel: 3,
    text: 'You have a ranked list. The top option should be reversible. If it isn\'t, the evidence isn\'t strong enough yet — go back and capture one more thing. Which option is at the top?',
  },

  // ─── Remediate ──────────────────────────────────────────────────────
  {
    intent: 'remediate',
    hintLevel: 1,
    text: 'Document every step in order. After each step, what is the validation that proves it worked?',
  },
  {
    intent: 'remediate',
    hintLevel: 2,
    text: 'You\'re remediating. After each action, re-run the *same* test you used to find the problem. If the symptom is gone, great. If a new symptom appears, you\'ve just discovered a dependency.',
  },
  {
    intent: 'remediate',
    hintLevel: 3,
    text: 'You have a working remediation. The last step is end-to-end validation with the user: have them repeat their original workflow. If they can\'t, you haven\'t actually fixed it. Have they?',
  },

  // ─── Document ───────────────────────────────────────────────────────
  {
    intent: 'document',
    hintLevel: 1,
    text: 'Your follow-up should answer three things in plain language: what was wrong, what you did, and what to do if it happens again.',
  },
  {
    intent: 'document',
    hintLevel: 2,
    text: 'A good ticket note starts with the *one-sentence* problem, then the *one-sentence* cause, then the *one-sentence* fix. If you can\'t say it in one sentence each, you don\'t understand it yet.',
  },
  {
    intent: 'document',
    hintLevel: 3,
    text: 'Final touch: include a *prevention* line. "If this happens again, do X." That single sentence is what turns a one-off fix into a KB article. What will your prevention line say?',
  },

  // ─── Closing ────────────────────────────────────────────────────────
  {
    intent: 'closing',
    hintLevel: 1,
    text: 'Nice work. Note one thing you would do differently next time, and one habit that worked — that\'s how real techs build their playbook.',
  },
  {
    intent: 'closing',
    hintLevel: 2,
    text: 'You\'re getting the rhythm. The two things that separate senior techs from juniors: (1) they always know the *category* before they touch anything, and (2) they always write the prevention line. Keep practicing both.',
  },
];

function pickScripted(intent: string, hintLevel: number, fallback: ScriptedResponse): string {
  const matches = SCRIPT.filter((s) => s.intent === intent);
  if (matches.length === 0) return fallback.text;
  // Pick the script with the largest hintLevel <= requested; fall back to smallest.
  const eligible = matches.filter((s) => s.hintLevel <= hintLevel);
  const pool = eligible.length > 0 ? eligible : matches;
  const best = pool.reduce((acc, s) => (s.hintLevel > acc.hintLevel ? s : acc));
  return best.text;
}

function genericForKind(kind: TutorContext['currentNodeKind'], hintLevel: number): string {
  const level = Math.max(1, Math.min(7, hintLevel));
  const questions: Record<TutorContext['currentNodeKind'], string[]> = {
    intro: [
      'Who is the affected user, what device, and what is the exact symptom in their words?',
      'What would you write on the ticket as the one-sentence problem statement?',
      'What is the smallest test that would rule out the most common cause?',
    ],
    inspect: [
      'What does the device state tell you? Note the exact values, not your interpretation.',
      'Is the symptom at the user, device, network, or directory layer?',
      'What is the cheapest reversible action you could take to gather more information?',
    ],
    decide: [
      'Rank your options from least risky to most risky. Which would you test first?',
      'What is the one piece of evidence that would flip your choice?',
      'If your decision is wrong, what state is destroyed? Can you recover it?',
    ],
    remediate: [
      'After each step, what observation confirms it worked?',
      'Did you validate with the same test you used to find the problem?',
      'Have you re-tested the original symptom, end-to-end, with the user?',
    ],
    document: [
      'Your follow-up should explain what was wrong, what you did, and what to do next time — in plain language.',
      'What one sentence would the user repeat to a colleague to describe the resolution?',
      'Did you include the prevention step? "If this happens again, do X."',
    ],
    debrief: [
      'What was the single most useful piece of evidence you collected?',
      'What habit would you keep, and what would you change?',
      'How would you explain the methodology you used to a new hire?',
    ],
    unknown: [
      'What is the smallest next step you can take right now?',
    ],
  };
  const list = questions[kind];
  if (!list || list.length === 0) return 'What is the smallest next step you can take right now?';
  const idx = Math.min(level - 1, list.length - 1);
  return list[idx] ?? list[0]!;
}

/** Yield a string one token at a time, with at least one chunk per word. */
async function* streamTokens(text: string, signal: AbortSignal): AsyncGenerator<TutorChunk> {
  const words = text.split(/(\s+)/); // keep whitespace
  for (const w of words) {
    if (signal.aborted) {
      yield { type: 'error', error: { kind: 'aborted', message: 'Cancelled by user' } };
      return;
    }
    if (w.length === 0) continue;
    // Simulate small network delay
    await new Promise((r) => setTimeout(r, 12));
    yield { type: 'token', content: w };
  }
  yield { type: 'done' };
}

export class FakeProvider implements TutorProvider {
  readonly name = 'fake' as const;

  private aborted = false;

  abort(): void {
    this.aborted = true;
  }

  async *chat(turn: TutorTurn): AsyncIterable<TutorChunk> {
    this.aborted = false;
    const intent = pickIntent(turn.user);
    const hintLevel = Math.max(1, Math.min(7, turn.hintLevel));

    let text: string;
    if (intent === 'generic') {
      text = genericForKind(turn.context.currentNodeKind, hintLevel);
    } else {
      const fallback: ScriptedResponse = {
        intent: 'generic',
        hintLevel,
        text: genericForKind(turn.context.currentNodeKind, hintLevel),
      };
      text = pickScripted(intent, hintLevel, fallback);
    }

    for await (const chunk of streamTokens(text, turn.signal)) {
      if (this.aborted) {
        yield { type: 'error', error: { kind: 'aborted', message: 'Cancelled by user' } };
        return;
      }
      yield chunk;
    }
  }

  async getDiagnostics(): Promise<TutorDiagnostics> {
    return { providerName: 'fake', model: 'scripted', reachable: true };
  }
}
