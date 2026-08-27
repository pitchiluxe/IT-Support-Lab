import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Square, ChevronUp, ChevronDown, Bot, Sparkles, AlertTriangle, RotateCcw } from 'lucide-react';
import { useTutorStore } from './store';
import { FakeProvider } from './fake/FakeProvider';
import { validateTutorResponse, forbiddenFromLab } from './validator';
import type { Lab } from '@/data/labs/lab.schema';

/**
 * The tutor panel. Renders a chat thread with the active provider, plus
 * controls: hint level (1-7), Stop, and a "give me the answer" indicator
 * that lights up when the response was a Socratic meta-question.
 */
export function TutorPanel({
  lab,
  attemptId,
}: {
  lab: Lab;
  attemptId: string;
}) {
  const provider = useTutorStore((s) => s.provider);
  const setProvider = useTutorStore((s) => s.setProvider);
  const sessionId = useTutorStore((s) => s.sessionId);
  const startSession = useTutorStore((s) => s.startSession);
  const hintLevel = useTutorStore((s) => s.hintLevel);
  const setHintLevel = useTutorStore((s) => s.setHintLevel);
  const status = useTutorStore((s) => s.status);
  const streaming = useTutorStore((s) => s.streaming);
  const error = useTutorStore((s) => s.error);
  const turns = useTutorStore((s) => s.turns);
  const send = useTutorStore((s) => s.send);
  const abort = useTutorStore((s) => s.abort);
  const reset = useTutorStore((s) => s.reset);

  const [input, setInput] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  // Bootstrap: create a FakeProvider and a session on mount
  useEffect(() => {
    if (!provider) {
      setProvider(new FakeProvider());
    }
  }, [provider, setProvider]);

  useEffect(() => {
    if (provider && !sessionId) {
      void startSession(attemptId, lab.id);
    }
  }, [provider, sessionId, attemptId, lab.id, startSession]);

  // Auto-scroll the thread when new tokens arrive
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [turns.length, streaming]);

  const forbidden = forbiddenFromLab(lab.decisionPoints);
  const lastAssistant = [...turns].reverse().find((t) => t.role === 'assistant');
  const validation = lastAssistant
    ? validateTutorResponse({
        response: lastAssistant.content,
        forbiddenSubstrings: forbidden,
      })
    : null;
  const blocked = validation && !validation.ok;

  function onSend() {
    const msg = input.trim();
    if (!msg || status === 'streaming') return;
    setInput('');
    void send(msg);
  }

  async function onReset() {
    if (status === 'streaming') return;
    const ok =
      turns.length === 0 ||
      (typeof window !== 'undefined' &&
        window.confirm('Reset the AI tutor conversation? Your current chat will be cleared.'));
    if (!ok) return;
    reset();
    // The useEffect on [provider, sessionId] fires when sessionId becomes null
    // and auto-starts a fresh session — no extra work needed here.
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">AI Tutor</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Sparkles className="mr-1 h-3 w-3" />
              {provider?.name ?? 'fake'}
            </Badge>
            <Badge variant="secondary">Hint {hintLevel}/7</Badge>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => void onReset()}
              disabled={status === 'streaming'}
              aria-label="Reset tutor conversation"
              title="Reset conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Your instructor-style coach. I'll guide you step-by-step through
          diagnosing the issue, ask the right questions, and help you
          understand the reasoning — without giving the final answer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Hint level controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Hint level:</span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => setHintLevel(hintLevel - 1)}
            disabled={hintLevel <= 1}
            aria-label="Decrease hint level"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center text-sm font-medium">{hintLevel}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() => setHintLevel(hintLevel + 1)}
            disabled={hintLevel >= 7}
            aria-label="Increase hint level"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {hintLevel === 1 && 'Pure Socratic'}
            {hintLevel === 2 && 'Narrow next observation'}
            {hintLevel === 3 && 'Commit to a hypothesis'}
            {hintLevel === 4 && 'Identify refuting evidence'}
            {hintLevel === 5 && 'Name the category'}
            {hintLevel === 6 && 'Compare two options'}
            {hintLevel === 7 && 'Type of test (no command)'}
          </span>
        </div>

        {/* Thread */}
        <div
          ref={threadRef}
          className="h-64 overflow-y-auto rounded-md border bg-muted/30 p-3"
          aria-label="Tutor conversation"
        >
          {turns.length === 0 && !streaming && (
            <p className="text-sm text-muted-foreground">
              Hi — I'm your coach for this lab. Tell me what you see on the
              screen, or ask "where do I start?" and I'll walk you through the
              diagnosis step by step.
            </p>
          )}
          {turns.map((t, i) => (
            <Bubble key={i} role={t.role} content={t.content} />
          ))}
          {status === 'streaming' && streaming && (
            <Bubble role="assistant" content={streaming} streaming />
          )}
          {status === 'streaming' && !streaming && (
            <p className="text-xs text-muted-foreground">Tutor is thinking…</p>
          )}
          {blocked && validation && (
            <div className="mt-2 flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 p-2 text-xs text-warning-foreground">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <div>
                <span className="font-medium">Validator caught a possible leak.</span>{' '}
                <span className="text-muted-foreground">Flags: {validation.flags.join(', ')}</span>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what you see, or ask 'where do I start?'…"
            rows={2}
            aria-label="Tutor message"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <div className="flex items-center gap-2">
            {status === 'streaming' ? (
              <Button size="sm" variant="destructive" onClick={abort} aria-label="Stop">
                <Square className="h-3.5 w-3.5" />
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={input.trim().length === 0 || !sessionId}
                onClick={onSend}
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              Cmd/Ctrl + Enter to send
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Bubble({
  role,
  content,
  streaming,
}: {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === 'user';
  return (
    <div className={`mb-2 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={
          isUser
            ? 'max-w-[80%] rounded-md bg-primary/10 px-3 py-2 text-sm'
            : 'max-w-[80%] rounded-md border bg-background px-3 py-2 text-sm'
        }
      >
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          {isUser ? 'You' : 'Tutor'}
          {streaming ? ' · streaming…' : ''}
        </p>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
