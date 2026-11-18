import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Preserve the previous first-flag/ID order, including archived rows, without rebuilding parents. */
export class AddPhotoPosition1795017600000 implements MigrationInterface {
  name = 'AddPhotoPosition1795017600000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query('ALTER TABLE "Photo" ADD COLUMN "Position" integer NOT NULL DEFAULT 0');
    await runner.query(`WITH ranked AS (
      SELECT "PhotoId", ROW_NUMBER() OVER (PARTITION BY "PostID"
        ORDER BY CASE WHEN "isFirstImage" = 1 THEN 0 ELSE 1 END, "PhotoId") - 1 AS position FROM "Photo"
    ) UPDATE "Photo" SET "Position" = (SELECT position FROM ranked WHERE ranked."PhotoId" = "Photo"."PhotoId")`);
    await runner.query(`UPDATE "Photo" AS current SET "isFirstImage" = CASE WHEN current."isDeleted" = 0 AND current."PostID" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "Photo" AS prior WHERE prior."PostID" = current."PostID" AND prior."isDeleted" = 0 AND prior."Position" < current."Position") THEN 1 ELSE 0 END`);
  }
  async down(runner: QueryRunner): Promise<void> {
    // SQLite >= 3.35. Historical contradictory first flags are normalized, not restored.
    await runner.query('ALTER TABLE "Photo" DROP COLUMN "Position"');
  }
}
