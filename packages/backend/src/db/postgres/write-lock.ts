import type { EntityManager } from 'typeorm';

/** Coordinate data setup and lifecycle writes across overlapping deploys. */
export async function lockPostgresWrites(manager: EntityManager): Promise<void> {
  if (manager.connection.options.type === 'postgres') {
    await manager.query('SELECT pg_advisory_xact_lock(1795104000, 1)');
  }
}
