import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, FileText } from 'lucide-react';
import { updateTicketNotes, updateTicketResolution, advanceTicketStatus } from './store';
import type { Lab } from '@/data/labs/lab.schema';

/**
 * The inline ticket for a lab attempt. Lets the learner update
 *   - notes (free-form troubleshooting notes)
 *   - resolution (root cause + steps + preventive recommendations)
 * and surfaces the ticket status alongside.
 *
 * Renders only via React text nodes — no `dangerouslySetInnerHTML`.
 */
export function DocumentTab({
  lab,
  attemptId,
  ticketId,
  onNotesSaved,
  onResolutionSaved,
}: {
  lab: Lab;
  attemptId: string;
  ticketId: string;
  onNotesSaved?: () => void;
  onResolutionSaved?: () => void;
}) {
  // lab is reserved for future per-lab ticket validation hooks
  void lab;
  const ticket = useLiveQuery(() => db.tickets.get(ticketId), [ticketId]);
  const evidence = useLiveQuery(
    () => db.evidence.where('attemptId').equals(attemptId).sortBy('createdAt'),
    [attemptId],
  );

  const [notes, setNotes] = useState('');
  const [resolution, setResolution] = useState('');
  const [savedNote, setSavedNote] = useState(false);
  const [savedRes, setSavedRes] = useState(false);

  useEffect(() => {
    if (ticket) {
      setNotes(ticket.notes);
      setResolution(ticket.resolution);
    }
  }, [ticket?.id, ticket?.notes, ticket?.resolution]);

  if (!ticket) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          No ticket yet for this attempt. Use the intake form to create one.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Ticket #{ticket.id.slice(0, 8)}</CardTitle>
        </div>
        <CardDescription>
          {ticket.requester} ({ticket.role}) — {ticket.category}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Read-only fields */}
        <div className="grid gap-2 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2">
          <Field label="Type" value={ticket.type} />
          <Field label="Status" value={ticket.status} />
          <Field label="Priority" value={ticket.priority.toUpperCase()} />
          <Field label="Channel" value={ticket.channel} />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Initial description
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{ticket.description}</p>
        </div>

        {/* Notes (learner-editable) */}
        <div className="space-y-1">
          <label htmlFor="ticket-notes" className="text-xs font-medium text-muted-foreground">
            Troubleshooting notes
          </label>
          <Textarea
            id="ticket-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="What you observed, what you tested, what you ruled out."
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={notes === ticket.notes}
              onClick={() => {
                void updateTicketNotes(ticketId, notes);
                setSavedNote(true);
                setTimeout(() => setSavedNote(false), 2000);
                onNotesSaved?.();
              }}
            >
              <Save className="h-3.5 w-3.5" />
              Save notes
            </Button>
            {savedNote && <span className="text-xs text-success">Saved.</span>}
          </div>
        </div>

        {/* Evidence refs */}
        {evidence && evidence.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Evidence linked ({evidence.length})
            </p>
            <ul className="mt-1 space-y-1 text-xs">
              {evidence.slice(0, 6).map((e) => (
                <li key={e.id} className="rounded border bg-background/50 p-2">
                  <span className="font-medium">{e.title}</span>
                  <span className="text-muted-foreground"> — {e.body.slice(0, 80)}{e.body.length > 80 ? '…' : ''}</span>
                </li>
              ))}
              {evidence.length > 6 && (
                <li className="text-muted-foreground">+{evidence.length - 6} more</li>
              )}
            </ul>
          </div>
        )}

        {/* Resolution (learner-editable) */}
        <div className="space-y-1">
          <label htmlFor="ticket-resolution" className="text-xs font-medium text-muted-foreground">
            Resolution
          </label>
          <Textarea
            id="ticket-resolution"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={4}
            placeholder="Root cause, steps taken, validation, preventive recommendation."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={resolution === ticket.resolution || resolution.trim().length === 0}
              onClick={() => {
                void updateTicketResolution(ticketId, resolution);
                setSavedRes(true);
                setTimeout(() => setSavedRes(false), 2000);
                onResolutionSaved?.();
              }}
            >
              <Save className="h-3.5 w-3.5" />
              Save resolution
            </Button>
            {savedRes && <span className="text-xs text-success">Saved.</span>}
            {ticket.status === 'in-progress' && resolution.trim().length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void advanceTicketStatus(ticketId, 'resolved');
                }}
              >
                Mark resolved
              </Button>
            )}
            {ticket.status === 'resolved' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void advanceTicketStatus(ticketId, 'closed');
                }}
              >
                Close ticket
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">created {timeAgo(ticket.createdAt)}</Badge>
          <Badge variant="outline">updated {timeAgo(ticket.updatedAt)}</Badge>
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

function timeAgo(ts: number): string {
  const ms = Date.now() - ts;
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)} hr ago`;
  return new Date(ts).toLocaleDateString();
}
