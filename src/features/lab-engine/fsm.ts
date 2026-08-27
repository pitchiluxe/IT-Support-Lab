import type { Lab, LabFsmNode } from '@/data/labs/lab.schema';

/**
 * A pure lab finite-state machine.
 *
 * State is a tuple of (currentNodeId, variables). Variables let a node's
 * effect deposit information that later nodes can read (e.g. a hypothesis
 * recorded in the HYPOTHESIZE node is surfaced in the DEBRIEF node).
 *
 * Transitions are declared in the lab JSON. Each event is a (name, payload)
 * pair. The engine:
 *  1. finds the current node (by id)
 *  2. looks up transitions for the event name
 *  3. checks the requires (variable gates)
 *  4. applies the transition + any effect
 *  5. returns the new state
 *
 * The engine is pure: it does not write to Dexie. The `run` module wraps
 * the engine with persistence.
 */

export interface FsmState {
  node: string;
  variables: Record<string, unknown>;
}

export interface FsmEventPayload {
  event: string;
  payload?: unknown;
}

export interface FsmTransitionResult {
  state: FsmState;
  changed: boolean;
  reason?: 'unknown-event' | 'requirements-not-met';
}

export function initialState(lab: Lab): FsmState {
  return { node: lab.startNode, variables: {} };
}

export function getNode(lab: Lab, nodeId: string): LabFsmNode {
  const node = lab.nodes.find((n) => n.id === nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }
  return node;
}

function nodeIndex(lab: Lab): Map<string, LabFsmNode> {
  const map = new Map<string, LabFsmNode>();
  for (const n of lab.nodes) {
    if (map.has(n.id)) {
      throw new Error(`Lab has duplicate node id: ${n.id}`);
    }
    map.set(n.id, n);
  }
  return map;
}

/**
 * Apply a single event. Returns a new state. Does not mutate.
 *
 * If the event is unknown for the current node, returns the state unchanged
 * with `changed: false` and `reason: 'unknown-event'`. This is non-fatal:
 * the UI can ignore unknown events safely.
 *
 * If the transition declares `requires: [...]` and any required variable is
 * missing/false, the state is unchanged and the reason is
 * 'requirements-not-met'.
 */
export function transition(
  lab: Lab,
  state: FsmState,
  event: FsmEventPayload,
): FsmTransitionResult {
  const index = nodeIndex(lab);
  const node = index.get(state.node);
  if (!node) {
    throw new Error(`Current node not found: ${state.node}`);
  }

  const t = node.transitions.find((tr) => tr.event === event.event);
  if (!t) {
    return { state, changed: false, reason: 'unknown-event' };
  }

  if (t.requires) {
    for (const key of t.requires) {
      const value = state.variables[key];
      if (!value) {
        return { state, changed: false, reason: 'requirements-not-met' };
      }
    }
  }

  // Apply payload to variables (keyed by event name) so the next node can read it.
  const nextVariables: Record<string, unknown> = { ...state.variables };
  if (event.payload !== undefined) {
    nextVariables[event.event] = event.payload;
  }

  return {
    state: { node: t.to, variables: nextVariables },
    changed: true,
  };
}

/** Check whether the FSM has reached a terminal node. */
export function isTerminal(lab: Lab, state: FsmState): boolean {
  return lab.terminalNodes.includes(state.node);
}

/** List the events that are currently available from the given state. */
export function availableEvents(lab: Lab, state: FsmState): string[] {
  const index = nodeIndex(lab);
  const node = index.get(state.node);
  if (!node) return [];
  return node.transitions
    .filter((t) => {
      if (!t.requires) return true;
      return t.requires.every((k) => Boolean(state.variables[k]));
    })
    .map((t) => t.event);
}
