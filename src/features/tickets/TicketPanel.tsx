import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { IntakeForm } from './IntakeForm';
import { DocumentTab } from './DocumentTab';
import { getTicketTimeline, getOrCreateTicket } from './store';
import type { Lab } from '@/data/labs/lab.schema';

/**
 * The composite ticket surface: tabs for Intake / Document / Timeline.
 * The intake tab is what the learner uses when they pick up the phone.
 * The document tab is the inline ticket for notes + resolution.
 * The timeline tab shows the append-only ticketEvents log.
 */
export function TicketPanel({
  lab,
  attemptId,
  onIntakeComplete,
  defaultTab = 'document',
}: {
  lab: Lab;
  attemptId: string;
  onIntakeComplete?: () => void;
  defaultTab?: 'intake' | 'document' | 'timeline';
}) {
  const [tab, setTab] = useState(defaultTab);
  const ticket = useLiveQuery(
    () => db.tickets.where('attemptId').equals(attemptId).first(),
    [attemptId],
  );

  // Auto-create ticket on first render so the document/timeline tabs work
  useEffect(() => {
    void getOrCreateTicket(attemptId, lab);
  }, [lab, attemptId]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Ticket</CardTitle>
            <CardDescription>
              {lab.ticket.requester.name} · {lab.ticket.category} · {lab.ticket.priority.toUpperCase()}
            </CardDescription>
          </div>
          {ticket && <Badge variant="outline">{ticket.status}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="intake">Intake</TabsTrigger>
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="intake" className="pt-2">
            <IntakeForm
              lab={lab}
              attemptId={attemptId}
              nextEvent="intake-recorded"
              onComplete={() => {
                onIntakeComplete?.();
                setTab('document');
              }}
            />
          </TabsContent>
          <TabsContent value="document" className="pt-2">
            {ticket ? (
              <DocumentTab
                lab={lab}
                attemptId={attemptId}
                ticketId={ticket.id}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Initializing ticket…</p>
            )}
          </TabsContent>
          <TabsContent value="timeline" className="pt-2">
            {ticket ? <TimelineView ticketId={ticket.id} /> : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TimelineView({ ticketId }: { ticketId: string }) {
  const events = useLiveQuery(
    () => getTicketTimeline(ticketId),
    [ticketId],
  );

  if (!events) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No events yet.</p>;

  return (
    <ol className="space-y-2 text-sm">
      {events.map((e) => (
        <li key={e.id} className="flex gap-2">
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {new Date(e.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <Badge variant="outline" className="shrink-0">
            {e.actor}
          </Badge>
          <span className="font-medium">{e.kind}</span>
          {e.payload && (
            <span className="truncate text-muted-foreground">
              — {e.payload.length > 80 ? `${e.payload.slice(0, 80)}…` : e.payload}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
