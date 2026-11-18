import { TableCheck, type MigrationInterface, type QueryRunner } from 'typeorm';

/** The R06 inline column check works in SQLite but is invisible to TypeORM's schema reader. */
export class NormalizeCoordinateCheck1795104000000 implements MigrationInterface {
  name = 'NormalizeCoordinateCheck1795104000000';
  async up(runner: QueryRunner): Promise<void> {
    const table = await runner.getTable('Post');
    if (!table?.checks.some(check => check.name === 'CHK_Post_Coordinates')) {
      await runner.createCheckConstraint('Post', new TableCheck({ name: 'CHK_Post_Coordinates', expression:
        '("Latitude" IS NULL AND "Longitude" IS NULL) OR ("Latitude" IS NOT NULL AND "Longitude" IS NOT NULL AND "Latitude" BETWEEN -90 AND 90 AND "Longitude" BETWEEN -180 AND 180)' }));
    }
  }
  // Representation-only normalization. Keep the R06 invariant and all data on down;
  // reapplying is harmless. Full version rollback uses a verified database backup.
  async down(): Promise<void> {}
}
