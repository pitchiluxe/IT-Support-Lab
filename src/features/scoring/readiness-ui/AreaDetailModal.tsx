import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db/client';
import { SKILL_AREA_LABELS, type SkillArea } from '@/data/skills/areas';
import { LAB_MANIFEST } from '@/data/labs/manifest';
import { PlayCircle, CheckCircle2, Circle } from 'lucide-react';

interface Props {
  profileId: string;
  area: SkillArea | null;
  onClose: () => void;
}

export function AreaDetailModal({ profileId, area, onClose }: Props) {
  const labsInArea = area ? LAB_MANIFEST.filter((l) => l.skills.includes(area) && l.contentPath) : [];

  const attempts = useLiveQuery(
    () => (area ? db.attempts.where('profileId').equals(profileId).toArray() : []),
    [profileId, area],
  );

  if (!area) return null;

  const attemptByLab = new Map<string, { status: string; score: number | null }>();
  for (const a of attempts ?? []) {
    attemptByLab.set(a.labId, { status: a.status, score: a.score });
  }

  const attempted = labsInArea.filter((l) => attemptByLab.has(l.id));
  const notStarted = labsInArea.filter((l) => !attemptByLab.has(l.id));
  const completed = attempted.filter((l) => attemptByLab.get(l.id)?.status === 'completed');
  const inProgress = attempted.filter((l) => attemptByLab.get(l.id)?.status === 'in-progress');

  return (
    <Dialog open={!!area} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl" aria-describedby={`area-${area}-description`}>
        <DialogHeader>
          <DialogTitle>{SKILL_AREA_LABELS[area]}</DialogTitle>
          <DialogDescription id={`area-${area}-description`}>
            {labsInArea.length} lab{labsInArea.length === 1 ? '' : 's'} exercise this skill area. {completed.length} completed, {inProgress.length} in progress, {notStarted.length} not started.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {labsInArea.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No labs are wired to this area yet.
            </p>
          )}

          {completed.length > 0 && (
            <Section heading="Completed" icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />}>
              {completed.map((lab) => {
                const att = attemptByLab.get(lab.id);
                return (
                  <LabRow
                    key={lab.id}
                    lab={lab}
                    status="completed"
                    score={att?.score ?? null}
                  />
                );
              })}
            </Section>
          )}

          {inProgress.length > 0 && (
            <Section heading="In progress" icon={<PlayCircle className="h-4 w-4 text-blue-600" aria-hidden="true" />}>
              {inProgress.map((lab) => (
                <LabRow key={lab.id} lab={lab} status="in-progress" score={null} />
              ))}
            </Section>
          )}

          {notStarted.length > 0 && (
            <Section heading="Not started" icon={<Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}>
              {notStarted.map((lab) => (
                <LabRow key={lab.id} lab={lab} status="not-started" score={null} />
              ))}
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ heading, icon, children }: { heading: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {heading}
      </h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function LabRow({ lab, status, score }: { lab: { id: string; title: string; week: number }; status: string; score: number | null }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border bg-card p-3">
      <div>
        <p className="text-sm font-medium">{lab.title}</p>
        <p className="text-xs text-muted-foreground">Week {lab.week}</p>
      </div>
      <div className="flex items-center gap-2">
        {status === 'completed' && score !== null && (
          <Badge variant="success">{Math.round(score * 100)}%</Badge>
        )}
        <Link to={`/lab/${lab.id}`}>
          <Button size="sm" variant={status === 'not-started' ? 'default' : 'outline'}>
            {status === 'completed' ? 'Review' : status === 'in-progress' ? 'Resume' : 'Start'}
          </Button>
        </Link>
      </div>
    </li>
  );
}
