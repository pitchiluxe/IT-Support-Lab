import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import { db } from '@/lib/db/client';

// Minimal Dexie instance for migration testing
class TestDb extends Dexie {
  declare v1Table: Dexie.Table<{ id: string; name: string }, string>;
  constructor() {
    super('test-migrate');
    this.version(1).stores({ v1Table: 'id' });
  }
}

describe('Dexie migration', () => {
  let testDb: TestDb;

  beforeEach(async () => {
    testDb = new TestDb();
    await testDb.open();
  });

  afterEach(async () => {
    await testDb.close();
    indexedDB.deleteDatabase('test-migrate');
  });

  it('can write and read a profile row', async () => {
    const id = crypto.randomUUID();
    await testDb.v1Table.add({ id, name: 'Test Learner' });
    const row = await testDb.v1Table.get(id);
    expect(row?.name).toBe('Test Learner');
  });

  it('the real db schema is accessible', async () => {
    const names = db.tables.map((t) => t.name);
    expect(names).toContain('profiles');
    expect(names).toContain('attempts');
    expect(names).toContain('labs');
    expect(names).toContain('tutorTurns');
    expect(names).toContain('schemaVersion');
    expect(names).toContain('errors');
    expect(names).toContain('appEvents');
  });
});
