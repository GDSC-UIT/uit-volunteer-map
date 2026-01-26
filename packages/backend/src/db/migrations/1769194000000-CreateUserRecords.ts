import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserRecords1769194000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create User records for admin, leader, and leader2 accounts
    await queryRunner.query(`
            INSERT OR IGNORE INTO "User" ("accId", "FullName", "Email", "PhoneNumber")
            SELECT accId, Username || ' User', Username || '@example.com', '0000000000'
            FROM "Account"
            WHERE "Username" IN ('admin', 'leader', 'leader2');
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "User" WHERE accId IN (
            SELECT accId FROM "Account" WHERE "Username" IN ('admin', 'leader', 'leader2')
        )`);
  }
}
