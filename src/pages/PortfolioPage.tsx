import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProfileStore } from '@/features/profile/store';
import { useCaseStudies, usePortfolioSummary, type CaseStudy } from '@/features/portfolio/hooks';
import { ExportButton } from '@/features/portfolio/ExportButton';
import { decodeShareLink, clearShareLinkHash, type ShareLinkPayload } from '@/features/portfolio/exporters';
import { Briefcase, GraduationCap, FileText, BookOpen, Wrench } from 'lucide-react';

const MIN_LABS_FOR_PORTFOLIO = 1;

export function PortfolioPage() {
  const { profileId, profile, hasProfile } = useProfileStore();
  const { caseStudies } = useCaseStudies(profileId);
  const summary = usePortfolioSummary(profileId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shared, setShared] = useState<ShareLinkPayload | null>(() => decodeShareLink());

  if (shared) {
    return <SharedView payload={shared} onDismiss={() => {
      clearShareLinkHash();
      setShared(null);
    }} />;
  }

  if (!hasProfile || !profileId) {
    return <NoProfile />;
  }

  if (caseStudies.length < MIN_LABS_FOR_PORTFOLIO) {
    return <EmptyState />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Briefcase className="h-6 w-6 text-primary" aria-hidden="true" />
          Portfolio
        </h1>
        <p className="text-muted-foreground">
          A working portfolio built from your completed labs. Share it with hiring managers, or export it to Markdown / JSON.
        </p>
      </div>

      <SummaryStats summary={summary} />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-4">
        <p className="text-sm">
          {caseStudies.length} case stud{caseStudies.length === 1 ? 'y' : 'ies'} ready to export.
        </p>
        <ExportButton profileName={profile?.name ?? 'Learner'} caseStudies={caseStudies} />
      </div>

      <Section
        heading="Case Studies"
        icon={<FileText className="h-5 w-5 text-primary" aria-hidden="true" />}
        description="One case study per completed lab. Each shows the scenario, ticket, evidence, and resolution."
      >
        {caseStudies.map((cs) => (
          <CaseStudyCard
            key={cs.attemptId}
            caseStudy={cs}
            expanded={expandedId === cs.attemptId}
            onToggle={() => setExpandedId(expandedId === cs.attemptId ? null : cs.attemptId)}
          />
        ))}
      </Section>

      <Section
        heading="Knowledge Base Opportunities"
        icon={<BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />}
        description="KB articles you can author from the lessons in your completed labs."
      >
        <ul className="space-y-2">
          {caseStudies.map((cs) => (
            <li key={`kb-${cs.attemptId}`} className="rounded-md border bg-card p-3">
              <p className="text-sm font-medium">{cs.labTitle}</p>
              <p className="text-xs text-muted-foreground">{cs.kbOpportunity}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        heading="Training Materials"
        icon={<Wrench className="h-5 w-5 text-primary" aria-hidden="true" />}
        description="Reuse the troubleshooting notes and resolutions to train other IT staff."
      >
        <ul className="space-y-2">
          {caseStudies
            .filter((cs) => cs.ticket?.resolution)
            .map((cs) => (
              <li key={`tr-${cs.attemptId}`} className="rounded-md border bg-card p-3">
                <p className="text-sm font-medium">{cs.labTitle}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {cs.ticket?.resolution}
                </p>
              </li>
            ))}
        </ul>
      </Section>
    </div>
  );
}

function SummaryStats({ summary }: { summary: ReturnType<typeof usePortfolioSummary> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="Labs completed" value={String(summary.totalCompleted)} />
      <Stat
        label="Average score"
        value={summary.averageScore !== null ? `${Math.round(summary.averageScore * 100)}%` : '—'}
      />
      <Stat label="Case studies" value={String(summary.totalCompleted)} />
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

function Section({
  heading,
  description,
  icon,
  children,
}: {
  heading: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          {icon}
          {heading}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function CaseStudyCard({
  caseStudy,
  expanded,
  alwaysExpanded = false,
  printMode = false,
  onToggle,
}: {
  caseStudy: CaseStudy;
  expanded: boolean;
  /** Render details section open regardless of `expanded` (e.g. for share view). */
  alwaysExpanded?: boolean;
  /** Adapt to the printable layout — hides toggle controls, always expanded. */
  printMode?: boolean;
  onToggle?: () => void;
}) {
  const showDetails = alwaysExpanded || printMode || expanded;
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{caseStudy.labTitle}</CardTitle>
          {caseStudy.score !== null && (
            <Badge variant="success">{Math.round(caseStudy.score * 100)}%</Badge>
          )}
        </div>
        <CardDescription>
          Completed {new Date(caseStudy.completedAt).toLocaleString()}
          {caseStudy.ticket && ` · ${caseStudy.ticket.type} · ${caseStudy.ticket.priority.toUpperCase()}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm">{caseStudy.scenario.slice(0, 240)}{caseStudy.scenario.length > 240 ? '…' : ''}</p>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {!printMode && onToggle && (
            <Button size="sm" variant="outline" onClick={onToggle}>
              {expanded ? 'Hide details' : 'Show details'}
            </Button>
          )}
          {!printMode && (
            <Link to={`/lab/${caseStudy.labId}`}>
              <Button size="sm" variant="ghost">Review lab</Button>
            </Link>
          )}
        </div>

        {showDetails && (
          <div className="mt-4 space-y-3 border-t pt-3 text-sm">
            {caseStudy.ticket?.description && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Initial description</p>
                <p>{caseStudy.ticket.description}</p>
              </div>
            )}
            {caseStudy.ticket?.resolution && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Resolution</p>
                <p>{caseStudy.ticket.resolution}</p>
              </div>
            )}
            {caseStudy.evidence.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Evidence ({caseStudy.evidence.length})</p>
                <ul className="space-y-1">
                  {caseStudy.evidence.slice(0, 5).map((e) => (
                    <li key={e.id} className="text-xs">
                      <Badge variant="outline" className="mr-2">{e.type}</Badge>
                      {e.title}
                    </li>
                  ))}
                  {caseStudy.evidence.length > 5 && (
                    <li className="text-xs text-muted-foreground">+{caseStudy.evidence.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NoProfile() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md space-y-4 text-center">
        <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Create a profile to build a portfolio</h1>
        <p className="text-sm text-muted-foreground">
          Once you complete labs, they'll automatically become portfolio items — case studies, KB articles, and training materials.
        </p>
        <Link to="/settings">
          <Button>Create profile</Button>
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md space-y-4 text-center">
        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Complete a lab to start your portfolio</h1>
        <p className="text-sm text-muted-foreground">
          Each lab you finish adds a case study, a KB opportunity, and reusable training material here.
        </p>
        <Link to="/labs">
          <Button>Browse labs</Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Render a portfolio from a share-link payload. No Dexie, no profile — this
 * is what a hiring manager sees when they open the link. The "dismiss"
 * action clears the URL hash and lets the page fall back to the local view.
 */
function SharedView({ payload, onDismiss }: { payload: ShareLinkPayload; onDismiss: () => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 print:px-0 print:py-0">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 print:hidden">
        <p className="text-sm">
          <strong>Shared portfolio.</strong> This view was loaded from a share
          link and is not connected to any account.
        </p>
        <Button size="sm" variant="outline" onClick={onDismiss} className="mt-2">
          Dismiss and view your own portfolio
        </Button>
      </div>

      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {payload.profile} — IT Support Lab Portfolio
        </h1>
        <p className="text-sm text-muted-foreground">
          {payload.caseStudies.length} case stud{payload.caseStudies.length === 1 ? 'y' : 'ies'} · Generated{' '}
          {new Date(payload.generatedAt).toLocaleString()}
        </p>
      </header>

      <div className="flex justify-end print:hidden">
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>

      <Section
        heading="Case Studies"
        icon={<FileText className="h-5 w-5 text-primary" aria-hidden="true" />}
        description="One case study per completed lab. Each shows the scenario, ticket, evidence, and resolution."
      >
        {payload.caseStudies.map((cs) => (
          <CaseStudyCard key={cs.attemptId} caseStudy={cs} expanded alwaysExpanded printMode />
        ))}
      </Section>
    </div>
  );
}
