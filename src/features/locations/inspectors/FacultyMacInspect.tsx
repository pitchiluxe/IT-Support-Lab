import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/** Inspector for a macOS MacBook that has Wi-Fi diagnostic state. */
export function FacultyMacInspect({ state }: { state: Record<string, unknown> }) {
  const wifi = state['wifi'] as { ssid?: string; connected?: boolean; lastAuthError?: string } | undefined;
  const ip = state['ip'] as string | undefined;
  const mac = state['mac'] as string | undefined;
  const os = state['os'] as string | undefined;
  const lastSeen = state['lastSeen'] as number | undefined;
  const battery = state['battery'] as number | undefined;

  const lastSeenLabel = lastSeen
    ? new Date(lastSeen).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'Unknown';

  const ipLabel = ip
    ? ip.startsWith('169.254')
      ? `${ip}  ← APIPA (no DHCP)`
      : ip
    : 'No IP';

  return (
    <div className="space-y-4">
      {/* OS / hardware */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Device Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <FieldRow label="Operating System" value={os ?? 'Unknown'} />
          <FieldRow label="MAC Address" value={mac ?? '—'} mono />
          <FieldRow
            label="Battery"
            value={battery !== undefined ? `${battery}%` : '—'}
          />
          <FieldRow label="Last Activity" value={lastSeenLabel} />
        </CardContent>
      </Card>

      {/* Wi-Fi */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Wi-Fi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge
              variant={wifi?.connected ? 'default' : 'destructive'}
              className="shrink-0"
            >
              {wifi?.connected ? 'Connected' : 'Disconnected'}
            </Badge>
            <span className="text-muted-foreground">{wifi?.ssid ?? '—'}</span>
          </div>
          <FieldRow label="IP Address" value={ipLabel} mono />
          {wifi?.lastAuthError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-2 text-xs text-destructive">
              Auth error: {wifi.lastAuthError}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Document the IP address and auth error as evidence before proceeding.
      </p>
    </div>
  );
}

function FieldRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  );
}
