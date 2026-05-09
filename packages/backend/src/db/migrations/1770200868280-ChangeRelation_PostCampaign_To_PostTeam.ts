import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeRelationPostCampaignToPostTeam1770200868280 implements MigrationInterface {
    name = 'ChangeRelationPostCampaignToPostTeam1770200868280'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_Post" ("PostId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text NOT NULL, "Content" text NOT NULL, "IsDeleted" integer NOT NULL DEFAULT (0), "CampaignId" integer, "AuthorId" integer, "CreatedAt" text NOT NULL, "UpdatedAt" text NOT NULL, CONSTRAINT "FK_51a3a7d663468309804847743f3" FOREIGN KEY ("AuthorId") REFERENCES "User" ("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Post"("PostId", "Title", "Content", "IsDeleted", "CampaignId", "AuthorId", "CreatedAt", "UpdatedAt") SELECT "PostId", "Title", "Content", "IsDeleted", "CampaignId", "AuthorId", "CreatedAt", "UpdatedAt" FROM "Post"`);
        await queryRunner.query(`DROP TABLE "Post"`);
        await queryRunner.query(`ALTER TABLE "temporary_Post" RENAME TO "Post"`);
        await queryRunner.query(`CREATE TABLE "temporary_Photo" ("PhotoId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text, "ImageUrl" text NOT NULL, "UploadedAt" text NOT NULL, "PostID" integer, "TeamId" integer, CONSTRAINT "UQ_92a60c2f5ae771bb7197eaf92ca" UNIQUE ("ImageUrl"), CONSTRAINT "FK_8895cdb912435e6d02b3f3de3fe" FOREIGN KEY ("PostID") REFERENCES "Post" ("PostId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Photo"("PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "TeamId") SELECT "PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "TeamId" FROM "Photo"`);
        await queryRunner.query(`DROP TABLE "Photo"`);
        await queryRunner.query(`ALTER TABLE "temporary_Photo" RENAME TO "Photo"`);
        await queryRunner.query(`CREATE TABLE "temporary_Account" ("AccId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Username" text NOT NULL, "Password" text NOT NULL, "RoleId" integer NOT NULL, "CreateAt" text, "UpdatedAt" text, "isDeleted" boolean NOT NULL DEFAULT (false), CONSTRAINT "UQ_412a2768f8054c28b160cca18f6" UNIQUE ("Username"), CONSTRAINT "FK_26f742c115858ce3ceaced87d77" FOREIGN KEY ("RoleId") REFERENCES "Role" ("RoleId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Account"("AccId", "Username", "Password", "RoleId", "CreateAt", "UpdatedAt", "isDeleted") SELECT "AccId", "Username", "Password", "RoleId", "CreateAt", "UpdatedAt", "IsDeleted" FROM "Account"`);
        await queryRunner.query(`DROP TABLE "Account"`);
        await queryRunner.query(`ALTER TABLE "temporary_Account" RENAME TO "Account"`);
        await queryRunner.query(`CREATE TABLE "temporary_Post" ("PostId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text NOT NULL, "Content" text NOT NULL, "IsDeleted" integer NOT NULL DEFAULT (0), "TeamId" integer, "AuthorId" integer, "CreatedAt" text NOT NULL, "UpdatedAt" text NOT NULL, CONSTRAINT "FK_51a3a7d663468309804847743f3" FOREIGN KEY ("AuthorId") REFERENCES "User" ("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Post"("PostId", "Title", "Content", "IsDeleted", "TeamId", "AuthorId", "CreatedAt", "UpdatedAt") SELECT "PostId", "Title", "Content", "IsDeleted", "CampaignId", "AuthorId", "CreatedAt", "UpdatedAt" FROM "Post"`);
        await queryRunner.query(`DROP TABLE "Post"`);
        await queryRunner.query(`ALTER TABLE "temporary_Post" RENAME TO "Post"`);
        await queryRunner.query(`CREATE TABLE "temporary_Photo" ("PhotoId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text, "ImageUrl" text NOT NULL, "UploadedAt" text NOT NULL, "PostID" integer, "isFirstImage" integer, CONSTRAINT "UQ_92a60c2f5ae771bb7197eaf92ca" UNIQUE ("ImageUrl"), CONSTRAINT "FK_8895cdb912435e6d02b3f3de3fe" FOREIGN KEY ("PostID") REFERENCES "Post" ("PostId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Photo"("PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "isFirstImage") SELECT "PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "TeamId" FROM "Photo"`);
        await queryRunner.query(`DROP TABLE "Photo"`);
        await queryRunner.query(`ALTER TABLE "temporary_Photo" RENAME TO "Photo"`);
        await queryRunner.query(`CREATE TABLE "temporary_User" ("UserId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "FullName" text NOT NULL, "Mssv" text, "Class" text, "Email" text NOT NULL, "TeamId" integer, "AccId" integer, "PhoneNumber" text, "avatarUrl" text, CONSTRAINT "UQ_2f56f7040c2b05fc8f08a113f72" UNIQUE ("Email"), CONSTRAINT "REL_ddb7628cc78eece20794d21b9d" UNIQUE ("AccId"), CONSTRAINT "FK_95eee988e3f682d898220d04a7a" FOREIGN KEY ("TeamId") REFERENCES "Team" ("TeamId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_ddb7628cc78eece20794d21b9d2" FOREIGN KEY ("AccId") REFERENCES "Account" ("AccID") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_User"("UserId", "FullName", "Mssv", "Class", "Email", "TeamId", "AccId", "PhoneNumber") SELECT "UserId", "FullName", "Mssv", "Class", "Email", "TeamId", "AccId", "PhoneNumber" FROM "User"`);
        await queryRunner.query(`DROP TABLE "User"`);
        await queryRunner.query(`ALTER TABLE "temporary_User" RENAME TO "User"`);
        await queryRunner.query(`CREATE TABLE "temporary_Team" ("TeamId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "TeamName" text NOT NULL, "Description" text, "CampaignId" integer, "ImageUrl" text, "IsDeleted" integer NOT NULL DEFAULT (0), "LeaderId" integer, CONSTRAINT "UQ_042036b4e6cf6a153ae32558546" UNIQUE ("TeamName"), CONSTRAINT "FK_fbc2094d592cb225a72658160e3" FOREIGN KEY ("CampaignId") REFERENCES "Campaign" ("CampaignId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Team"("TeamId", "TeamName", "Description", "CampaignId", "ImageUrl") SELECT "TeamId", "TeamName", "Description", "CampaignId", "ImageUrl" FROM "Team"`);
        await queryRunner.query(`DROP TABLE "Team"`);
        await queryRunner.query(`ALTER TABLE "temporary_Team" RENAME TO "Team"`);
        await queryRunner.query(`CREATE TABLE "temporary_Account" ("AccId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Username" text NOT NULL, "Password" text NOT NULL, "RoleId" integer NOT NULL, "CreateAt" text, "UpdatedAt" text, "isDeleted" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_412a2768f8054c28b160cca18f6" UNIQUE ("Username"), CONSTRAINT "FK_26f742c115858ce3ceaced87d77" FOREIGN KEY ("RoleId") REFERENCES "Role" ("RoleId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Account"("AccId", "Username", "Password", "RoleId", "CreateAt", "UpdatedAt", "isDeleted") SELECT "AccId", "Username", "Password", "RoleId", "CreateAt", "UpdatedAt", "isDeleted" FROM "Account"`);
        await queryRunner.query(`DROP TABLE "Account"`);
        await queryRunner.query(`ALTER TABLE "temporary_Account" RENAME TO "Account"`);
        await queryRunner.query(`CREATE TABLE "temporary_Team" ("TeamId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "TeamName" text NOT NULL, "Description" text, "CampaignId" integer, "ImageUrl" text, "IsDeleted" integer NOT NULL DEFAULT (0), "LeaderId" integer, CONSTRAINT "UQ_042036b4e6cf6a153ae32558546" UNIQUE ("TeamName"), CONSTRAINT "FK_fbc2094d592cb225a72658160e3" FOREIGN KEY ("CampaignId") REFERENCES "Campaign" ("CampaignId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_50f0f887fd6e21c0a388c15f97a" FOREIGN KEY ("LeaderId") REFERENCES "User" ("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Team"("TeamId", "TeamName", "Description", "CampaignId", "ImageUrl", "IsDeleted", "LeaderId") SELECT "TeamId", "TeamName", "Description", "CampaignId", "ImageUrl", "IsDeleted", "LeaderId" FROM "Team"`);
        await queryRunner.query(`DROP TABLE "Team"`);
        await queryRunner.query(`ALTER TABLE "temporary_Team" RENAME TO "Team"`);
        await queryRunner.query(`CREATE TABLE "temporary_Post" ("PostId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text NOT NULL, "Content" text NOT NULL, "IsDeleted" integer NOT NULL DEFAULT (0), "TeamId" integer, "AuthorId" integer, "CreatedAt" text NOT NULL, "UpdatedAt" text NOT NULL, CONSTRAINT "FK_51a3a7d663468309804847743f3" FOREIGN KEY ("AuthorId") REFERENCES "User" ("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_00a28c2d1dbe9503b18f44ac3a0" FOREIGN KEY ("TeamId") REFERENCES "Team" ("TeamId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_Post"("PostId", "Title", "Content", "IsDeleted", "TeamId", "AuthorId", "CreatedAt", "UpdatedAt") SELECT "PostId", "Title", "Content", "IsDeleted", "TeamId", "AuthorId", "CreatedAt", "UpdatedAt" FROM "Post"`);
        await queryRunner.query(`DROP TABLE "Post"`);
        await queryRunner.query(`ALTER TABLE "temporary_Post" RENAME TO "Post"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Post" RENAME TO "temporary_Post"`);
        await queryRunner.query(`CREATE TABLE "Post" ("PostId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text NOT NULL, "Content" text NOT NULL, "IsDeleted" integer NOT NULL DEFAULT (0), "TeamId" integer, "AuthorId" integer, "CreatedAt" text NOT NULL, "UpdatedAt" text NOT NULL, CONSTRAINT "FK_51a3a7d663468309804847743f3" FOREIGN KEY ("AuthorId") REFERENCES "User" ("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Post"("PostId", "Title", "Content", "IsDeleted", "TeamId", "AuthorId", "CreatedAt", "UpdatedAt") SELECT "PostId", "Title", "Content", "IsDeleted", "TeamId", "AuthorId", "CreatedAt", "UpdatedAt" FROM "temporary_Post"`);
        await queryRunner.query(`DROP TABLE "temporary_Post"`);
        await queryRunner.query(`ALTER TABLE "Team" RENAME TO "temporary_Team"`);
        await queryRunner.query(`CREATE TABLE "Team" ("TeamId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "TeamName" text NOT NULL, "Description" text, "CampaignId" integer, "ImageUrl" text, "IsDeleted" integer NOT NULL DEFAULT (0), "LeaderId" integer, CONSTRAINT "UQ_042036b4e6cf6a153ae32558546" UNIQUE ("TeamName"), CONSTRAINT "FK_fbc2094d592cb225a72658160e3" FOREIGN KEY ("CampaignId") REFERENCES "Campaign" ("CampaignId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Team"("TeamId", "TeamName", "Description", "CampaignId", "ImageUrl", "IsDeleted", "LeaderId") SELECT "TeamId", "TeamName", "Description", "CampaignId", "ImageUrl", "IsDeleted", "LeaderId" FROM "temporary_Team"`);
        await queryRunner.query(`DROP TABLE "temporary_Team"`);
        await queryRunner.query(`ALTER TABLE "Account" RENAME TO "temporary_Account"`);
        await queryRunner.query(`CREATE TABLE "Account" ("AccId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Username" text NOT NULL, "Password" text NOT NULL, "RoleId" integer NOT NULL, "CreateAt" text, "UpdatedAt" text, "isDeleted" boolean NOT NULL DEFAULT (false), CONSTRAINT "UQ_412a2768f8054c28b160cca18f6" UNIQUE ("Username"), CONSTRAINT "FK_26f742c115858ce3ceaced87d77" FOREIGN KEY ("RoleId") REFERENCES "Role" ("RoleId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Account"("AccId", "Username", "Password", "RoleId", "CreateAt", "UpdatedAt", "isDeleted") SELECT "AccId", "Username", "Password", "RoleId", "CreateAt", "UpdatedAt", "isDeleted" FROM "temporary_Account"`);
        await queryRunner.query(`DROP TABLE "temporary_Account"`);
        await queryRunner.query(`ALTER TABLE "Team" RENAME TO "temporary_Team"`);
        await queryRunner.query(`CREATE TABLE "Team" ("TeamId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "TeamName" text NOT NULL, "Description" text, "CampaignId" integer, "ImageUrl" text, CONSTRAINT "UQ_042036b4e6cf6a153ae32558546" UNIQUE ("TeamName"), CONSTRAINT "FK_fbc2094d592cb225a72658160e3" FOREIGN KEY ("CampaignId") REFERENCES "Campaign" ("CampaignId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Team"("TeamId", "TeamName", "Description", "CampaignId", "ImageUrl") SELECT "TeamId", "TeamName", "Description", "CampaignId", "ImageUrl" FROM "temporary_Team"`);
        await queryRunner.query(`DROP TABLE "temporary_Team"`);
        await queryRunner.query(`ALTER TABLE "User" RENAME TO "temporary_User"`);
        await queryRunner.query(`CREATE TABLE "User" ("UserId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "FullName" text NOT NULL, "Mssv" text, "Class" text, "Email" text NOT NULL, "TeamId" integer, "AccId" integer, "PhoneNumber" text, CONSTRAINT "UQ_2f56f7040c2b05fc8f08a113f72" UNIQUE ("Email"), CONSTRAINT "REL_ddb7628cc78eece20794d21b9d" UNIQUE ("AccId"), CONSTRAINT "FK_95eee988e3f682d898220d04a7a" FOREIGN KEY ("TeamId") REFERENCES "Team" ("TeamId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_ddb7628cc78eece20794d21b9d2" FOREIGN KEY ("AccId") REFERENCES "Account" ("AccID") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "User"("UserId", "FullName", "Mssv", "Class", "Email", "TeamId", "AccId", "PhoneNumber") SELECT "UserId", "FullName", "Mssv", "Class", "Email", "TeamId", "AccId", "PhoneNumber" FROM "temporary_User"`);
        await queryRunner.query(`DROP TABLE "temporary_User"`);
        await queryRunner.query(`ALTER TABLE "Photo" RENAME TO "temporary_Photo"`);
        await queryRunner.query(`CREATE TABLE "Photo" ("PhotoId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text, "ImageUrl" text NOT NULL, "UploadedAt" text NOT NULL, "PostID" integer, "TeamId" integer, CONSTRAINT "UQ_92a60c2f5ae771bb7197eaf92ca" UNIQUE ("ImageUrl"), CONSTRAINT "FK_8895cdb912435e6d02b3f3de3fe" FOREIGN KEY ("PostID") REFERENCES "Post" ("PostId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Photo"("PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "TeamId") SELECT "PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "isFirstImage" FROM "temporary_Photo"`);
        await queryRunner.query(`DROP TABLE "temporary_Photo"`);
        await queryRunner.query(`ALTER TABLE "Post" RENAME TO "temporary_Post"`);
        await queryRunner.query(`CREATE TABLE "Post" ("PostId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text NOT NULL, "Content" text NOT NULL, "IsDeleted" integer NOT NULL DEFAULT (0), "CampaignId" integer, "AuthorId" integer, "CreatedAt" text NOT NULL, "UpdatedAt" text NOT NULL, CONSTRAINT "FK_51a3a7d663468309804847743f3" FOREIGN KEY ("AuthorId") REFERENCES "User" ("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Post"("PostId", "Title", "Content", "IsDeleted", "CampaignId", "AuthorId", "CreatedAt", "UpdatedAt") SELECT "PostId", "Title", "Content", "IsDeleted", "TeamId", "AuthorId", "CreatedAt", "UpdatedAt" FROM "temporary_Post"`);
        await queryRunner.query(`DROP TABLE "temporary_Post"`);
        await queryRunner.query(`ALTER TABLE "Account" RENAME TO "temporary_Account"`);
        await queryRunner.query(`CREATE TABLE "Account" ("AccId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Username" text NOT NULL, "Password" text NOT NULL, "RoleId" integer NOT NULL, "CreateAt" text, "UpdatedAt" text, "IsDeleted" boolean NOT NULL DEFAULT (false), CONSTRAINT "UQ_412a2768f8054c28b160cca18f6" UNIQUE ("Username"), CONSTRAINT "FK_26f742c115858ce3ceaced87d77" FOREIGN KEY ("RoleId") REFERENCES "Role" ("RoleId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Account"("AccId", "Username", "Password", "RoleId", "CreateAt", "UpdatedAt", "IsDeleted") SELECT "AccId", "Username", "Password", "RoleId", "CreateAt", "UpdatedAt", "isDeleted" FROM "temporary_Account"`);
        await queryRunner.query(`DROP TABLE "temporary_Account"`);
        await queryRunner.query(`ALTER TABLE "Photo" RENAME TO "temporary_Photo"`);
        await queryRunner.query(`CREATE TABLE "Photo" ("PhotoId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text, "ImageUrl" text NOT NULL, "UploadedAt" text NOT NULL, "PostID" integer, "TeamId" integer, CONSTRAINT "UQ_92a60c2f5ae771bb7197eaf92ca" UNIQUE ("ImageUrl"), CONSTRAINT "FK_019171a2593cbad83a264d2a494" FOREIGN KEY ("TeamId") REFERENCES "Team" ("TeamId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_8895cdb912435e6d02b3f3de3fe" FOREIGN KEY ("PostID") REFERENCES "Post" ("PostId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Photo"("PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "TeamId") SELECT "PhotoId", "Title", "ImageUrl", "UploadedAt", "PostID", "TeamId" FROM "temporary_Photo"`);
        await queryRunner.query(`DROP TABLE "temporary_Photo"`);
        await queryRunner.query(`ALTER TABLE "Post" RENAME TO "temporary_Post"`);
        await queryRunner.query(`CREATE TABLE "Post" ("PostId" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "Title" text NOT NULL, "Content" text NOT NULL, "IsDeleted" integer NOT NULL DEFAULT (0), "CampaignId" integer, "AuthorId" integer, "CreatedAt" text NOT NULL, "UpdatedAt" text NOT NULL, CONSTRAINT "FK_51a3a7d663468309804847743f3" FOREIGN KEY ("AuthorId") REFERENCES "User" ("UserId") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_0105963ac5cc91ffdfd36d93cb8" FOREIGN KEY ("CampaignId") REFERENCES "Campaign" ("CampaignId") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "Post"("PostId", "Title", "Content", "IsDeleted", "CampaignId", "AuthorId", "CreatedAt", "UpdatedAt") SELECT "PostId", "Title", "Content", "IsDeleted", "CampaignId", "AuthorId", "CreatedAt", "UpdatedAt" FROM "temporary_Post"`);
        await queryRunner.query(`DROP TABLE "temporary_Post"`);
    }

}
