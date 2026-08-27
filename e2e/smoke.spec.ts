import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Smoke test: walks the MVP learner journey end-to-end in a headless browser.
 * Covers:
 *   1. App loads at /
 *   2. Labs list visible
 *   3. Lab 01 opens
 *   4. Tutor panel toggle button is present
 *   5. Settings page renders
 *   6. Axe accessibility check on /, /labs, /lab/lab-01, /settings
 *
 * Run: pnpm playwright test
 * Requires: pnpm dev server (webServer config handles this)
 */
test.describe('MVP smoke', () => {
  test('home page loads with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
    const realErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('manifest'),
    );
    expect(realErrors, `Console errors on /: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('labs list renders the lab library heading', async ({ page }) => {
    await page.goto('/labs');
    await expect(page.getByRole('heading', { name: /lab library/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('Lab 01 page renders without crash', async ({ page }) => {
    await page.goto('/lab/lab-01');
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 15_000 });
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(2000);
    const realErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('Lab lab-01 not found'),
    );
    expect(realErrors, `Console errors on /lab/lab-01: ${realErrors.join('\n')}`).toHaveLength(0);
  });

  test('tutor panel toggle button is present on Lab 01', async ({ page }) => {
    await page.goto('/lab/lab-01');
    // The tutor toggle button is in the header, rendered regardless of attempt state.
    // Wait for labs to be seeded and the component to mount.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const toggleBtn = page.getByRole('button', { name: /hide tutor|show tutor/i });
    await expect(toggleBtn).toBeVisible({ timeout: 15_000 });
  });

  test('settings page renders the Settings heading', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 10_000 });
  });

  test('axe accessibility on /', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter((v) => {
      const tag = v.tags[0] ?? '';
      return tag !== 'best-practice' && tag !== 'experimental';
    });
    if (violations.length > 0) {
      console.log('Axe violations on /:');
      for (const v of violations) console.log(' -', v.id, ':', v.description);
    }
    expect(violations).toHaveLength(0);
  });

  test('axe accessibility on /labs', async ({ page }) => {
    await page.goto('/labs');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter((v) => {
      const tag = v.tags[0] ?? '';
      return tag !== 'best-practice' && tag !== 'experimental';
    });
    if (violations.length > 0) {
      console.log('Axe violations on /labs:');
      for (const v of violations) console.log(' -', v.id, ':', v.description);
    }
    expect(violations).toHaveLength(0);
  });

  test('axe accessibility on /lab/lab-01', async ({ page }) => {
    await page.goto('/lab/lab-01');
    await page.waitForLoadState('networkidle');
    // Wait for the LabRunPage to load labs (async seed). The h1 renders
    // only after the lab row is in Dexie.
    await page.waitForTimeout(3000);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10_000 });
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter((v) => {
      const tag = v.tags[0] ?? '';
      return tag !== 'best-practice' && tag !== 'experimental';
    });
    if (violations.length > 0) {
      console.log('Axe violations on /lab/lab-01:');
      for (const v of violations) console.log(' -', v.id, ':', v.description);
    }
    expect(violations).toHaveLength(0);
  });

  test('axe accessibility on /settings', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter((v) => {
      const tag = v.tags[0] ?? '';
      return tag !== 'best-practice' && tag !== 'experimental';
    });
    if (violations.length > 0) {
      console.log('Axe violations on /settings:');
      for (const v of violations) console.log(' -', v.id, ':', v.description);
    }
    expect(violations).toHaveLength(0);
  });

  test('readiness page renders', async ({ page }) => {
    await page.goto('/readiness');
    await page.waitForLoadState('networkidle');
    // The page either shows the full dashboard (with profile) or the "create
    // a profile" prompt. Either way, an h1 must be visible.
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 15_000 });
  });

  test('portfolio page renders', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 15_000 });
  });

  test('axe accessibility on /readiness', async ({ page }) => {
    await page.goto('/readiness');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter((v) => {
      const tag = v.tags[0] ?? '';
      return tag !== 'best-practice' && tag !== 'experimental';
    });
    if (violations.length > 0) {
      console.log('Axe violations on /readiness:');
      for (const v of violations) console.log(' -', v.id, ':', v.description);
    }
    expect(violations).toHaveLength(0);
  });

  test('axe accessibility on /portfolio', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter((v) => {
      const tag = v.tags[0] ?? '';
      return tag !== 'best-practice' && tag !== 'experimental';
    });
    if (violations.length > 0) {
      console.log('Axe violations on /portfolio:');
      for (const v of violations) console.log(' -', v.id, ':', v.description);
    }
    expect(violations).toHaveLength(0);
  });

  test('portfolio share link in URL hash shows the shared view', async ({ page }) => {
    // Encode a tiny payload directly into the URL hash and verify the page
    // renders the SharedView banner. The encoder is exercised by the unit
    // tests; here we just confirm the round-trip works through real DOM.
    const payload = {
      v: 1,
      profile: 'Test Reviewer',
      generatedAt: new Date().toISOString(),
      caseStudies: [
        {
          attemptId: 'a-test',
          labId: 'lab-01',
          labTitle: 'Shared Lab Title',
          scenario: 'A scenario shared via URL hash.',
          kbOpportunity: '',
          score: 0.85,
          completedAt: Date.now(),
          ticket: null,
          evidence: [],
          evidenceCount: 0,
          ticketCount: 0,
        },
      ],
    };
    const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await page.goto(`/portfolio#p=${b64}`);
    await page.waitForLoadState('networkidle');
    // The SharedView banner is the "Shared portfolio." copy.
    await expect(page.getByText(/shared portfolio/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Test Reviewer — IT Support Lab Portfolio')).toBeVisible();
    await expect(page.getByText('Shared Lab Title')).toBeVisible();
  });

  test('campus room list is keyboard-navigable and aria-hides the canvas', async ({ page }) => {
    // Set up: create a profile so the lab page can mount.
    await page.goto('/settings');
    await page.getByLabel('Your name').fill('Room List Tester');
    await page.getByRole('button', { name: 'Create Profile' }).click();
    await expect(page.getByText(/^Name:/)).toBeVisible({ timeout: 5_000 });

    // Force 3D mode via the URL so the gate opens regardless of any saved
    // preference. The Settings toggle is exercised in the unit tests.
    await page.goto('/lab/lab-01?mode=3d');
    await page.waitForLoadState('networkidle');

    // The accessible room list renders next to the canvas.
    const list = page.getByTestId('room-list');
    await expect(list).toBeVisible({ timeout: 15_000 });
    // The 3D scene's parent carries aria-hidden="true" so screen readers
    // skip the canvas and use the list instead.
    const hidden = page.locator('div[aria-hidden="true"]');
    await expect(hidden.first()).toBeVisible();

    // Focus the first room button and walk through the list with arrows.
    const buttons = list.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    await buttons.first().focus();
    await page.keyboard.press('ArrowDown');
    // The second button should now be the active element.
    await expect(buttons.nth(1)).toBeFocused();
  });

  test('capstone is gated until the learner completes the phase labs', async ({ page }) => {
    // Set up: create a profile (no completed attempts → locked).
    await page.goto('/settings');
    await page.getByLabel('Your name').fill('Capstone Tester');
    await page.getByRole('button', { name: 'Create Profile' }).click();
    await expect(page.getByText(/^Name:/)).toBeVisible({ timeout: 5_000 });

    await page.goto('/lab/capstone-01');
    await page.waitForLoadState('networkidle');
    // The locked view shows the progress bar with role="progressbar".
    await expect(page.getByText(/capstone is locked/i)).toBeVisible({ timeout: 10_000 });
    const bar = page.getByRole('progressbar', { name: /capstone unlock progress/i });
    await expect(bar).toBeVisible();
    // The browse button points the learner back to /labs.
    await expect(page.getByRole('button', { name: 'Browse labs' })).toBeVisible();
  });
});
