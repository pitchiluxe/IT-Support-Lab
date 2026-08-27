/**
 * scripts/validate-labs.ts
 * Validates every lab JSON under src/data/labs/content/ against the Zod schema.
 * Run: pnpm validate-labs
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '../src/data/labs/content');

async function* labFiles(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.name.endsWith('.json')) continue;
    yield join(dir, entry.name);
  }
}

async function main() {
  const schema = await import('../src/data/labs/lab.schema.ts');
  const LabSchema = schema.LabSchema as z.ZodType<unknown>;

  const files = await labFiles(CONTENT_DIR);
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  for await (const file of files) {
    const name = file.replace(CONTENT_DIR + '/', '');
    try {
      const raw = await readFile(file, 'utf-8');
      const parsed = JSON.parse(raw);
      const result = LabSchema.safeParse(parsed);
      if (result.success) {
        console.log(`✓ ${name}`);
        passed++;
      } else {
        console.error(`✗ ${name}`);
        for (const issue of result.error.issues) {
          console.error(`  — ${issue.path.join('.')}: ${issue.message}`);
          errors.push(`${name}: ${issue.path.join('.')}: ${issue.message}`);
        }
        failed++;
      }
    } catch (err) {
      console.error(`✗ ${name} (read error: ${err instanceof Error ? err.message : err})`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
