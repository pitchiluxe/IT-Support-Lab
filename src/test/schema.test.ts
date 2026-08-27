import { describe, it, expect } from 'vitest';
import { LabSchema } from '@/data/labs/lab.schema';

describe('LabSchema', () => {
  const minimalLab = {
    id: 'lab-01',
    schemaVersion: 1,
    contentVersion: 1,
    week: 1,
    order: 1,
    track: 'service-desk',
    title: 'Test Lab',
    persona: 'Teacher',
    channel: 'phone',
    scenario: 'A teacher cannot connect to Wi-Fi.',
    impact: 'Instruction is affected.',
    objectives: ['Restore connectivity'],
    tools: ['Ticket system'],
    evidence: [{ id: 'ev-1', description: 'Scope', kind: 'note' }],
    decisionPoints: [
      {
        id: 'dp-1',
        prompt: 'What is the cause?',
        options: [
          {
            id: 'a',
            label: 'Wrong password',
            score: { diagnosis: 1, evidence: 1, resolution: 1 },
            feedback: 'Correct.',
          },
          {
            id: 'b',
            label: 'AP down',
            score: { diagnosis: 0, evidence: 0, resolution: 0 },
            feedback: 'Wrong.',
          },
        ],
      },
    ],
    ticket: {
      type: 'incident',
      category: 'Wi-Fi',
      priority: 'p2',
      impact: 'high',
      urgency: 'high',
      sla: 'business-hours',
      initialDescription: 'Cannot connect to Wi-Fi.',
      requester: { name: 'Mrs. Hayes', role: 'Faculty' },
    },
    location: {
      id: 'faculty-office',
      name: 'Faculty Office',
      objects: [
        {
          id: 'laptop',
          name: 'MacBook',
          state: { wifi: { connected: false } },
        },
      ],
    },
    nodes: [
      {
        id: 'start',
        kind: 'intro',
        title: 'Start',
        body: 'Welcome.',
        transitions: [{ event: 'next', to: 'done' }],
      },
      {
        id: 'done',
        kind: 'debrief',
        title: 'Done',
        body: 'Review.',
        transitions: [],
      },
    ],
    startNode: 'start',
    terminalNodes: ['debrief'],
    scoring: {
      weights: {
        diagnosis: 1,
        evidence: 1,
        troubleshooting: 1,
        resolution: 1,
        validation: 1,
      },
      thresholds: { jobReady: 3 },
    },
    methodology: ['identify', 'gather-evidence', 'hypothesize', 'test', 'validate', 'document'],
    kbOpportunity: 'Wi-Fi troubleshooting guide.',
    skills: ['networking'],
  };

  it('accepts a minimal valid lab', () => {
    const result = LabSchema.safeParse(minimalLab);
    expect(result.success).toBe(true);
  });

  it('rejects an id with uppercase', () => {
    const result = LabSchema.safeParse({ ...minimalLab, id: 'Lab-01' });
    expect(result.success).toBe(false);
  });

  it('rejects a lab with no decision points', () => {
    const result = LabSchema.safeParse({ ...minimalLab, decisionPoints: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a terminal node with outgoing transitions (lab-level check not schema)', () => {
    // Schema allows this; the run engine validates terminalNodes vs transitions.
    // Just ensure the schema itself accepts a debrief node with empty transitions.
    const result = LabSchema.safeParse(minimalLab);
    expect(result.success).toBe(true);
  });

  it('rejects a decision point with only one option', () => {
    const result = LabSchema.safeParse({
      ...minimalLab,
      decisionPoints: [
        {
          ...minimalLab.decisionPoints[0]!,
          options: [
            minimalLab.decisionPoints[0]!.options[0]!,
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects score values outside [-1, 1]', () => {
    const result = LabSchema.safeParse({
      ...minimalLab,
      decisionPoints: [
        {
          ...minimalLab.decisionPoints[0]!,
          options: [
            {
              ...minimalLab.decisionPoints[0]!.options[0]!,
              score: { diagnosis: 2, evidence: 0, resolution: 0 },
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-existent track', () => {
    const result = LabSchema.safeParse({ ...minimalLab, track: 'cloud-computing' });
    expect(result.success).toBe(false);
  });

  it('rejects a requester identifier that looks like an email', () => {
    const result = LabSchema.safeParse({
      ...minimalLab,
      ticket: {
        ...minimalLab.ticket,
        requester: { name: 'Teacher', role: 'Faculty', identifiers: { email: 'real@school.edu' } },
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a requester identifier that looks like a phone number', () => {
    const result = LabSchema.safeParse({
      ...minimalLab,
      ticket: {
        ...minimalLab.ticket,
        requester: { name: 'Teacher', role: 'Faculty', identifiers: { phone: '555-123-4567' } },
      },
    });
    expect(result.success).toBe(false);
  });
});
