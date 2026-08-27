import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileJson, Link as LinkIcon, Printer } from 'lucide-react';
import type { CaseStudy } from './hooks';
import {
  buildMarkdown,
  buildJson,
  downloadFile,
  encodeShareLink,
} from './exporters';

interface Props {
  profileName: string;
  caseStudies: CaseStudy[];
}

export function ExportButton({ profileName, caseStudies }: Props) {
  const [busy, setBusy] = useState<'md' | 'json' | 'share' | null>(null);
  const [shareState, setShareState] = useState<
    | { kind: 'idle' }
    | { kind: 'copied'; url: string }
    | { kind: 'too-large' }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' });

  if (caseStudies.length === 0) return null;

  const isBusy = busy !== null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={() => {
            setBusy('md');
            try {
              const md = buildMarkdown(profileName, caseStudies);
              downloadFile(`portfolio-${Date.now()}.md`, md, 'text/markdown');
            } finally {
              setBusy(null);
            }
          }}
        >
          <FileText className="h-4 w-4" />
          {busy === 'md' ? 'Exporting…' : 'Export Markdown'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={() => {
            setBusy('json');
            try {
              const json = buildJson(profileName, caseStudies);
              downloadFile(`portfolio-${Date.now()}.json`, json, 'application/json');
            } finally {
              setBusy(null);
            }
          }}
        >
          <FileJson className="h-4 w-4" />
          {busy === 'json' ? 'Exporting…' : 'Export JSON'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={async () => {
            setBusy('share');
            setShareState({ kind: 'idle' });
            try {
              const { url, tooLarge } = encodeShareLink(profileName, caseStudies);
              if (tooLarge) {
                setShareState({ kind: 'too-large' });
                return;
              }
              if (!navigator.clipboard) {
                setShareState({ kind: 'error', message: 'Clipboard not available' });
                return;
              }
              await navigator.clipboard.writeText(url);
              setShareState({ kind: 'copied', url });
            } catch (err) {
              setShareState({
                kind: 'error',
                message: err instanceof Error ? err.message : String(err),
              });
            } finally {
              setBusy(null);
            }
          }}
        >
          <LinkIcon className="h-4 w-4" />
          {busy === 'share' ? 'Copying…' : 'Copy share link'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          aria-label="Print portfolio"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <p className="ml-2 text-xs text-muted-foreground">
          <Download className="mr-1 inline h-3 w-3" />
          Files are generated in-browser; nothing is uploaded.
        </p>
      </div>
      {shareState.kind === 'copied' && (
        <p
          className="rounded-md border border-success/40 bg-success/10 px-2 py-1 text-xs text-success"
          role="status"
          aria-live="polite"
        >
          Share link copied. Anyone with the link can view this portfolio (hash-only, never sent to a server).
        </p>
      )}
      {shareState.kind === 'too-large' && (
        <p className="text-xs text-amber-700 dark:text-amber-300" role="status">
          Too much content for a share link. Use Export JSON instead.
        </p>
      )}
      {shareState.kind === 'error' && (
        <p className="text-xs text-destructive" role="status">
          Could not copy: {shareState.message}
        </p>
      )}
    </div>
  );
}
