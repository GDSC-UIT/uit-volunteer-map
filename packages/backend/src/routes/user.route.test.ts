import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import app from "../app.js";
import { AppDataSource } from "../db/data-source.js";
import { Account } from "../entities/Account.js";
import { Role } from "../entities/Role.js";
import { User } from "../entities/User.js";
import { Campaign } from "../entities/Campaign.js";
import { Team } from "../entities/Team.js";
import { Post } from "../entities/Post.js";
import { Photo } from "../entities/Photo.js";
import { RoleEnum } from "@uit-volunteer-map/shared";

const JWT_SECRET = process.env.JWT_SECRET!;

describe("User Profile Routes", () => {
  let adminToken: string;
  let leaderToken: string;
  let adminAccount: Account;
  let leaderAccount: Account;
  let adminUser: User;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.setOptions({
        type: "sqlite",
        database: ":memory:",
        synchronize: true,
        logging: false,
        entities: [Account, Role, User, Campaign, Team, Post, Photo],
        migrations: [],
        subscribers: [],
      }).initialize();
    } else {
      await AppDataSource.synchronize(true);
    }

    const roleRepo = AppDataSource.getRepository(Role);
    const accRepo = AppDataSource.getRepository(Account);
    const userRepo = AppDataSource.getRepository(User);

    const adminRole = await roleRepo.save({ roleName: RoleEnum.ADMIN });
    const leaderRole = await roleRepo.save({ roleName: RoleEnum.LEADER });

    const adminPass = await bcrypt.hash("admin123", 10);
    const leaderPass = await bcrypt.hash("leader123", 10);

    adminAccount = await accRepo.save({
      username: "admin",
      password: adminPass,
      roleId: adminRole.roleId,
    });

    leaderAccount = await accRepo.save({
      username: "leader",
      password: leaderPass,
      roleId: leaderRole.roleId,
    });

    adminUser = await userRepo.save({
      fullName: "Admin User",
      email: "admin@example.com",
      phoneNumber: "0111111111",
      mssv: "20210001",
      class: "20211",
      account: adminAccount,
    });

    await userRepo.save({
      fullName: "Leader User",
      email: "leader@example.com",
      phoneNumber: "0222222222",
      mssv: "20210002",
      class: "20212",
      account: leaderAccount,
    });

    adminToken = jwt.sign(
      { accId: adminAccount.accId, role: RoleEnum.ADMIN },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    leaderToken = jwt.sign(
      { accId: leaderAccount.accId, role: RoleEnum.LEADER },
      JWT_SECRET,
      { expiresIn: "1h" },
    );
  });

  describe("GET /api/users/profile", () => {
    it("should return user profile with valid token", async () => {
      const res = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.message).toBe("User detail");
      expect(res.body.data).toMatchObject({
        UserId: String(adminUser.userId),
        FullName: "Admin User",
        Email: "admin@example.com",
        PhoneNumber: "0111111111",
        Mssv: "20210001",
        Class: "20211",
      });
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/api/users/profile");

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(401);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("should return 401 when token is invalid", async () => {
      const res = await request(app)
        .get("/api/users/profile")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(401);
    });

    it("should allow both admin and leader to access profile", async () => {
      const adminRes = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${adminToken}`);

      const leaderRes = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${leaderToken}`);

      expect(adminRes.status).toBe(200);
      expect(leaderRes.status).toBe(200);
      expect(adminRes.body.data.Email).toBe("admin@example.com");
      expect(leaderRes.body.data.Email).toBe("leader@example.com");
    });

    it("should return 404 when user associated with account does not exist", async () => {
      // Create a token for a non-existent user
      const fakeToken = jwt.sign(
        { accId: 9999, role: RoleEnum.ADMIN },
        JWT_SECRET,
        { expiresIn: "1h" },
      );

      const res = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${fakeToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(404);
      expect(res.body.error).toBe("Not Found");
      expect(res.body.message).toContain("User with ID");
    });
  });

  describe("PUT /api/users/profile", () => {
    it("should update user profile with valid data", async () => {
      const updateData = {
        FullName: "Updated Admin",
        Email: "updated-admin@example.com",
        PhoneNumber: "0999999999",
        Mssv: "20210099",
        Class: "20299",
      };

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data).toMatchObject({
        FullName: "Updated Admin",
        Email: "updated-admin@example.com",
        PhoneNumber: "0999999999",
        Mssv: "20210099",
        Class: "20299",
      });
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).put("/api/users/profile").send({
        FullName: "Updated",
        Email: "updated@example.com",
        PhoneNumber: "0000000000",
        Mssv: "",
        Class: "",
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(401);
    });

    it("should return 400 when validation fails", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          FullName: "", // Empty name should fail
          Email: "invalid-email", // Invalid email format
          PhoneNumber: "0123456789",
          Mssv: "20210001",
          Class: "20211",
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(400);
      expect(res.body.error).toBe("Bad Request");
      expect(res.body.message).toBe("Validation failed");
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it("should return 403 when trying to update userId", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          FullName: "Admin User",
          Email: "admin@example.com",
          PhoneNumber: "0111111111",
          Mssv: "20210001",
          Class: "20211",
          userId: 999, // Not allowed
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(403);
      expect(res.body.error).toBe("Forbidden");
    });

    it("should return 403 when trying to update role", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          FullName: "Admin User",
          Email: "admin@example.com",
          PhoneNumber: "0111111111",
          Mssv: "20210001",
          Class: "20211",
          role: "leader", // Not allowed
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(403);
      expect(res.body.error).toBe("Forbidden");
    });

    it("should return 409 when email is already taken", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          FullName: "Admin User",
          Email: "leader@example.com", // Already taken by leader
          PhoneNumber: "0111111111",
          Mssv: "20210001",
          Class: "20211",
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe(409);
      expect(res.body.error).toBe("Conflict");
      expect(res.body.message).toContain("already taken");
    });

    it("should allow updating own email without conflict", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          FullName: "Admin User",
          Email: "admin@example.com", // Same email
          PhoneNumber: "0111111111",
          Mssv: "20210001",
          Class: "20211",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.Email).toBe("admin@example.com");
    });

    it("should return 404 when user does not exist", async () => {
      const fakeToken = jwt.sign(
        { accId: 9999, role: RoleEnum.ADMIN },
        JWT_SECRET,
        { expiresIn: "1h" },
      );

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${fakeToken}`)
        .send({
          FullName: "Updated User",
          Email: "nonexistent@example.com",
          PhoneNumber: "0000000000",
          Mssv: "20210099",
          Class: "20299",
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(404);
      expect(res.body.error).toBe("Not Found");
    });

    it("should reject unknown fields in request body", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          FullName: "Admin User",
          Email: "admin@example.com",
          PhoneNumber: "0111111111",
          Mssv: "20210001",
          Class: "20211",
          unknownField: "value", // Unknown field
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(403);
      expect(res.body.error).toBe("Forbidden");
    });
  });
});
