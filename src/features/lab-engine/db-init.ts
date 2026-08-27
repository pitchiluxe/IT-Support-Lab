import { db } from '@/lib/db/client';
import { LabSchema, type Lab } from '@/data/labs/lab.schema';
import { LAB_MANIFEST } from '@/data/labs/manifest';

/**
 * Seeds the labs table from the manifest and authored JSON content.
 * Call once on app startup (before any route renders).
 *
 * Refresh policy: if a lab is already in IndexedDB but its `contentVersion`
 * is older than the bundled JSON, the new version is written. This is the
 * safety net for the case where a developer's seeded labs are stale — the
 * FSM would otherwise crash when a state row references a node id that was
 * renamed in a newer version of the lab.
 */
export async function seedLabs(): Promise<void> {
  const fresh = await Promise.all(
    LAB_MANIFEST.map(async (entry): Promise<Lab | null> => {
      if (!entry.contentPath) return null;
      try {
        // contentPath already includes ".json"; strip the extension before
        // building the import URL so we don't produce "lab-01.json.json".
        const id = entry.contentPath.replace(/\.json$/, '');
        const mod = await import(`@/data/labs/content/${id}.json`);
        const raw = mod.default ?? mod.lab;
        return LabSchema.parse(raw);
      } catch (err) {
        // Not yet authored, or schema mismatch — skip for now. Log so the
        // dev knows why a manifest entry is silently dropped.
        // eslint-disable-next-line no-console
        console.warn(`[seedLabs] skipping ${entry.id}:`, err instanceof Error ? err.message : err);
        return null;
      }
    }),
  );

  const valid = fresh.filter((l): l is Lab => l !== null);
  if (valid.length === 0) return;

  const existingRows = await db.labs.bulkGet(valid.map((l) => l.id));
  const toUpsert: Lab[] = [];
  for (let i = 0; i < valid.length; i++) {
    const lab = valid[i]!;
    const prior = existingRows[i];
    if (!prior) {
      toUpsert.push(lab);
    } else if (prior.contentVersion < lab.contentVersion) {
      // eslint-disable-next-line no-console
      console.info(`[seedLabs] refreshing ${lab.id} from v${prior.contentVersion} to v${lab.contentVersion}`);
      toUpsert.push(lab);
    }
  }
  if (toUpsert.length > 0) {
    await db.labs.bulkPut(toUpsert);
  }
}
