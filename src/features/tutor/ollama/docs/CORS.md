# Ollama CORS Setup

By default, Ollama blocks cross-origin requests from browsers. Because this app runs at `http://localhost:5173` (or another origin), it cannot reach Ollama at `http://127.0.0.1:11434` unless CORS is configured.

## Fix: Set `OLLAMA_ORIGINS`

### macOS / Linux (shell)

```bash
# In your shell or launch script:
export OLLAMA_ORIGINS=http://localhost:5173
ollama serve
```

### Windows (PowerShell)

```powershell
# In a PowerShell prompt:
$env:OLLAMA_ORIGINS="http://localhost:5173"
ollama serve
```

### Persistent setup (Windows)

Add a system environment variable:

```
OLLAMA_ORIGINS=http://localhost:5173
```

Then restart `ollama serve`.

## Persistent setup (macOS / Linux)

Add to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
export OLLAMA_ORIGINS=http://localhost:5173
```

## Common error messages

| Error | Cause | Fix |
|---|---|---|
| `CORS blocked` | Missing `OLLAMA_ORIGINS` | Set and restart Ollama |
| `Failed to fetch` | Ollama not running | Run `ollama serve` |
| `Connection refused` | Wrong URL or port | Check `127.0.0.1:11434` |
| `404 on /api/tags` | Old Ollama version | Update to 0.1.14+ |
| Model not installed | Model not pulled | Run `ollama pull <model>` |

## Pulling a model

```bash
ollama pull llama3.2
ollama pull mistral
ollama pull codellama
```

## Using a different app origin

If you serve the app on a different port, update both `OLLAMA_ORIGINS` and the URL in Settings:

```bash
export OLLAMA_ORIGINS=http://localhost:4173   # pnpm preview
ollama serve
```
