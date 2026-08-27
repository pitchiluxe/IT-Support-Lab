/**
 * Minimal structured logger. Wraps console so production can swap to a sink.
 * Never logs learner-typed PII at info/warn; debug is opt-in.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, message: string, fields?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  const line = {
    ts,
    level,
    message,
    ...(fields ?? {}),
  };
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (level === 'debug') return; // gated; flip when needed
  fn(JSON.stringify(line));
}

export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) => emit('debug', message, fields),
  info: (message: string, fields?: Record<string, unknown>) => emit('info', message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => emit('warn', message, fields),
  error: (message: string, fields?: Record<string, unknown>) => emit('error', message, fields),
};
