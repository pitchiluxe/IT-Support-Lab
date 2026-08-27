import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';
import { Lock } from 'lucide-react';

export function LabsPage() {
  const labs = useLiveQuery(() => db.labs.orderBy('order').toArray(), []);
  const attempts = useLiveQuery(() => db.attempts.toArray(), []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <h1 className="text-center text-2xl font-bold tracking-tight">Lab Library</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {labs?.map((lab) => {
          const attempt = attempts?.find((a) => a.labId === lab.id);
          return (
            <Card key={lab.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{lab.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {lab.track} · Week {lab.week}
                    </CardDescription>
                  </div>
                  <Badge variant={attempt?.status === 'completed' ? 'default' : 'outline'}>
                    {attempt?.status ?? 'Not Started'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{lab.scenario.slice(0, 120)}…</p>
                <Link
                  to={`/lab/${lab.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {attempt?.status === 'completed' ? 'Review' : 'Start Lab'}
                  {attempt ? null : <Lock className="h-3 w-3" aria-hidden="true" />}
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
