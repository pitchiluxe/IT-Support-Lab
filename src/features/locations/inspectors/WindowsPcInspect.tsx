import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Inspector for a Windows 11 desktop (Dell OptiPlex).
 * Used by lab-05 (slow computer).
 */
export function WindowsPcInspect({ state }: { state: Record<string, unknown> }) {
  const os = state['os'] as string | undefined;
  const cpu = state['cpu'] as { name?: string; usage?: number } | undefined;
  const ram = state['ram'] as { total_gb?: number; used_gb?: number; usage?: number } | undefined;
  const diskC = state['disk_c'] as {
    total_gb?: number;
    free_gb?: number;
    free_pct?: number;
    type?: string;
  } | undefined;
  const startupItems = state['startup_items'] as number | undefined;
  const uptimeDays = state['uptime_days'] as number | undefined;
  const lastUpdate = state['last_update'] as string | undefined;
  const antivirus = state['antivirus'] as string | undefined;

  const usageColor = (pct?: number) => {
    if (pct === undefined) return 'outline';
    if (pct >= 90) return 'destructive';
    if (pct >= 70) return 'secondary';
    return 'default';
  };

  const diskColor = (pct?: number) => {
    if (pct === undefined) return 'outline';
    if (pct <= 5) return 'destructive';
    if (pct <= 15) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <FieldRow label="OS" value={os ?? '—'} />
          <FieldRow label="CPU" value={cpu?.name ?? '—'} />
          <FieldRow
            label="Uptime"
            value={uptimeDays !== undefined ? `${uptimeDays} day(s)` : '—'}
          />
          <FieldRow
            label="Last Update"
            value={lastUpdate ?? '—'}
          />
          <FieldRow label="Antivirus" value={antivirus ?? '—'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">CPU</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Usage</span>
            <Badge variant={usageColor(cpu?.usage)}>
              {cpu?.usage ?? 0}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Memory (RAM)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Usage</span>
            <Badge variant={usageColor(ram?.usage)}>
              {ram?.usage ?? 0}%
            </Badge>
          </div>
          <FieldRow
            label="Total / Used"
            value={
              ram
                ? `${ram.used_gb ?? '?'} GB / ${ram.total_gb ?? '?'} GB`
                : '—'
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Disk (C:)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Free</span>
            <Badge variant={diskColor(diskC?.free_pct)}>
              {diskC?.free_gb ?? '?'} GB free ({diskC?.free_pct ?? '?'}%)
            </Badge>
          </div>
          <FieldRow label="Total" value={diskC?.total_gb ? `${diskC.total_gb} GB` : '—'} />
          <FieldRow label="Type" value={diskC?.type ?? '—'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Startup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <FieldRow
            label="Startup Apps"
            value={
              <Badge variant={startupItems !== undefined && startupItems > 10 ? 'secondary' : 'default'}>
                {startupItems ?? '?'} items
              </Badge>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
