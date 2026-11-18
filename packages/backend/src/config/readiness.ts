import { AppDataSource } from '../db/data-source.js';
interface DatabaseProbe {
  isInitialized: boolean;
  migrations: readonly { name?: string; constructor: { name: string } }[];
  options?: { migrationsTableName?: string };
  query(sql: string): Promise<unknown>;
}
/** Read-only readiness. Never creates a migration ledger or applies a migration. */
export async function databaseReady(source: DatabaseProbe = AppDataSource): Promise<boolean> {
  if (!source.isInitialized || source.migrations.length === 0) return false;
  try {
    await source.query('SELECT 1');
    const table = (source.options?.migrationsTableName || 'migrations').replaceAll('"', '""');
    const rows = await source.query(`SELECT name FROM "${table}"`);
    if (!Array.isArray(rows)) return false;
    const expected = new Set(source.migrations.map(migration => migration.name || migration.constructor.name));
    const executed = new Set<string>();
    for (const row of rows) {
      if (!row || typeof row !== 'object' || !('name' in row) || typeof row.name !== 'string') return false;
      executed.add(row.name);
    }
    return rows.length === expected.size && executed.size === expected.size && [...expected].every(name => executed.has(name));
  } catch { return false; }
}
