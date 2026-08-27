import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, PhoneCall, PhoneOff } from 'lucide-react';
import { TicketPanel } from '@/features/tickets/TicketPanel';
import type { Lab } from '@/data/labs/lab.schema';

/**
 * Inspector for a Cisco VoIP phone. The phone is the entry point for the
 * service-desk intake form: clicking "Take call" opens the TicketPanel.
 */
export function CampusPhoneInspect({
  state,
  lab,
  attemptId,
}: {
  state: Record<string, unknown>;
  lab: Lab;
  attemptId: string;
}) {
  const line = state['line'] as string | undefined;
  const status = state['status'] as string | undefined;
  const voicemail = state['voicemail'] as number | undefined;
  const registered = state['registered'] as boolean | undefined;

  const [callActive, setCallActive] = useState(false);

  const statusBadge = () => {
    switch (status) {
      case 'idle':
        return <Badge variant="default">Idle</Badge>;
      case 'busy':
        return <Badge variant="destructive">Busy</Badge>;
      case 'ringing':
        return <Badge variant="secondary">Ringing</Badge>;
      default:
        return <Badge variant="outline">{status ?? 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cisco IP Phone 8841</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <FieldRow label="Extension" value={line ?? '—'} mono />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            {statusBadge()}
          </div>
          <FieldRow
            label="Voicemail"
            value={voicemail === 0 ? 'None' : `${voicemail} message(s)`}
          />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">SIP Registered</span>
            <Badge variant={registered ? 'default' : 'destructive'}>
              {registered ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Call-control actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Call Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!callActive ? (
            <Button
              size="sm"
              onClick={() => setCallActive(true)}
              aria-label="Take call"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              Take call
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCallActive(false)}
              aria-label="End call"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              End call
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active intake form */}
      {callActive && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            Live intake — {lab.ticket.requester.name} on the line
          </p>
          <TicketPanel
            lab={lab}
            attemptId={attemptId}
            defaultTab="intake"
          />
        </div>
      )}
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
