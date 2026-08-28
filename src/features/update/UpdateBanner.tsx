/**
 * Update banner — listens for Electron auto-updater events and prompts the
 * user to download / install when a new version is available.
 *
 * Only renders when running inside the Electron app (window.app exists).
 * In a normal browser, this component is a no-op.
 */
import { useEffect, useState } from 'react';
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UpdateState = 'idle' | 'available' | 'downloading' | 'downloaded' | 'error';

export function UpdateBanner() {
  const [state, setState] = useState<UpdateState>('idle');
  const [version, setVersion] = useState<string>('');
  const [percent, setPercent] = useState<number>(0);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const win = window;
    if (!win.app) return; // Browser — no update channel

    win.app.onUpdateAvailable((info) => {
      setState('available');
      setVersion(info.version);
      setDismissed(false);
    });

    win.app.onUpdateProgress((p) => {
      setState('downloading');
      setPercent(Math.round(p.percent));
    });

    win.app.onUpdateDownloaded((info) => {
      setState('downloaded');
      setVersion(info.version);
      setPercent(100);
    });
  }, []);

  if (!window.app) return null;
  if (state === 'idle' || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border bg-card p-4 shadow-2xl"
    >
      {state === 'available' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Download className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium">A new version is available</p>
              <p className="text-sm text-muted-foreground">
                v{version} is ready to download.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              Later
            </Button>
            <Button
              size="sm"
              onClick={() => {
                window.app?.downloadUpdate();
                setState('downloading');
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Download update
            </Button>
          </div>
        </div>
      )}

      {state === 'downloading' && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm font-medium">Downloading v{version}… {percent}%</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {state === 'downloaded' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium">Update ready to install</p>
              <p className="text-sm text-muted-foreground">
                v{version} downloaded. Restart to apply.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              On next launch
            </Button>
            <Button size="sm" onClick={() => window.app?.installUpdate()}>
              Restart & install
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
