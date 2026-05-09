import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrlTeam1770129007066 implements MigrationInterface {
    name = 'AddImageUrlTeam1770129007066'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_Team" ("TeamId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "TeamName" text NOT NULL, "Description" text, "CampaignId" integer, "ImageUrl" text, CONSTRAINT "UQ_042036b4e6cf6a153ae32558546" UNIQUE ("TeamName"), CONSTRAINT "FK_fbc2094d592cb225a72658160e3" FOREIGN KEY ("CampaignId") REFERENCES "Campaign" ("CampaignId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Team"("TeamId", "TeamName", "Description", "CampaignId") SELECT "TeamId", "TeamName", "Description", "CampaignId" FROM "Team"`);
        await queryRunner.query(`DROP TABLE "Team"`);
        await queryRunner.query(`ALTER TABLE "temporary_Team" RENAME TO "Team"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Team" RENAME TO "temporary_Team"`);
        await queryRunner.query(`CREATE TABLE "Team" ("TeamId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "TeamName" text NOT NULL, "Description" text, "CampaignId" integer, CONSTRAINT "UQ_042036b4e6cf6a153ae32558546" UNIQUE ("TeamName"), CONSTRAINT "FK_fbc2094d592cb225a72658160e3" FOREIGN KEY ("CampaignId") REFERENCES "Campaign" ("CampaignId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Team"("TeamId", "TeamName", "Description", "CampaignId") SELECT "TeamId", "TeamName", "Description", "CampaignId" FROM "temporary_Team"`);
        await queryRunner.query(`DROP TABLE "temporary_Team"`);
    }

}
