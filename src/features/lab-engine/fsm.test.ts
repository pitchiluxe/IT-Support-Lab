import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { initialState, transition, isTerminal, availableEvents } from './fsm';
import type { Lab, LabFsmNode } from '@/data/labs/lab.schema';

// Build a small valid lab for property tests
function makeLab(opts: { nodes: string[]; terminal: string[]; required?: Record<string, string> }): Lab {
  const nodes: LabFsmNode[] = opts.nodes.map((id, i) => {
    const next = opts.nodes[i + 1];
    const t = opts.required?.[id];
    return {
      id,
      kind: 'intro',
      title: id,
      body: 'Body',
      transitions: next
        ? [
            {
              event: 'go',
              to: next,
              ...(t ? { requires: [t] } : {}),
            },
          ]
        : [],
    };
  });

  return {
    id: 'test-lab',
    schemaVersion: 1,
    contentVersion: 1,
    week: 1,
    order: 1,
    track: 'service-desk',
    title: 'Test Lab',
    persona: 'Teacher',
    channel: 'phone',
    scenario: 'Scenario',
    impact: 'Impact',
    objectives: ['Objective'],
    tools: ['Tools'],
    evidence: [{ id: 'ev-1', description: 'd', kind: 'note' }],
    decisionPoints: [
      {
        id: 'dp-1',
        prompt: 'p',
        options: [
          { id: 'a', label: 'A', score: { diagnosis: 0, evidence: 0, resolution: 0 }, feedback: 'f' },
          { id: 'b', label: 'B', score: { diagnosis: 0, evidence: 0, resolution: 0 }, feedback: 'f' },
        ],
      },
    ],
    ticket: {
      type: 'incident',
      category: 'c',
      priority: 'p3',
      impact: 'low',
      urgency: 'low',
      sla: 'business-hours',
      initialDescription: 'd',
      requester: { name: 'n', role: 'r' },
    },
    location: {
      id: 'l',
      name: 'L',
      objects: [{ id: 'o', name: 'O', state: {} }],
    },
    nodes,
    startNode: opts.nodes[0]!,
    terminalNodes: opts.terminal,
    scoring: { weights: { diagnosis: 1, evidence: 1, troubleshooting: 1, resolution: 1, validation: 1 }, thresholds: { jobReady: 3 } },
    methodology: ['identify', 'gather-evidence', 'hypothesize', 'test', 'validate', 'document'],
    kbOpportunity: 'k',
    skills: ['customer-service'],
  };
}

describe('lab FSM', () => {
  it('initial state is the start node', () => {
    const lab = makeLab({ nodes: ['A', 'B'], terminal: ['B'] });
    const s = initialState(lab);
    expect(s.node).toBe('A');
    expect(s.variables).toEqual({});
  });

  it('unknown event leaves state unchanged', () => {
    const lab = makeLab({ nodes: ['A', 'B'], terminal: ['B'] });
    const s = initialState(lab);
    const result = transition(lab, s, { event: 'nope' });
    expect(result.changed).toBe(false);
    expect(result.reason).toBe('unknown-event');
  });

  it('known event transitions to the next node', () => {
    const lab = makeLab({ nodes: ['A', 'B'], terminal: ['B'] });
    const result = transition(lab, initialState(lab), { event: 'go' });
    expect(result.changed).toBe(true);
    expect(result.state.node).toBe('B');
  });

  it('requirements gate blocks transition when unmet', () => {
    const lab = makeLab({ nodes: ['A', 'B'], terminal: ['B'], required: { A: 'hypothesis' } });
    const result = transition(lab, initialState(lab), { event: 'go' });
    expect(result.changed).toBe(false);
    expect(result.reason).toBe('requirements-not-met');
  });

  it('requirements pass when variable is set', () => {
    const lab = makeLab({ nodes: ['A', 'B'], terminal: ['B'], required: { A: 'hypothesis' } });
    const s = { node: 'A', variables: { hypothesis: 'because of X' } };
    const result = transition(lab, s, { event: 'go' });
    expect(result.changed).toBe(true);
    expect(result.state.node).toBe('B');
  });

  it('isTerminal true for terminal node', () => {
    const lab = makeLab({ nodes: ['A', 'B'], terminal: ['B'] });
    expect(isTerminal(lab, { node: 'B', variables: {} })).toBe(true);
    expect(isTerminal(lab, { node: 'A', variables: {} })).toBe(false);
  });

  it('availableEvents hides blocked events', () => {
    const lab = makeLab({ nodes: ['A', 'B'], terminal: ['B'], required: { A: 'x' } });
    expect(availableEvents(lab, { node: 'A', variables: {} })).toEqual([]);
    expect(availableEvents(lab, { node: 'A', variables: { x: true } })).toEqual(['go']);
  });

  // Property: a sequence of valid events from the start always ends at a
  // known node (one of nodes or terminal) and never throws.
  it('property: random event sequences stay within the lab graph', () => {
    const lab = makeLab({ nodes: ['A', 'B', 'C', 'D'], terminal: ['D'] });
    const allNodes = new Set(lab.nodes.map((n) => n.title));
    const allEvents = new Set(['go', 'back', 'skip']);

    fc.assert(
      fc.property(fc.array(fc.constantFrom('go', 'back', 'skip'), { minLength: 0, maxLength: 10 }), (events) => {
        let state = initialState(lab);
        for (const event of events) {
          if (!allEvents.has(event)) continue;
          const result = transition(lab, state, { event });
          if (result.changed) {
            expect(allNodes.has(result.state.node)).toBe(true);
            state = result.state;
          }
          // Unchanged is fine
        }
        expect(allNodes.has(state.node)).toBe(true);
      }),
    );
  });

  // Property: terminal nodes have no outgoing transitions.
  it('property: terminal nodes never transition out', () => {
    const lab = makeLab({ nodes: ['A', 'B'], terminal: ['B'] });
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 10 }), (event) => {
        const result = transition(lab, { node: 'B', variables: {} }, { event });
        expect(result.changed).toBe(false);
      }),
    );
  });
});
