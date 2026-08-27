import type { CaseStudy } from './hooks';

/** Build a Markdown export of the portfolio. */
export function buildMarkdown(profileName: string, caseStudies: CaseStudy[]): string {
  const lines: string[] = [];
  lines.push(`# IT Support Lab Portfolio — ${profileName}`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Labs completed: ${caseStudies.length}`);
  lines.push('');
  lines.push('## Case Studies');
  lines.push('');
  for (const cs of caseStudies) {
    lines.push(`### ${cs.labTitle}`);
    lines.push('');
    lines.push(`**Completed:** ${new Date(cs.completedAt).toLocaleString()}`);
    if (cs.score !== null) lines.push(`**Score:** ${Math.round(cs.score * 100)}%`);
    if (cs.ticket) {
      lines.push(
        `**Ticket type:** ${cs.ticket.type} | **Category:** ${cs.ticket.category} | **Priority:** ${cs.ticket.priority}`,
      );
    }
    lines.push('');
    lines.push('**Scenario**');
    lines.push(cs.scenario);
    lines.push('');
    if (cs.ticket?.description) {
      lines.push('**Initial description**');
      lines.push(cs.ticket.description);
      lines.push('');
    }
    if (cs.ticket?.resolution) {
      lines.push('**Resolution**');
      lines.push(cs.ticket.resolution);
      lines.push('');
    }
    if (cs.evidence.length > 0) {
      lines.push('**Evidence**');
      for (const e of cs.evidence) {
        lines.push(`- [${e.type}] ${e.title}${e.body ? ` — ${e.body.slice(0, 200)}` : ''}`);
      }
      lines.push('');
    }
    if (cs.kbOpportunity) {
      lines.push('**KB opportunity**');
      lines.push(cs.kbOpportunity);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }
  return lines.join('\n');
}

/** Build a JSON export of the portfolio. */
export function buildJson(profileName: string, caseStudies: CaseStudy[]): string {
  return JSON.stringify(
    {
      profile: profileName,
      generatedAt: new Date().toISOString(),
      labCount: caseStudies.length,
      caseStudies,
    },
    null,
    2,
  );
}

/** Trigger a browser download of a string. */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Share link -------------------------------------------------------------
//
// A share link encodes the portfolio as a base64-url JSON blob in the URL
// hash. Hashes are not sent to the server, so the link is privacy-safe: the
// recipient can open it locally and the bytes never leave their browser. The
// URL is intended to be portable but short-lived — full lab evidence can be
// large, so we cap the encoded size and refuse the export if exceeded.

/** Wire shape for the URL hash. */
export interface ShareLinkPayload {
  /** Schema version. Bump if the shape changes. */
  v: 1;
  profile: string;
  generatedAt: string;
  caseStudies: CaseStudy[];
}

const HASH_PREFIX = 'p=';
/** Browsers reliably support ~8 kB URLs; keep the share link well below that. */
const MAX_ENCODED_BYTES = 6000;

function toBase64Url(s: string): string {
  // Use TextEncoder + atob/btoa for unicode-safe base64. Modern browsers
  // support `btoa` only for latin1, so we round-trip through UTF-8.
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded + '==='.slice((padded.length + 3) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeShareLink(
  profileName: string,
  caseStudies: CaseStudy[],
): { url: string; tooLarge: boolean } {
  const payload: ShareLinkPayload = {
    v: 1,
    profile: profileName,
    generatedAt: new Date().toISOString(),
    caseStudies,
  };
  const json = JSON.stringify(payload);
  const encoded = toBase64Url(json);
  const tooLarge = encoded.length > MAX_ENCODED_BYTES;
  if (tooLarge) return { url: '', tooLarge: true };
  const { origin, pathname } = window.location;
  return { url: `${origin}${pathname}#${HASH_PREFIX}${encoded}`, tooLarge: false };
}

export function decodeShareLink(): ShareLinkPayload | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash.startsWith(`#${HASH_PREFIX}`)) return null;
  try {
    const decoded = fromBase64Url(hash.slice(`#${HASH_PREFIX}`.length));
    const parsed = JSON.parse(decoded) as ShareLinkPayload;
    if (parsed.v !== 1) return null;
    if (!Array.isArray(parsed.caseStudies)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearShareLinkHash(): void {
  if (typeof window === 'undefined') return;
  if (window.location.hash.startsWith(`#${HASH_PREFIX}`)) {
    // Replace instead of assign so we don't add to history.
    const { hash: _, ...rest } = window.location;
    void rest;
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}
