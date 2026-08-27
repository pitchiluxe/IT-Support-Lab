import type {
  TutorChunk,
  TutorDiagnostics,
  TutorProvider,
  TutorTurn,
} from '../provider';
import { buildCoachPrompt, isWithinBudget, TOKEN_BUDGET } from '../prompt';
import { validateTutorResponse, forbiddenFromLab } from '../validator';
import type { Lab } from '@/data/labs/lab.schema';

/**
 * The Ollama provider. Talks to a local Ollama daemon on 127.0.0.1:11434
 * via the `/api/chat` streaming endpoint.
 *
 * Hard requirements (see docs/CORS.md):
 *  - The Ollama daemon must be started with `OLLAMA_ORIGINS` set to allow
 *    this app's origin, or the requests will be rejected by CORS.
 *  - The model must be pulled first (`ollama pull llama3.2`).
 *
 * Cancellable: each chat() call passes the AbortSignal to fetch() so that
 * "Stop" in the UI immediately terminates the request and the abort
 * signal cascades into the response stream.
 */

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature: number;
  /** Decision option labels and feedback — passed to the validator. */
  forbiddenSubstrings: string[];
  /** Maximum retries when the validator catches a leak. */
  maxRetries: number;
}

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: DEFAULT_BASE_URL,
  model: 'llama3.2',
  temperature: 0.2,
  forbiddenSubstrings: [],
  maxRetries: 2,
};

interface OllamaChatRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  stream: true;
  options: { temperature: number };
}

interface OllamaChatChunk {
  model: string;
  created_at: string;
  message: { role: 'assistant'; content: string };
  done: boolean;
  done_reason?: string;
}

interface OllamaTag {
  name: string;
  modified_at: string;
  size: number;
}

interface OllamaTagsResponse {
  models: OllamaTag[];
}

export class OllamaProvider implements TutorProvider {
  readonly name = 'ollama' as const;

  private aborted = false;
  private config: OllamaConfig;
  private lab: Lab | null;

  constructor(config: Partial<OllamaConfig> = {}, lab: Lab | null = null) {
    this.config = { ...DEFAULT_OLLAMA_CONFIG, ...config };
    this.lab = lab;
  }

  /** Update the model and baseUrl. */
  setConfig(patch: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...patch };
  }

  abort(): void {
    this.aborted = true;
  }

  /** GET /api/tags — list installed models. */
  async listModels(baseUrl: string = this.config.baseUrl): Promise<OllamaTag[]> {
    const res = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Ollama /api/tags returned ${res.status}`);
    }
    const body = (await res.json()) as OllamaTagsResponse;
    return body.models ?? [];
  }

  async getDiagnostics(): Promise<TutorDiagnostics> {
    try {
      const models = await this.listModels();
      const modelInstalled = models.some((m) => m.name === this.config.model);
      return {
        providerName: 'ollama',
        model: this.config.model,
        reachable: true,
        ...(modelInstalled
          ? undefined
          : { hint: `Model "${this.config.model}" is not installed. Run: ollama pull ${this.config.model}` }),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        providerName: 'ollama',
        model: this.config.model,
        reachable: false,
        hint: classifyFetchError(message),
      };
    }
  }

  async *chat(turn: TutorTurn): AsyncIterable<TutorChunk> {
    this.aborted = false;
    const prompt = buildCoachPrompt(
      turn.context,
      turn.hintLevel,
      turn.history,
      turn.user,
    );

    if (!isWithinBudget(prompt)) {
      yield {
        type: 'error',
        error: {
          kind: 'network',
          message: `Prompt is ${prompt.approxTokens} tokens, exceeds budget of ${TOKEN_BUDGET}.`,
        },
      };
      return;
    }

    // Refuse to send the prompt if the lab reference is missing the
    // forbidden-substring list. The validator needs to know the option
    // labels and feedback strings to catch leaks; without them it cannot
    // do its job.
    const forbidden =
      this.config.forbiddenSubstrings.length > 0
        ? this.config.forbiddenSubstrings
        : this.lab
        ? forbiddenFromLab(this.lab.decisionPoints)
        : [];

    let attempt = 0;
    let lastResponse = '';

    while (attempt <= this.config.maxRetries) {
      attempt++;
      const messages: OllamaChatRequest['messages'] = [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ];
      const body: OllamaChatRequest = {
        model: this.config.model,
        messages,
        stream: true,
        options: { temperature: this.config.temperature },
      };

      let acc = '';
      let errored: TutorChunk['error'] | null = null;
      try {
        const res = await fetch(`${this.config.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: turn.signal,
        });

        if (!res.ok) {
          errored = {
            kind: 'network',
            message: `Ollama /api/chat returned ${res.status}`,
          };
        } else if (!res.body) {
          errored = { kind: 'network', message: 'Ollama returned no body' };
        } else {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            if (turn.signal.aborted || this.aborted) {
              try {
                await reader.cancel();
              } catch {
                // ignore
              }
              yield {
                type: 'error',
                error: { kind: 'aborted', message: 'Cancelled by user' },
              };
              return;
            }
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            // Ollama streams one JSON object per line (NDJSON)
            for (const line of buffer.split('\n')) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try {
                const chunk = JSON.parse(trimmed) as OllamaChatChunk;
                if (chunk.message?.content) {
                  acc += chunk.message.content;
                  yield { type: 'token', content: chunk.message.content };
                }
                if (chunk.done) {
                  buffer = '';
                  break;
                }
              } catch {
                // Incomplete line — keep buffering
              }
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (turn.signal.aborted || this.aborted) {
          yield {
            type: 'error',
            error: { kind: 'aborted', message: 'Cancelled by user' },
          };
          return;
        }
        errored = {
          kind: 'network',
          message: classifyFetchError(message),
        };
      }

      if (errored) {
        yield { type: 'error', error: errored };
        return;
      }

      lastResponse = acc;

      // Post-validate the response. If the validator catches a leak, retry
      // with the *same* prompt and a higher hint level that pushes the
      // model harder toward a Socratic question. The retry uses one
      // additional hint step but never exceeds 7.
      const validation = validateTutorResponse({
        response: acc,
        forbiddenSubstrings: forbidden,
      });

      if (validation.ok) {
        yield { type: 'done' };
        return;
      }

      // Leak detected — try once more with a higher hint level, unless
      // we're already at the top. The model is supposed to be Socratic;
      // higher hint = more direct about which category of thing to look at.
      if (attempt > this.config.maxRetries || turn.hintLevel >= 7) {
        yield {
          type: 'error',
          error: {
            kind: 'leak-detected',
            message: `Validator rejected response: ${validation.flags.join(', ')}`,
          },
        };
        return;
      }
      // Re-enter the loop with a higher hint level
      turn.hintLevel = Math.min(7, turn.hintLevel + 1);
    }

    // All retries exhausted
    yield {
      type: 'error',
      error: {
        kind: 'leak-detected',
        message: `Validator rejected ${this.config.maxRetries} attempts. Last response kept: ${lastResponse.slice(0, 80)}…`,
      },
    };
  }
}

/** Map raw fetch error messages to user-actionable hints. */
function classifyFetchError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('failed to fetch') || m.includes('networkerror')) {
    return 'Could not reach Ollama. Is it running? Start with `ollama serve`.';
  }
  if (m.includes('cors')) {
    return 'CORS blocked the request. Set OLLAMA_ORIGINS=http://localhost:5173 and restart Ollama.';
  }
  if (m.includes('abort')) {
    return 'Request was cancelled.';
  }
  if (m.includes('404')) {
    return 'Endpoint not found. Check the Ollama version (api/chat requires 0.1.14+).';
  }
  if (m.includes('500')) {
    return 'Ollama returned 500. Check `ollama serve` logs.';
  }
  return message;
}
