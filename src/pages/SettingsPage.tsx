import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfileStore } from '@/features/profile/store';
import { Sun, Moon, Monitor, Map, LayoutGrid } from 'lucide-react';
import { useTheme } from '@/app/ThemeProvider';
import { useCampusMode, setCampusMode, resolveCampusMode, type CampusMode } from '@/features/locations/useCampusMode';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/client';

export function SettingsPage() {
  const { profile, hasProfile, createProfile } = useProfileStore();
  const { theme, setTheme } = useTheme();
  const campusMode = useCampusMode();
  const storedCampus = useLiveQuery(
    () => db.settings.get('campusMode'),
    [],
  );
  const storedValue = storedCampus?.value;
  const env3DEnabled = import.meta.env['VITE_ENABLE_3D'] === 'true';
  // The toggle is disabled when 3D is unavailable (env flag off) or when the
  // URL is forcing a specific mode (?mode=2d or ?mode=3d). In both cases the
  // underlying mode is locked, so the switch is informational.
  const urlOverride = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mode') : null;
  const switchDisabled = !env3DEnabled || urlOverride === '2d' || urlOverride === '3d';
  const effectiveMode = resolveCampusMode(typeof storedValue === 'string' ? storedValue : null);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <h1 className="text-center text-2xl font-bold tracking-tight">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your learner profile and study schedule.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasProfile && profile ? (
            <div className="space-y-2">
              <p>
                <span className="font-medium">Name:</span> {profile.name}
              </p>
              <p>
                <span className="font-medium">Schedule:</span> {profile.schedule}-week plan
              </p>
              <p>
                <span className="font-medium">Started:</span>{' '}
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <CreateProfileForm onCreate={createProfile} />
          )}
        </CardContent>
      </Card>

      {/* AI Provider */}
      <Card>
        <CardHeader>
          <CardTitle>AI Tutor</CardTitle>
          <CardDescription>
            Local Ollama is the primary provider. Configure it below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ollama settings are configured in-app. Make sure Ollama is running locally on{' '}
            <code className="rounded bg-muted px-1">127.0.0.1:11434</code>.
          </p>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Button
                key={t}
                variant={theme === t ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setTheme(t)}
                className="gap-1.5"
              >
                {t === 'light' ? <Sun className="h-4 w-4" /> : t === 'dark' ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campus view */}
      <Card>
        <CardHeader>
          <CardTitle>Campus view</CardTitle>
          <CardDescription>
            Switch between the 2D room list and the 3D campus scene.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!env3DEnabled ? (
            <p className="text-sm text-muted-foreground">
              The 3D campus is not enabled in this build. Set{' '}
              <code className="rounded bg-muted px-1">VITE_ENABLE_3D=true</code>{' '}
              in your environment to enable it.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2" role="group" aria-label="Campus view mode">
                {(['2d', '3d'] as const).map((m) => (
                  <Button
                    key={m}
                    variant={campusMode === m ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => void setCampusMode(m as CampusMode)}
                    disabled={switchDisabled}
                    className="gap-1.5"
                    aria-pressed={campusMode === m}
                  >
                    {m === '2d' ? <LayoutGrid className="h-4 w-4" /> : <Map className="h-4 w-4" />}
                    {m === '2d' ? '2D' : '3D'}
                  </Button>
                ))}
              </div>
              {urlOverride === '3d' && (
                <p className="text-xs text-muted-foreground">
                  The URL is forcing 3D mode. Clear the{' '}
                  <code className="rounded bg-muted px-1">?mode=3d</code> query
                  parameter to use your saved preference.
                </p>
              )}
              {urlOverride === '2d' && (
                <p className="text-xs text-muted-foreground">
                  The URL is forcing 2D mode. Clear the{' '}
                  <code className="rounded bg-muted px-1">?mode=2d</code> query
                  parameter to use your saved preference.
                </p>
              )}
              {!switchDisabled && effectiveMode !== campusMode && (
                <p className="text-xs text-muted-foreground">
                  Saved preference: {effectiveMode === '3d' ? '3D' : '2D'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateProfileForm({ onCreate }: { onCreate: (name: string, schedule: string) => void }) {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('12');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onCreate(name.trim(), schedule);
      }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Your name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Smith"
          autoComplete="name"
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="schedule" className="text-sm font-medium">
          Study schedule
        </label>
        <select
          id="schedule"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="6">6-week intensive</option>
          <option value="8">8-week accelerated</option>
          <option value="12">12-week standard</option>
          <option value="16">16-week part-time</option>
        </select>
      </div>
      <Button type="submit" disabled={!name.trim()}>
        Create Profile
      </Button>
    </form>
  );
}
