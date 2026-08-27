/**
 * Lightweight formatting helpers. Keep this file dependency-free.
 */

export function formatDateTime(input: number | Date): string {
  const date = typeof input === 'number' ? new Date(input) : input;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelative(input: number | Date): string {
  const date = typeof input === 'number' ? new Date(input) : input;
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const absSec = Math.abs(diffSec);
  if (absSec < 60) return formatter.format(diffSec, 'second');
  if (absSec < 3600) return formatter.format(Math.round(diffSec / 60), 'minute');
  if (absSec < 86400) return formatter.format(Math.round(diffSec / 3600), 'hour');
  return formatter.format(Math.round(diffSec / 86400), 'day');
}

export function truncate(text: string, max = 100): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}
