import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Additive upgrade: legacy posts stay unlocated; no fabricated backfill. */
export class AddPostCoordinates1794931200000 implements MigrationInterface {
  name = 'AddPostCoordinates1794931200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "Post" ADD COLUMN "Latitude" real');
    await queryRunner.query(`ALTER TABLE "Post" ADD COLUMN "Longitude" real
      CONSTRAINT "CHK_Post_Coordinates" CHECK (
        ("Latitude" IS NULL AND "Longitude" IS NULL) OR
        ("Latitude" IS NOT NULL AND "Longitude" IS NOT NULL
          AND "Latitude" BETWEEN -90 AND 90 AND "Longitude" BETWEEN -180 AND 180)
      )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Native DROP avoids rebuilding the parent Post table with live Photo FKs.
    // Requires SQLite >= 3.35. Coordinates are intentionally discarded on rollback.
    await queryRunner.query('ALTER TABLE "Post" DROP COLUMN "Longitude"');
    await queryRunner.query('ALTER TABLE "Post" DROP COLUMN "Latitude"');
  }
}
