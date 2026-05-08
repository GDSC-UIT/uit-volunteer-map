import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAttachmentTable1770103330626 implements MigrationInterface {
    name = 'AddAttachmentTable1770103330626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_Attachment" ("AttachmentId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "ImageUrl" text NOT NULL, "UploadedAt" text NOT NULL, "position" integer, "CampaignId" integer, "TeamId" integer, CONSTRAINT "UQ_e96cc3f6fead2b34ca36472242b" UNIQUE ("ImageUrl"), CONSTRAINT "FK_39dcaa4690bbac58b92b81e9c5c" FOREIGN KEY ("TeamId") REFERENCES "Team" ("TeamId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_68cd830b2d0d788789fc4873022" FOREIGN KEY ("CampaignId") REFERENCES "Campaign" ("CampaignId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`ALTER TABLE "temporary_Attachment" RENAME TO "Attachment"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Attachment" RENAME TO "temporary_Attachment"`);
        await queryRunner.query(`DROP TABLE "temporary_Attachment"`);
    }

}
