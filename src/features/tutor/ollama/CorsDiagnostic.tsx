import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface CorsResult {
  status: 'idle' | 'running' | 'ok' | 'cors-rejected' | 'connection-refused' | 'not-found' | 'error';
  message: string;
  latencyMs?: number;
}

const TEST_URL = 'http://127.0.0.1:11434/api/tags';

/**
 * Runs a CORS preflight check against the Ollama daemon and reports the
 * actual failure mode so the user knows exactly what to fix.
 */
export function CorsDiagnostic({
  onResult,
}: {
  onResult: (result: CorsResult) => void;
}) {
  const [state, setState] = useState<CorsResult>({ status: 'idle', message: '' });
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setState({ status: 'running', message: 'Connecting to Ollama…' });

    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(TEST_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      const ms = Math.round(performance.now() - start);

      if (res.ok) {
        const body = await res.json().catch(() => null);
        const models: string[] = (body?.models ?? []).map((m: { name: string }) => m.name);
        setState({
          status: 'ok',
          message: `Ollama reachable. ${models.length} model(s) installed.`,
          latencyMs: ms,
        });
      } else if (res.status === 0 || res.status === 499) {
        setState({
          status: 'cors-rejected',
          message: 'CORS blocked. Set OLLAMA_ORIGINS=http://localhost:5173 in your Ollama environment and restart `ollama serve`.',
        });
      } else {
        setState({
          status: 'not-found',
          message: `Ollama responded with ${res.status}. Check that /api/tags is supported (requires Ollama 0.1.14+).`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const ms = Math.round(performance.now() - start);
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        setState({
          status: 'connection-refused',
          message: `Could not connect to Ollama at ${TEST_URL}. Is it running? Start with \`ollama serve\`.`,
          latencyMs: ms,
        });
      } else if (message.includes('abort')) {
        setState({
          status: 'connection-refused',
          message: `Connection timed out after 5 seconds. Ollama may not be running.`,
          latencyMs: ms,
        });
      } else if (message.toLowerCase().includes('cors')) {
        setState({
          status: 'cors-rejected',
          message: 'CORS blocked. Set OLLAMA_ORIGINS=http://localhost:5173 and restart.',
        });
      } else {
        setState({
          status: 'error',
          message: `Unexpected error: ${message}`,
          latencyMs: ms,
        });
      }
    }

    setLoading(false);
    setState((prev) => {
      onResult(prev);
      return prev;
    });
  }

  const icon = () => {
    switch (state.status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'cors-rejected':
      case 'connection-refused':
      case 'not-found':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const badgeVariant = (): 'default' | 'destructive' | 'secondary' => {
    if (state.status === 'ok') return 'default';
    return 'destructive';
  };

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant="outline"
        onClick={run}
        disabled={loading}
        aria-label="Run Ollama connection diagnostic"
      >
        {loading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
        {!loading && 'Run diagnostic'}
        {loading && 'Testing…'}
      </Button>

      {state.status !== 'idle' && (
        <div className="flex items-start gap-2 text-sm">
          {icon()}
          <div>
            {state.latencyMs !== undefined && (
              <span className="text-xs text-muted-foreground">{state.latencyMs}ms · </span>
            )}
            <span className="whitespace-pre-wrap">{state.message}</span>
          </div>
        </div>
      )}

      {state.status === 'ok' && (
        <Badge variant={badgeVariant()} className="text-xs">
          Ollama reachable
        </Badge>
      )}
      {state.status === 'cors-rejected' && (
        <Badge variant={badgeVariant()} className="text-xs">
          CORS error
        </Badge>
      )}
      {state.status === 'connection-refused' && (
        <Badge variant={badgeVariant()} className="text-xs">
          Not running
        </Badge>
      )}
    </div>
  );
}
