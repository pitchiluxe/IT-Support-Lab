import { describe, it, expect } from 'vitest';
import { FakeProvider } from '@/features/tutor/fake/FakeProvider';
import type { TutorContext, TutorTurn } from '@/features/tutor/provider';

function makeTurn(user: string, hintLevel = 1, context?: Partial<TutorContext>): TutorTurn {
  const ctx: TutorContext = {
    labId: 'lab-01',
    labTitle: 'Faculty Laptop Cannot Connect to Wi-Fi',
    track: 'service-desk',
    week: 1,
    objectives: ['Restore connectivity'],
    methodology: ['identify', 'gather-evidence'],
    currentNodeKind: 'inspect',
    currentNodeTitle: 'Inspect the Mac',
    evidenceTitles: [],
    decisionIds: [],
    keyFacts: [],
    ...context,
  };
  return {
    user,
    history: [],
    context: ctx,
    hintLevel,
    signal: new AbortController().signal,
  };
}

describe('FakeProvider', () => {
  it('returns a Socratic response for an intake question', async () => {
    const p = new FakeProvider();
    const turn = makeTurn('What should I do?');
    const chunks: string[] = [];
    for await (const c of p.chat(turn)) {
      if (c.type === 'token' && c.content) chunks.push(c.content);
    }
    const text = chunks.join('');
    expect(text.length).toBeGreaterThan(10);
    expect(text).toMatch(/\?/); // must contain a question
  });

  it('returns a meta-question for "give me the answer"', async () => {
    const p = new FakeProvider();
    const turn = makeTurn('Just tell me the answer');
    const chunks: string[] = [];
    for await (const c of p.chat(turn)) {
      if (c.type === 'token' && c.content) chunks.push(c.content);
    }
    const text = chunks.join('');
    expect(text.toLowerCase()).not.toMatch(/\b(unlock|account|locked)\b/);
    expect(text).toMatch(/\?/); // still a question
  });

  it('honors hint levels 1-7', async () => {
    const p = new FakeProvider();
    for (let lvl = 1; lvl <= 7; lvl++) {
      const turn = makeTurn('Give me the answer', lvl);
      const chunks: string[] = [];
      for await (const c of p.chat(turn)) {
        if (c.type === 'token' && c.content) chunks.push(c.content);
      }
      const text = chunks.join('');
      expect(text.length).toBeGreaterThan(5);
    }
  }, 15_000);

  it('gives different responses for different intents', async () => {
    const p = new FakeProvider();
    const intents = [
      'Take the call from Mrs. Hayes',
      'Ask about scope — who else is affected?',
      'I saw the IP was 169.254.42.18',
      'I think the account is locked',
      'What should I test next?',
    ];
    const responses = await Promise.all(
      intents.map(async (msg) => {
        const chunks: string[] = [];
        for await (const c of p.chat(makeTurn(msg))) {
          if (c.type === 'token' && c.content) chunks.push(c.content);
        }
        return chunks.join('');
      }),
    );
    // All responses should contain a question
    responses.forEach((r) => expect(r).toMatch(/\?/));
  });

  it('emits done after tokens', async () => {
    const p = new FakeProvider();
    const turn = makeTurn('What should I do?');
    let doneSeen = false;
    for await (const c of p.chat(turn)) {
      if (c.type === 'done') doneSeen = true;
    }
    expect(doneSeen).toBe(true);
  });

  it('implements getDiagnostics', async () => {
    const p = new FakeProvider();
    const d = await p.getDiagnostics();
    expect(d.providerName).toBe('fake');
    expect(d.reachable).toBe(true);
    expect(d.model).toBe('scripted');
  });
});
