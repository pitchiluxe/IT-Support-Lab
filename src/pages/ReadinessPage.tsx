import { useState } from 'react';
import { useProfileStore } from '@/features/profile/store';
import { SKILL_AREAS, type SkillArea } from '@/data/skills/areas';
import { LAB_MANIFEST } from '@/data/labs/manifest';
import { useReadinessMap } from '@/features/scoring/hooks';
import { ReadinessAreaCard } from '@/features/scoring/readiness-ui/ReadinessAreaCard';
import { AreaDetailModal } from '@/features/scoring/readiness-ui/AreaDetailModal';
import { TrendingUp, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

export function ReadinessPage() {
  const { profileId, hasProfile } = useProfileStore();
  const map = useReadinessMap(profileId);
  const [selected, setSelected] = useState<SkillArea | null>(null);

  if (!hasProfile || !profileId) {
    return <NoProfile />;
  }

  const labCountByArea = new Map<SkillArea, number>();
  for (const area of SKILL_AREAS) {
    labCountByArea.set(
      area,
      LAB_MANIFEST.filter((l) => l.skills.includes(area) && l.contentPath).length,
    );
  }

  const totalAttempts = Array.from(map.values()).reduce((s, a) => s + a.evidenceCount, 0);
  const areasAtJobReadyOrAbove = Array.from(map.values()).filter(
    (a) => a.level === 'job-ready' || a.level === 'strong',
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <TrendingUp className="h-6 w-6 text-primary" aria-hidden="true" />
          Job-Readiness Dashboard
        </h1>
        <p className="text-muted-foreground">
          Your evidence-backed proficiency across {SKILL_AREAS.length} skill areas. Each area requires multiple completed labs to promote.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Skill areas tracked" value={String(SKILL_AREAS.length)} />
        <Stat label="Total evidence" value={String(totalAttempts)} />
        <Stat
          label="Areas at job-ready or above"
          value={String(areasAtJobReadyOrAbove)}
        />
      </div>

      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
        aria-label="Skill areas"
      >
        {SKILL_AREAS.map((area) => (
          <div key={area} role="listitem">
            <ReadinessAreaCard
              area={area}
              readiness={map.get(area) ?? { level: 'not-started', evidenceCount: 0, nextLevel: 'learning', evidenceNeeded: 0, currentPctThreshold: 0 }}
              labCount={labCountByArea.get(area) ?? 0}
              onSelect={setSelected}
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-muted/30 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Briefcase className="h-5 w-5 text-primary" aria-hidden="true" />
              Ready to apply?
            </h2>
            <p className="text-sm text-muted-foreground">
              Generate a portfolio from your completed labs — case studies, KB articles, and ticket documents.
            </p>
          </div>
          <Link to="/portfolio">
            <Button>Open portfolio</Button>
          </Link>
        </div>
      </div>

      <AreaDetailModal profileId={profileId} area={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function NoProfile() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md space-y-4 text-center">
        <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Create a profile to see your readiness</h1>
        <p className="text-sm text-muted-foreground">
          Once you create a profile and start completing labs, your progress across all 13 skill areas will show up here.
        </p>
        <Link to="/settings">
          <Button>Create profile</Button>
        </Link>
      </div>
    </div>
  );
}
