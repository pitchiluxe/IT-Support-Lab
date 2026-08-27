import type { ReactElement } from 'react';
import { FacultyMacInspect } from './FacultyMacInspect';
import { CampusPhoneInspect } from './CampusPhoneInspect';
import { MacBookInspect } from './MacBookInspect';
import { WindowsPcInspect } from './WindowsPcInspect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Lab } from '@/data/labs/lab.schema';

/**
 * The dispatcher: given a lab-defined object, render the matching inspector.
 * Falls back to a key/value view of the raw state so unknown objects still
 * show useful data instead of failing silently.
 */
export function ObjectInspector({
  objectId,
  state,
  lab,
  attemptId,
}: {
  objectId: string;
  state: Record<string, unknown>;
  lab: Lab;
  attemptId: string;
}): ReactElement {
  switch (objectId) {
    case 'faculty-mac':
      return <FacultyMacInspect state={state} />;
    case 'campus-phone':
      return <CampusPhoneInspect state={state} lab={lab} attemptId={attemptId} />;
    case 'chen-macbook':
      return <MacBookInspect state={state} />;
    case 'facilities-pc':
      return <WindowsPcInspect state={state} />;
    default:
      return <GenericInspector state={state} objectId={objectId} />;
  }
}

function GenericInspector({
  state,
  objectId,
}: {
  state: Record<string, unknown>;
  objectId: string;
}) {
  const entries = Object.entries(state);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Object: {objectId}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {entries.length === 0 && (
          <p className="text-muted-foreground">No state available.</p>
        )}
        {entries.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono text-xs">
              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
