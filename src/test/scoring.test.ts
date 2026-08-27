import { describe, it, expect } from 'vitest';
import { scoreAttempt, type ScoreInputs } from '@/features/scoring/rubric';
import { LabSchema, type Lab } from '@/data/labs/lab.schema';

function makeLab(): Lab {
  return LabSchema.parse({
    id: 'lab-test',
    schemaVersion: 1,
    contentVersion: 1,
    week: 1,
    order: 1,
    startNode: 'intro',
    terminalNodes: ['done'],
    track: 'service-desk',
    title: 'Test Lab',
    persona: 'Test Persona',
    channel: 'phone',
    scenario: 'Test scenario',
    impact: 'Test impact',
    objectives: ['obj1'],
    tools: ['Mac', 'phone'],
    evidence: [{ id: 'ev1', description: 'Photo of error', kind: 'screenshot' }],
    decisionPoints: [
      {
        id: 'dp1',
        prompt: 'Pick a cause',
        options: [
          {
            id: 'a',
            label: 'A',
            score: { diagnosis: 1, evidence: 1, resolution: 1 },
            feedback: 'Good',
          },
          {
            id: 'b',
            label: 'B',
            score: { diagnosis: -1, evidence: -1, resolution: -1 },
            feedback: 'Bad',
          },
        ],
      },
    ],
    ticket: {
      type: 'incident',
      category: 'network',
      priority: 'p2',
      impact: 'medium',
      urgency: 'medium',
      sla: 'business-hours',
      initialDescription: 'Test',
      requester: { name: 'Caller', role: 'Faculty' },
    },
    location: {
      id: 'faculty-office',
      name: 'Faculty Office',
      objects: [
        { id: 'mac', name: 'Mac', kind: 'mac', state: {} },
        { id: 'phone', name: 'Phone', kind: 'phone', state: {} },
      ],
    },
    nodes: [
      { id: 'intro', kind: 'intro', title: 'Intro', body: 'Welcome.' },
      { id: 'done', kind: 'debrief', title: 'Done', body: 'Wrap up.' },
    ],
    scoring: {
      weights: { diagnosis: 1, evidence: 1, troubleshooting: 1, resolution: 1, validation: 1 },
      thresholds: { jobReady: 3 },
    },
    methodology: ['identify', 'scope', 'reproduce'],
    kbOpportunity: 'Write a KB article about Wi-Fi recovery.',
    skills: ['ticketing'],
  });
}

function baseInputs(overrides: Partial<ScoreInputs> = {}): ScoreInputs {
  return {
    lab: makeLab(),
    decisions: [],
    evidence: [],
    actions: [],
    terminalNodeId: null,
    remediated: false,
    notes: '',
    resolution: '',
    ...overrides,
  };
}

describe('scoring rubric', () => {
  it('gold path scores higher than error path on technical', () => {
    const gold = scoreAttempt(
      baseInputs({
        decisions: [{ decisionPointId: 'dp1', choice: 'a', ts: 1 }],
        terminalNodeId: 'done',
        remediated: true,
        evidence: [{ id: 'e1', title: 'Photo of error', body: '', type: 'screenshot' }],
        actions: [
          { kind: 'inspect' },
          { kind: 'remediate' },
        ],
        notes: 'Investigated wifi, found AP down, reset. Working now.',
        resolution:
          'Mrs. Hayes — we restarted the access point and your Mac is back online. Sorry for the trouble!',
      }),
    );
    const err = scoreAttempt(
      baseInputs({
        decisions: [{ decisionPointId: 'dp1', choice: 'b', ts: 1 }],
        terminalNodeId: 'done',
        remediated: false,
        evidence: [],
        actions: [{ kind: 'remediate' }],
        notes: '',
        resolution: '',
      }),
    );
    expect(gold.technicalPct).toBeGreaterThan(err.technicalPct);
    expect(gold.professionalPct).toBeGreaterThan(err.professionalPct);
  });

  it('rewards a thorough resolution note on customer-communication', () => {
    const short = scoreAttempt(baseInputs({ resolution: 'ok' }));
    const thorough = scoreAttempt(
      baseInputs({
        resolution:
          'Dear Mrs. Hayes, we identified the access point had lost power and reset it. Your Mac is back online. Please let us know if anything else seems off — thank you for your patience.',
      }),
    );
    expect(thorough.professional['customer-communication']).toBe(2);
    expect(short.professional['customer-communication']).toBeLessThanOrEqual(1);
  });

  it('rewards evidence collection on sla-awareness', () => {
    const missing = scoreAttempt(baseInputs({ evidence: [] }));
    const present = scoreAttempt(
      baseInputs({
        evidence: [{ id: 'e1', title: 'Photo of error', body: '', type: 'screenshot' }],
      }),
    );
    expect(present.professional['sla-awareness']).toBe(2);
    expect(missing.professional['sla-awareness']).toBe(0);
  });

  it('escalation log gives 1 point', () => {
    const none = scoreAttempt(baseInputs({}));
    const escalated = scoreAttempt(baseInputs({ actions: [{ kind: 'escalate' }] }));
    expect(escalated.professional.escalation).toBe(1);
    expect(none.professional.escalation).toBe(0);
  });

  it('weighted percentage honors zero-weight categories', () => {
    const lab = makeLab();
    const noDiagnosis = {
      ...lab,
      scoring: { ...lab.scoring, weights: { diagnosis: 0, evidence: 1, troubleshooting: 1, resolution: 1, validation: 1 } },
    };
    const r = scoreAttempt(baseInputs({ lab: noDiagnosis }));
    expect(r.technicalPct).toBe(0);
  });

  it('strengths and weaknesses are bounded to 3 each', () => {
    const r = scoreAttempt(
      baseInputs({
        decisions: [{ decisionPointId: 'dp1', choice: 'a', ts: 1 }],
        terminalNodeId: 'done',
        remediated: true,
        evidence: [{ id: 'e1', title: 'Photo of error', body: '', type: 'screenshot' }],
        actions: [{ kind: 'inspect' }],
        notes: 'a',
        resolution: 'a',
      }),
    );
    expect(r.strengths.length).toBeLessThanOrEqual(3);
    expect(r.weaknesses.length).toBeLessThanOrEqual(3);
  });

  it('returns 0 pcts for empty inputs', () => {
    const r = scoreAttempt(baseInputs());
    expect(r.technicalPct).toBe(0);
    expect(r.professionalPct).toBe(0);
    expect(r.areaContribution.ticketing).toBe(1);
  });
});
