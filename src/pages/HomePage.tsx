import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight, Play, TrendingUp, Briefcase, Bot } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { useProfileStore } from '@/features/profile/store';
import { WeekProgressCard } from '@/features/profile/WeekProgressCard';

export function HomePage() {
  const { hasProfile, profileId } = useProfileStore();
  const labs = useLiveQuery(() => db.labs.toArray(), []);

  if (!hasProfile || !profileId) {
    return <CreateProfilePrompt />;
  }

  const week = 1; // TODO: derive from study plan
  const lab01 = labs?.find((l) => l.id === 'lab-01');

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">IT Services Support Technician Lab Academy</p>
        <WeekProgressCard profileId={profileId} currentWeek={week} />
      </div>

      {/* AI Coach card — visible from the home page so a new learner
          knows the tutor is there to help before they even open a lab. */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
            Your AI Coach is here
          </CardTitle>
          <CardDescription>
            New to IT support? No problem. Open any lab and the coach will
            walk you through it — ask "where do I start?" or paste an error
            message, and you'll get an instructor-style answer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lab01 && (
            <Link to={`/lab/${lab01.id}`}>
              <Button variant="outline" size="sm">
                Open Lab 01 with the coach <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Lab 01 CTA */}
      {lab01 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" aria-hidden="true" />
              Week {week} — Start Here
            </CardTitle>
            <CardDescription>{lab01.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">{lab01.scenario.slice(0, 200)}…</p>
            <Link to="/lab/lab-01">
              <Button>
                Start Lab 01 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Placeholder sections */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/readiness" className="block">
          <Card className="h-full cursor-pointer transition hover:bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
                Your Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track your job-readiness across all 13 skill areas.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/portfolio" className="block">
          <Card className="h-full cursor-pointer transition hover:bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-primary" aria-hidden="true" />
                Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Evidence, tickets, and case studies from your completed labs.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Study Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              12-week schedule with labs, practice, and interview drills.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CreateProfilePrompt() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <GraduationCap className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold">Welcome to IT Support Lab Academy</h1>
        <p className="text-muted-foreground">
          Build real IT support skills through hands-on labs. Set up your profile to begin.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/settings">
            <Button>Create Profile</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
