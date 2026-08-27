import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, PlayCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import type { SkillArea } from '@/data/skills/areas';
import { SKILL_AREA_LABELS } from '@/data/skills/areas';
import { READINESS_THRESHOLDS } from '../readiness';
import type { AreaReadiness } from '../hooks';
import { cn } from '@/lib/utils';

/** Map a readiness level to (badge label, badge variant, ring color, optional
 *  glow class). The two "in-progress" levels (learning & developing) share
 *  the same green "In progress" label and pulsing glow so the learner can
 *  see their active areas at a glance. "not-started" glows red. */
const LEVEL_STYLES: Record<
  AreaReadiness['level'],
  {
    label: string;
    badge: 'glowGreen' | 'glowRed' | 'success' | 'strong' | 'secondary';
    ring: string;
    glow: string;
  }
> = {
  'not-started': {
    label: 'Not started',
    badge: 'glowRed',
    ring: 'ring-red-500/40',
    glow: 'animate-pulse-glow-red',
  },
  learning: {
    label: 'In progress',
    badge: 'glowGreen',
    ring: 'ring-emerald-500/40',
    glow: 'animate-pulse-glow-green',
  },
  developing: {
    label: 'In progress',
    badge: 'glowGreen',
    ring: 'ring-emerald-500/40',
    glow: 'animate-pulse-glow-green',
  },
  'job-ready': {
    label: 'Job-ready',
    badge: 'success',
    ring: 'ring-emerald-500/30',
    glow: '',
  },
  strong: {
    label: 'Strong',
    badge: 'strong',
    ring: 'ring-amber-500/50',
    glow: '',
  },
};

interface Props {
  area: SkillArea;
  readiness: AreaReadiness;
  labCount: number;
  onSelect: (area: SkillArea) => void;
}

export function ReadinessAreaCard({ area, readiness, labCount, onSelect }: Props) {
  const style = LEVEL_STYLES[readiness.level] ?? LEVEL_STYLES['not-started']!;
  const nextStyle = readiness.nextLevel ? LEVEL_STYLES[readiness.nextLevel] : null;
  const progressPct = readiness.nextLevel
    ? Math.min(100, (readiness.evidenceCount / evidenceForNext(readiness.level)) * 100)
    : 100;
  const Icon = readiness.level === 'not-started' ? Lock : readiness.level === 'strong' ? CheckCircle2 : TrendingUp;

  return (
    <Card
      className={cn('cursor-pointer transition hover:ring-2', style.ring)}
      onClick={() => onSelect(area)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(area);
        }
      }}
      aria-label={`${SKILL_AREA_LABELS[area]} — ${style.label}, ${readiness.evidenceCount} evidence-backed attempts`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{SKILL_AREA_LABELS[area]}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <CardDescription>
          {labCount} lab{labCount === 1 ? '' : 's'} in this area
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge
            variant={style.badge}
            className={cn('flex-shrink-0 whitespace-nowrap', style.glow)}
            aria-label={`Current level: ${style.label}`}
          >
            {style.label}
          </Badge>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{readiness.evidenceCount} evidence</span>
            {readiness.nextLevel && nextStyle ? (
              <span>{readiness.evidenceNeeded} more for {nextStyle.label.toLowerCase()}</span>
            ) : (
              <span>Top level reached</span>
            )}
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(area);
          }}
        >
          <PlayCircle className="h-3.5 w-3.5" />
          {readiness.level === 'not-started' ? 'Start a lab' : 'View labs'}
        </Button>
      </CardContent>
    </Card>
  );
}

function evidenceForNext(level: AreaReadiness['level']): number {
  switch (level) {
    case 'not-started':
    case 'learning':
      return READINESS_THRESHOLDS.jobReady;
    case 'developing':
      return READINESS_THRESHOLDS.jobReady;
    case 'job-ready':
      return READINESS_THRESHOLDS.strong;
    case 'strong':
      return READINESS_THRESHOLDS.strong;
  }
}
