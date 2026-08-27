import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Save } from 'lucide-react';
import { getOrCreateTicket, updateTicketDescription } from './store';
import type { Lab } from '@/data/labs/lab.schema';

/**
 * The intake form shown when the learner clicks the phone in a 2D panel.
 * Pre-fills the requester (name + role + extension/location) from the lab
 * JSON and lets the learner fill in the caller's reported description.
 *
 * On save: creates a ticket (if not yet), updates description, dispatches
 * the lab event so the FSM can advance.
 */
export function IntakeForm({
  lab,
  attemptId,
  nextEvent,
  onComplete,
}: {
  lab: Lab;
  attemptId: string;
  nextEvent: string;
  onComplete?: () => void;
}) {
  // nextEvent is reserved for the future per-node event override
  void nextEvent;
  const ticket = useLiveQuery(
    () => db.tickets.where('attemptId').equals(attemptId).first(),
    [attemptId],
  );

  const [description, setDescription] = useState(lab.ticket.initialDescription);
  const [callerExtension, setCallerExtension] = useState(
    (lab.ticket.requester.identifiers?.['extension'] as string | undefined) ?? '',
  );
  const [callerLocation, setCallerLocation] = useState(
    (lab.ticket.requester.identifiers?.['location'] as string | undefined) ?? '',
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ticket) {
      setDescription(ticket.description);
    }
  }, [ticket?.id, ticket?.description]);

  async function handleSave() {
    const t = await getOrCreateTicket(attemptId, lab);
    const fullDescription =
      `[Channel: ${lab.channel}] [Ext: ${callerExtension || '—'}] [Location: ${callerLocation || '—'}]\n\n${description.trim()}`;
    await updateTicketDescription(t.id, fullDescription);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onComplete?.();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Service Desk Intake</CardTitle>
        </div>
        <CardDescription>
          Document the call. Pre-filled from the lab scenario — adjust only if the
          caller gives different information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Read-only caller info */}
        <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2">
          <Field label="Caller" value={lab.ticket.requester.name} />
          <Field label="Role" value={lab.ticket.requester.role} />
          <Field label="Channel" value={lab.channel} />
          <Field label="Category" value={lab.ticket.category} />
        </div>

        {/* Editable context */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="ext" className="text-xs font-medium text-muted-foreground">
              Extension
            </label>
            <Input
              id="ext"
              value={callerExtension}
              onChange={(e) => setCallerExtension(e.target.value)}
              placeholder="ext. 4521"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="loc" className="text-xs font-medium text-muted-foreground">
              Location
            </label>
            <Input
              id="loc"
              value={callerLocation}
              onChange={(e) => setCallerLocation(e.target.value)}
              placeholder="rm. 12B"
            />
          </div>
        </div>

        {/* Reported issue */}
        <div className="space-y-1">
          <label htmlFor="desc" className="text-xs font-medium text-muted-foreground">
            What did the caller report?
          </label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="One or two sentences in the caller's words. Quote any error messages."
          />
        </div>

        {/* Priority badge (read-only, from lab seed) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Priority:</span>
          <Badge variant="outline">{lab.ticket.priority.toUpperCase()}</Badge>
          <Badge variant="secondary">Impact: {lab.ticket.impact}</Badge>
          <Badge variant="secondary">Urgency: {lab.ticket.urgency}</Badge>
          <Badge variant="outline">SLA: {lab.ticket.sla}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={description.trim().length === 0}
            onClick={() => {
              void handleSave();
            }}
          >
            <Save className="h-3.5 w-3.5" />
            Save intake
          </Button>
          {saved && <span className="text-xs text-success">Ticket created and updated.</span>}
          {ticket && (
            <span className="ml-auto text-xs text-muted-foreground">
              Ticket {ticket.id.slice(0, 8)} · status {ticket.status}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
