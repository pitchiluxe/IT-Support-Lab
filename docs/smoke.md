# Manual smoke walkthrough

This is the **manual** smoke script for the MVP. The Playwright suite
in `e2e/smoke.spec.ts` automates the critical paths; use this checklist
when you want to drive the app by hand before a release.

## 1. Cold start

1. `pnpm install && pnpm dev`
2. Open `http://localhost:5173`.
3. Expect: home page loads with a heading ("Dashboard" or "Welcome…").
4. **Expected: zero red errors in the DevTools console.**

## 2. Create a profile

1. From the home page, click "Create profile."
2. Enter a name (e.g. "Test Learner").
3. Pick a 12-week schedule.
4. Submit.
5. **Expected: the dashboard shows the "Start Lab 01" card.**

## 3. Start Lab 01

1. Click "Start Lab 01."
2. The lab intro page renders with the scenario text.
3. **Expected: a tutor panel toggle is visible in the header; clicking
   it shows/hides the side panel.**

## 4. Walk the lab

1. Click "Mark ready to take the call" (or whatever the first event is
   in the current lab JSON).
2. The phone inspector opens.
3. Click "Take call" — the ticket intake form appears.
4. Save the call.
5. The lab transitions to the next node (Mac inspection).
6. Click the Mac → inspector shows deterministic state.
7. Continue through the FSM until you reach a decision node.
8. **Expected: each dispatch writes a row to `actions` and a `ts`
   counter in the audit log.**

## 5. Make a decision

1. At a decision node, three options appear.
2. Pick one.
3. **Expected: a `decisions` row is written with the `decisionPointId`
   and `choice`.**

## 6. Tutor

1. With the panel open, type "what should I do?"
2. **Expected: the response is a Socratic question — not the answer.**
3. Try "give me the answer."
4. **Expected: a meta-question ("what would your teacher say?").**
5. Click "Stop" mid-stream.
6. **Expected: the streaming chunk is cancelled, the turn is marked
   `interrupted: true` in `tutorTurns`.**

## 7. Settings

1. Navigate to `/settings`.
2. Toggle between "Ollama (local)" and "Practice mode."
3. If Ollama is running with `OLLAMA_ORIGINS` set, click "Run
   diagnostic" — the badge shows "Ollama reachable."
4. If not, the badge shows "Not running" or "CORS error" with a hint.
5. **Expected: settings persist across reload.**

## 8. Debrief

1. Reach the lab's terminal node.
2. The debrief screen renders with:
   - Overall % (technical + professional average)
   - 5 technical bars + 7 professional bars
   - Top-3 strengths, top-3 weaknesses
   - Decision recap (correct/suboptimal)
3. **Expected: technical and professional scores are non-zero and the
   gold path scores higher than the error path on a re-run.**

## 9. Readiness

1. Complete a lab, then navigate to `/` again.
2. The dashboard (or a future readiness page) reflects the attempt.
3. **Expected: a single attempt is insufficient to mark any area as
   "job-ready."** The `readiness` row stays at `learning` or
   `developing`.

## 10. Offline

1. Open DevTools → Network → "Offline."
2. Reload the app.
3. **Expected: the app still loads, the last active profile is
   restored, the last attempt is resumable.**

## 11. Keyboard navigation

1. From the home page, press Tab repeatedly.
2. **Expected: every interactive element is reachable, focus rings are
   visible, no focus traps.**

## 12. Reduced motion

1. Set OS preference "Reduce motion."
2. Reload the app.
3. **Expected: animations are minimized (or off) per the OS
   preference.**

## 13. Axe

1. Install Axe DevTools in your browser.
2. Open `/`, `/labs`, `/lab/lab-01`, `/settings`.
3. **Expected: zero "serious" or "critical" violations on any of
   these pages.** (The Playwright suite enforces this automatically.)

## 14. Build

1. `pnpm build`
2. **Expected: clean build, `dist/` is generated, `pnpm preview` serves
   the production build at `http://localhost:4173`.**
3. `pnpm test` — 113 tests pass.
4. `pnpm test:e2e` — 9 browser tests pass.
