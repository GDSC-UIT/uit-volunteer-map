import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { AppDataSource } from "../db/data-source.js";
import { Account } from "../entities/Account.js";
import { Attachment } from "../entities/Attachment.js";
import { Campaign } from "../entities/Campaign.js";
import { Photo } from "../entities/Photo.js";
import { Post } from "../entities/Post.js";
import { Role } from "../entities/Role.js";
import { Team } from "../entities/Team.js";
import { User } from "../entities/User.js";
import { AUTH_ERRORS, HTTP_STATUS, RoleEnum } from "@uit-volunteer-map/shared";

const JWT_SECRET = process.env.JWT_SECRET!;

const signToken = (role: RoleEnum) =>
  jwt.sign({ accId: role === RoleEnum.ADMIN ? 1 : 2, role }, JWT_SECRET, {
    expiresIn: "1h",
  });

describe("Role authorization for Campaign, Post and Team routes", () => {
  let adminToken: string;
  let leaderToken: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.setOptions({
        type: "sqlite",
        database: ":memory:",
        synchronize: true,
        logging: false,
        entities: [Account, Role, User, Campaign, Team, Post, Photo, Attachment],
        migrations: [],
        subscribers: [],
      }).initialize();
    }

    adminToken = signToken(RoleEnum.ADMIN);
    leaderToken = signToken(RoleEnum.LEADER);
  });

  beforeEach(async () => {
    await AppDataSource.synchronize(true);
  });

  it("keeps public read endpoints accessible without token", async () => {
    const campaignRes = await request(app).get("/api/campaigns");
    const postRes = await request(app).get("/api/posts");
    const teamRes = await request(app).get("/api/teams");

    expect(campaignRes.status).toBe(HTTP_STATUS.OK);
    expect(postRes.status).toBe(HTTP_STATUS.OK);
    expect(teamRes.status).toBe(HTTP_STATUS.OK);
  });

  it("returns 401 for protected write endpoints without token", async () => {
    const campaignRes = await request(app).post("/api/campaigns").send({});
    const postRes = await request(app).post("/api/posts").send({});
    const teamRes = await request(app).post("/api/teams").send({});

    expect(campaignRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(postRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(teamRes.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(campaignRes.body.error).toBe(AUTH_ERRORS.TOKEN_REQUIRED);
    expect(postRes.body.error).toBe(AUTH_ERRORS.TOKEN_REQUIRED);
    expect(teamRes.body.error).toBe(AUTH_ERRORS.TOKEN_REQUIRED);
  });

  it("returns 403 when leader calls admin-only write endpoints", async () => {
    const campaignRes = await request(app)
      .post("/api/campaigns")
      .set("Authorization", `Bearer ${leaderToken}`)
      .send({
        campaignName: "Leader Campaign",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

    const teamCreateRes = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${leaderToken}`)
      .send({});

    const teamDeleteRes = await request(app)
      .delete("/api/teams/1")
      .set("Authorization", `Bearer ${leaderToken}`);

    expect(campaignRes.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(teamCreateRes.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(teamDeleteRes.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(campaignRes.body.error).toBe(AUTH_ERRORS.PERMISSION_DENIED);
    expect(teamCreateRes.body.error).toBe(AUTH_ERRORS.PERMISSION_DENIED);
    expect(teamDeleteRes.body.error).toBe(AUTH_ERRORS.PERMISSION_DENIED);
  });

  it("lets allowed roles pass authorization before validation/service handling", async () => {
    const campaignRes = await request(app)
      .post("/api/campaigns")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    const postRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${leaderToken}`)
      .send({});

    const teamRes = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(campaignRes.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(postRes.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(teamRes.status).toBe(HTTP_STATUS.BAD_REQUEST);
  });
});
