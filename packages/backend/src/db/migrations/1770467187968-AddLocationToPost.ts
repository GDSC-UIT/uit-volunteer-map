import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationToPost1770467187968 implements MigrationInterface {
    name = 'AddLocationToPost1770467187968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_Post" ("PostId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text NOT NULL, "Content" text NOT NULL, "IsDeleted" integer NOT NULL DEFAULT (0), "TeamId" integer, "AuthorId" integer, "CreatedAt" text NOT NULL, "UpdatedAt" text NOT NULL, "Location" text, CONSTRAINT "FK_51a3a7d663468309804847743f3" FOREIGN KEY ("AuthorId") REFERENCES "User" ("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_00a28c2d1dbe9503b18f44ac3a0" FOREIGN KEY ("TeamId") REFERENCES "Team" ("TeamId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Post"("PostId", "Title", "Content", "IsDeleted", "TeamId", "AuthorId", "CreatedAt", "UpdatedAt") SELECT "PostId", "Title", "Content", "IsDeleted", "TeamId", "AuthorId", "CreatedAt", "UpdatedAt" FROM "Post"`);
        await queryRunner.query(`DROP TABLE "Post"`);
        await queryRunner.query(`ALTER TABLE "temporary_Post" RENAME TO "Post"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Post" RENAME TO "temporary_Post"`);
        await queryRunner.query(`CREATE TABLE "Post" ("PostId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text NOT NULL, "Content" text NOT NULL, "IsDeleted" integer NOT NULL DEFAULT (0), "TeamId" integer, "AuthorId" integer, "CreatedAt" text NOT NULL, "UpdatedAt" text NOT NULL, CONSTRAINT "FK_51a3a7d663468309804847743f3" FOREIGN KEY ("AuthorId") REFERENCES "User" ("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_00a28c2d1dbe9503b18f44ac3a0" FOREIGN KEY ("TeamId") REFERENCES "Team" ("TeamId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Post"("PostId", "Title", "Content", "IsDeleted", "TeamId", "AuthorId", "CreatedAt", "UpdatedAt") SELECT "PostId", "Title", "Content", "IsDeleted", "TeamId", "AuthorId", "CreatedAt", "UpdatedAt" FROM "temporary_Post"`);
        await queryRunner.query(`DROP TABLE "temporary_Post"`);
    }

}
