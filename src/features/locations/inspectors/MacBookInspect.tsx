import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Inspector for a generic macOS MacBook.
 * Used by lab-11 (macOS connectivity).
 */
export function MacBookInspect({ state }: { state: Record<string, unknown> }) {
  const wifi = state['wifi'] as {
    ssid?: string;
    connected?: boolean;
    signal?: number;
    channel?: number;
  } | undefined;
  const ip = state['ip'] as string | undefined;
  const router = state['router'] as string | undefined;
  const dns = state['dns'] as { servers?: string[]; search_domain?: string } | undefined;
  const dnsWorking = state['dns_working'] as boolean | undefined;
  const pingExternal = state['ping_external'] as boolean | undefined;
  const proxy = state['proxy'] as { enabled?: boolean } | undefined;
  const model = state['model'] as string | undefined;
  const os = state['os'] as string | undefined;

  const signalBars = (s?: number) => {
    if (s === undefined) return null;
    if (s >= -50) return 'Excellent';
    if (s >= -60) return 'Good';
    if (s >= -70) return 'Fair';
    return 'Weak';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">MacBook Pro — System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <FieldRow label="Model" value={model ?? '—'} />
          <FieldRow label="OS" value={os ?? '—'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Network</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge
              variant={wifi?.connected ? 'default' : 'destructive'}
            >
              {wifi?.connected ? 'Connected' : 'Disconnected'}
            </Badge>
            <span className="text-muted-foreground">{wifi?.ssid ?? '—'}</span>
          </div>
          <FieldRow label="IP Address" value={ip ?? '—'} mono />
          <FieldRow label="Router" value={router ?? '—'} mono />
          <FieldRow
            label="Signal"
            value={signalBars(wifi?.signal) ?? '—'}
          />
          <FieldRow
            label="Channel"
            value={wifi?.channel ? String(wifi.channel) : '—'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">DNS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <FieldRow
            label="DNS Working"
            value={
              <Badge variant={dnsWorking ? 'default' : 'destructive'}>
                {dnsWorking ? 'Yes' : 'No'}
              </Badge>
            }
          />
          <FieldRow
            label="DNS Servers"
            value={dns?.servers?.join(', ') ?? '—'}
            mono
          />
          <FieldRow label="Search Domain" value={dns?.search_domain ?? '—'} mono />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Connectivity Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ping 8.8.8.8</span>
            <Badge variant={pingExternal ? 'default' : 'destructive'}>
              {pingExternal ? 'Success' : 'Failed'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Proxy</span>
            <Badge variant={proxy?.enabled ? 'secondary' : 'outline'}>
              {proxy?.enabled ? 'Enabled' : 'Off'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FieldRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  );
}
