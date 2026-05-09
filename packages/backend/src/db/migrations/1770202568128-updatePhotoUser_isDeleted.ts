import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePhotoUserIsDeleted1770202568128 implements MigrationInterface {
    name = 'UpdatePhotoUserIsDeleted1770202568128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_User" ("UserId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "FullName" text NOT NULL, "Mssv" text, "Class" text, "Email" text NOT NULL, "TeamId" integer, "AccId" integer, "PhoneNumber" text, "avatarUrl" text, "isDeleted" integer NOT NULL DEFAULT (0), CONSTRAINT "REL_ddb7628cc78eece20794d21b9d" UNIQUE ("AccId"), CONSTRAINT "UQ_2f56f7040c2b05fc8f08a113f72" UNIQUE ("Email"), CONSTRAINT "FK_ddb7628cc78eece20794d21b9d2" FOREIGN KEY ("AccId") REFERENCES "Account" ("AccID") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_95eee988e3f682d898220d04a7a" FOREIGN KEY ("TeamId") REFERENCES "Team" ("TeamId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_User"("UserId", "FullName", "Mssv", "Class", "Email", "TeamId", "AccId", "PhoneNumber", "avatarUrl") SELECT "UserId", "FullName", "Mssv", "Class", "Email", "TeamId", "AccId", "PhoneNumber", "avatarUrl" FROM "User"`);
        await queryRunner.query(`DROP TABLE "User"`);
        await queryRunner.query(`ALTER TABLE "temporary_User" RENAME TO "User"`);
        await queryRunner.query(`CREATE TABLE "temporary_Photo" ("PhotoId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text, "ImageUrl" text NOT NULL, "UploadedAt" text NOT NULL, "PostID" integer, "isFirstImage" integer, "isDeleted" integer NOT NULL DEFAULT (0), CONSTRAINT "UQ_92a60c2f5ae771bb7197eaf92ca" UNIQUE ("ImageUrl"), CONSTRAINT "FK_8895cdb912435e6d02b3f3de3fe" FOREIGN KEY ("PostID") REFERENCES "Post" ("PostId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Photo"("PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "isFirstImage") SELECT "PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "isFirstImage" FROM "Photo"`);
        await queryRunner.query(`DROP TABLE "Photo"`);
        await queryRunner.query(`ALTER TABLE "temporary_Photo" RENAME TO "Photo"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Photo" RENAME TO "temporary_Photo"`);
        await queryRunner.query(`CREATE TABLE "Photo" ("PhotoId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text, "ImageUrl" text NOT NULL, "UploadedAt" text NOT NULL, "PostID" integer, "isFirstImage" integer, CONSTRAINT "UQ_92a60c2f5ae771bb7197eaf92ca" UNIQUE ("ImageUrl"), CONSTRAINT "FK_8895cdb912435e6d02b3f3de3fe" FOREIGN KEY ("PostID") REFERENCES "Post" ("PostId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Photo"("PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "isFirstImage") SELECT "PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "isFirstImage" FROM "temporary_Photo"`);
        await queryRunner.query(`DROP TABLE "temporary_Photo"`);
        await queryRunner.query(`ALTER TABLE "User" RENAME TO "temporary_User"`);
        await queryRunner.query(`CREATE TABLE "User" ("UserId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "FullName" text NOT NULL, "Mssv" text, "Class" text, "Email" text NOT NULL, "TeamId" integer, "AccId" integer, "PhoneNumber" text, "avatarUrl" text, CONSTRAINT "REL_ddb7628cc78eece20794d21b9d" UNIQUE ("AccId"), CONSTRAINT "UQ_2f56f7040c2b05fc8f08a113f72" UNIQUE ("Email"), CONSTRAINT "FK_ddb7628cc78eece20794d21b9d2" FOREIGN KEY ("AccId") REFERENCES "Account" ("AccID") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_95eee988e3f682d898220d04a7a" FOREIGN KEY ("TeamId") REFERENCES "Team" ("TeamId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "User"("UserId", "FullName", "Mssv", "Class", "Email", "TeamId", "AccId", "PhoneNumber", "avatarUrl") SELECT "UserId", "FullName", "Mssv", "Class", "Email", "TeamId", "AccId", "PhoneNumber", "avatarUrl" FROM "temporary_User"`);
        await queryRunner.query(`DROP TABLE "temporary_User"`);
    }

}
