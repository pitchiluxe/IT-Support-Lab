import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';

interface Props {
  profileId: string;
  currentWeek: number;
}

export function WeekProgressCard({ profileId, currentWeek }: Props) {
  const attempts = useLiveQuery(
    () => db.attempts.where('profileId').equals(profileId).toArray(),
    [profileId],
  );
  const totalWeeks = 12;
  const completedCount = attempts?.filter((a) => a.status === 'completed').length ?? 0;

  return (
    <Card className="w-48">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Week {currentWeek} of {totalWeeks}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{completedCount}</p>
        <p className="text-xs text-muted-foreground">labs completed</p>
      </CardContent>
    </Card>
  );
}
