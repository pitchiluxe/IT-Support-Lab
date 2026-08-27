import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db/client';
import { OllamaProvider, type OllamaConfig } from '@/features/tutor/ollama/OllamaProvider';
import { CorsDiagnostic } from '@/features/tutor/ollama/CorsDiagnostic';
import { FakeProvider } from '@/features/tutor/fake/FakeProvider';
import { useTutorStore } from '@/features/tutor/store';
import { Settings, CheckCircle, AlertCircle } from 'lucide-react';

export function ProviderSettings() {
  const provider = useTutorStore((s) => s.provider);
  const setProvider = useTutorStore((s) => s.setProvider);
  const tutorHint = useTutorStore((s) => s.hintLevel);

  const [config, setConfig] = useState<OllamaConfig>({
    baseUrl: 'http://127.0.0.1:11434',
    model: 'llama3.2',
    temperature: 0.2,
    forbiddenSubstrings: [],
    maxRetries: 2,
  });
  const [selectedProvider, setSelectedProvider] = useState<'ollama' | 'fake'>(
    provider?.name === 'ollama' ? 'ollama' : 'fake',
  );
  const [saved, setSaved] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    status: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    // Load persisted settings from Dexie
    void db.settings.get('tutor-provider').then((row) => {
      if (row) {
        try {
          const parsed = JSON.parse(row.value) as Partial<OllamaConfig & { provider: string }>;
          if (parsed.provider === 'ollama' && parsed.baseUrl) {
            setConfig((c) => ({ ...c, ...parsed }));
            setSelectedProvider('ollama');
          }
        } catch {
          // ignore corrupt settings
        }
      }
    });
  }, []);

  async function handleSave() {
    await db.settings.put({
      key: 'tutor-provider',
      value: JSON.stringify({ provider: selectedProvider, ...config }),
    });

    if (selectedProvider === 'ollama') {
      const ollama = new OllamaProvider(config);
      setProvider(ollama);
    } else {
      setProvider(new FakeProvider());
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleTestConnection() {
    try {
      const ollama = new OllamaProvider(config);
      const tags = await ollama.listModels();
      setModels(tags.map((m) => m.name));
    } catch {
      setModels([]);
    }
  }
  // Expose for future "Test connection" button
  void handleTestConnection;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">AI Tutor Settings</CardTitle>
        </div>
        <CardDescription>
          Configure the AI tutor. The Fake provider works without any setup.
          Ollama runs locally and never sends data to the internet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={selectedProvider === 'ollama' ? 'default' : 'outline'}
            onClick={() => setSelectedProvider('ollama')}
          >
            Ollama (local)
          </Button>
          <Button
            size="sm"
            variant={selectedProvider === 'fake' ? 'default' : 'outline'}
            onClick={() => setSelectedProvider('fake')}
          >
            Practice mode (no setup)
          </Button>
        </div>

        {selectedProvider === 'ollama' && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="ollama-url"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Ollama URL
                </label>
                <Input
                  id="ollama-url"
                  value={config.baseUrl}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, baseUrl: e.target.value }))
                  }
                  placeholder="http://127.0.0.1:11434"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="ollama-model"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Model
                </label>
                <Input
                  id="ollama-model"
                  value={config.model}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, model: e.target.value }))
                  }
                  placeholder="llama3.2"
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="ollama-temp"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Temperature ({config.temperature})
                </label>
                <input
                  id="ollama-temp"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.temperature}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      temperature: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full"
                  aria-label="Temperature"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="ollama-retries"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Max leak retries ({config.maxRetries})
                </label>
                <input
                  id="ollama-retries"
                  type="range"
                  min={0}
                  max={3}
                  step={1}
                  value={config.maxRetries}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      maxRetries: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full"
                  aria-label="Max retries"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CorsDiagnostic
                onResult={(r) =>
                  setDiagnosticResult({ status: r.status, message: r.message })
                }
              />
              {diagnosticResult?.status === 'ok' && (
                <CheckCircle className="h-4 w-4 text-success" />
              )}
              {(diagnosticResult?.status === 'cors-rejected' ||
                diagnosticResult?.status === 'connection-refused') && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>

            {models.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Installed models
                </p>
                <div className="flex flex-wrap gap-1">
                  {models.map((m) => (
                    <Badge key={m} variant="outline" className="text-xs">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedProvider === 'fake' && (
          <div className="rounded-md border border-muted-foreground/20 bg-muted/20 p-3 text-sm text-muted-foreground">
            <p>
              <strong>Practice mode</strong> returns scripted Socratic responses.
              It never gives the final answer and is always available — no setup
              required. Use it to test the UI before configuring Ollama.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave}>
            Save settings
          </Button>
          {saved && (
            <span className="text-xs text-success">
              <CheckCircle className="mr-1 inline h-3.5 w-3.5" />
              Saved
            </span>
          )}
          <Badge variant="outline" className="ml-auto text-xs">
            Hint level: {tutorHint}/7
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
