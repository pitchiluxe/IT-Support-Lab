# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Nature

This is a **built web application** for the IT Support Lab Academy — not a content-only repository. It contains:

- A full Vite + React 18 + TypeScript application in `src/`
- **48 authored lab scenarios** in `src/data/labs/content/*.json` (47 phase labs + 1 capstone)
- An AI tutor with Ollama (local) + Fake provider
- Dexie/IndexedDB persistence with 22 tables
- A scoring engine and readiness map across 13 skill areas
- 3D campus (react-three-fiber), full readiness dashboard, and portfolio generator

## Key Commands

```bash
pnpm install      # install deps
pnpm dev         # dev server at http://localhost:5173
pnpm build       # production build → dist/
pnpm preview     # serve dist/ at http://localhost:4173
pnpm test        # unit tests (Vitest, 17 files, 113+ tests)
pnpm test:e2e    # Playwright browser smoke (13 tests)
pnpm validate-labs  # check all lab JSONs against LabSchema
pnpm lint        # ESLint
pnpm format      # Prettier
```

## Architecture

```
src/
  app/                   Router, Providers, ErrorBoundary, ThemeProvider
  components/ui/          shadcn-style primitives (Button, Card, Dialog, etc.)
  data/
    labs/
      lab.schema.ts       Zod schema — the canonical shape of every lab JSON
      manifest.ts         LAB_MANIFEST — id/title/week/track/order/skills/contentPath
      content/            lab-01.json … lab-47.json + capstone-01.json
    skills/
      areas.ts           SKILL_AREAS — 13 readiness areas (single source of truth)
  features/
    lab-engine/          FSM, run loop, derive, db-init (seeding)
    locations/
      LabLocationPanel.tsx   2D panel, inspectors (Mac, Phone, WindowsPC, etc.)
      ThreeCanvasGate.tsx    Feature-flag gate: renders 3D campus when VITE_ENABLE_3D=true
      campus/                 react-three-fiber campus (CampusScene, RoomObject, locationMap)
    tickets/             Schema, store, IntakeForm, DocumentTab, TicketPanel
    tutor/
      provider.ts        TutorProvider interface (name, chat, abort, getDiagnostics)
      prompt.ts          buildCoachPrompt — STRICT FIELD WHITELIST, no correct*/solution*
      validator.ts        Post-hoc leak detector — catches answer leaks
      store.ts           Zustand store with session, hint level, streaming
      TutorPanel.tsx     Chat UI
      fake/FakeProvider.ts   Scripted Socratic responses, 7 hint levels
      ollama/
        OllamaProvider.ts   Streaming NDJSON chat, model listing, CORS error map
        CorsDiagnostic.tsx  Preflight button distinguishing connection/CORS/404
        docs/CORS.md         OLLAMA_ORIGINS setup guide
    scoring/
      areas.ts            5 technical + 7 professional scoring categories
      rubric.ts           scoreAttempt() — pure function, no I/O
      readiness.ts         recomputeReadiness(profileId)
      hooks.ts             useReadinessMap(profileId) — live reactive map for the dashboard
      readiness-ui/        ReadinessAreaCard, AreaDetailModal
      DebriefScreen.tsx   Post-lab score screen with bars, highlights, next-lab
    portfolio/
      hooks.ts             useCaseStudies, usePortfolioSummary
      ExportButton.tsx     Markdown / JSON download
    profile/              Zustand store, create-profile dialog
    settings/             ProviderSettings — Ollama/Fake picker, temp, retries
  lib/db/
    client.ts             Dexie singleton, 22 tables
  pages/                  HomePage, LabsPage, LabRunPage, ReadinessPage, PortfolioPage, SettingsPage
  test/                   Vitest test suites
e2e/
  smoke.spec.ts           Playwright smoke suite (axe-core a11y checks)
docs/
  smoke.md               Manual verification checklist
scripts/
  validate-labs.ts       Node CLI — validates all JSON against LabSchema
```

## Core Design Decisions

### Tutor: never give the answer
- `src/features/tutor/prompt.ts` enforces `ALLOWED_KEYS` whitelist at runtime. Any non-whitelisted field throws — the build fails rather than silently leaking.
- `src/features/tutor/validator.ts` post-checks every response for answer patterns and forbidden substrings (extracted from lab decision option labels).
- `src/features/tutor/prompt.ts` — never use `correct*`, `solution*`, `expected*`, or `feedback` in the user payload. The system prompt may reference scoring concepts but not the lab-specific answer.
- Validator retries up to `maxRetries` times with a higher hint level. A persistent leak yields an error chunk; the UI never renders the forbidden text.

### FSM
- `src/features/lab-engine/fsm.ts` — `transition(node, event) → node`. Pure function with fast-check property tests: terminal on terminal event, no illegal transitions, deterministic replay.
- Every `dispatch(event, payload)` call writes an `actions` row with a monotonic `seq` counter. Decision payloads auto-write to `decisions` table.
- Node lookups use `node.id` (slug), NOT `node.title`.

### Data
- `src/data/labs/manifest.ts` — single source of truth for lab count (47 + capstone). All labs with `contentPath !== null` are seeded into Dexie on startup.
- Labs in `src/data/labs/content/` are validated against `LabSchema` in `src/data/labs/lab.schema.ts` before loading.
- `src/lib/db/client.ts` uses DB name `'itsla'`. Run `indexedDB.deleteDatabase('itsla')` to reset.

### 3D Campus
- `src/features/locations/ThreeCanvasGate.tsx` is the feature-flag gate. Renders `CampusScene` (lazy-loaded) when `VITE_ENABLE_3D=true` is set. Default 2D-only.
- `?mode=2d` URL param forces 2D even when the flag is on; `?mode=3d` forces 3D when the flag is on.
- `CampusScene` is an isometric `<Canvas>` with `RoomObject` boxes placed on a 2D grid by hashing each lab's `locationId`. Click a room to navigate to the first lab there.
- The 3D canvas is `aria-hidden` — all interaction remains accessible through the 2D panel.

### Readiness & Portfolio
- `/readiness` uses `useReadinessMap` (live Dexie subscription) → 13 cards with level, evidence count, and progress to next level. Click a card to open `AreaDetailModal` listing all labs in that area.
- `/portfolio` derives Case Studies, KB Opportunities, and Training Materials from completed attempts. `ExportButton` produces Markdown or JSON for the whole portfolio.
- Both routes are pure reads of `attempts` / `scores` / `evidence` / `tickets` / `readiness` — no new DB tables.

### Scoring
- 5 technical categories: diagnosis, evidence, troubleshooting, resolution, validation.
- 7 professional categories: customer-communication, documentation, prioritization, sla-awareness, escalation, security-awareness, process-discipline.
- Scores are 0..2 per category. Technical uses per-lab weights from `lab.scoring.weights`. Professional uses text-length + audit-signal heuristics.
- Readiness: 5 thresholds (not-started/learning/developing/job-ready/strong). Requires ≥3 evidence-backed attempts AND ≥65% mean technical pct for job-ready.

## Authoring a New Lab

1. Add an entry to `LAB_MANIFEST` in `src/data/labs/manifest.ts` with the lab id and `contentPath: 'your-lab.json'`.
2. Create `src/data/labs/content/your-lab.json` using `lab-01.json` as the template.
3. Run `pnpm validate-labs` to check for schema errors.
4. Restart the dev server — `seedLabs()` picks it up automatically.

**Critical rules:**
- Decision `score` values must be integers in `{-1, 0, 1}` (no decimals).
- `methodology` values must be lowercase: `'identify'`, `'scope'`, etc. (not `'Identify'`).
- `ticket.sla` must be a string: `'business-hours' | '24x7' | 'next-day' | 'week'` — NOT an object.
- `persona.identifiers` values must not look like real emails, phone numbers, or addresses.
- Option labels must not *be* the answer — the validator post-checks against them.

## Skills / Readiness Areas

The 13 areas are in `src/data/skills/areas.ts`. When authoring a lab, pick 1–5 skills from that list. The track in the manifest (`windows`, `apple`, etc.) maps to the primary skill area. Run `skillsForArea('apple')` to find which labs exercise a given area.

## PWA / Offline

The app is installable via Workbox (configured in `vite.config.ts`). After first load it works offline. Labs are seeded into IndexedDB on first boot; learners can complete labs without a network connection.

## Safety

All scenarios are fictional. No real equipment, no real endpoints. The tutor prompt is hard-locked against leaking answers; the validator post-checks every response.
