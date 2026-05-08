import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import app from '../app.js';
import { AppDataSource } from '../db/data-source.js';
import { Account } from '../entities/Account.js';
import { Role } from '../entities/Role.js';
import { User } from '../entities/User.js';
import { Campaign } from '../entities/Campaign.js';
import { Team } from '../entities/Team.js';
import { Post } from '../entities/Post.js';
import { Photo } from '../entities/Photo.js';
import { Attachment } from '../entities/Attachment.js';
import { RoleEnum, HTTP_STATUS, AUTH_ERRORS, SUCCESS_MESSAGES } from '@uit-volunteer-map/shared';

const JWT_SECRET = process.env.JWT_SECRET!;

describe('Auth Middleware', () => {
  let adminToken: string;
  let leaderToken: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.setOptions({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        logging: false,
        entities: [Account, Role, User, Campaign, Team, Post, Photo, Attachment],
        migrations: [],
        subscribers: [],
      }).initialize();
    } else {
      await AppDataSource.synchronize(true);
    }

    const roleRepo = AppDataSource.getRepository(Role);
    const accRepo = AppDataSource.getRepository(Account);

    const adminRole = await roleRepo.save({ roleName: RoleEnum.ADMIN });
    const leaderRole = await roleRepo.save({ roleName: RoleEnum.LEADER });

    const adminPass = await bcrypt.hash('admin123', 10);
    const leaderPass = await bcrypt.hash('leader123', 10);

    const adminAcc = await accRepo.save({
      username: 'admin',
      password: adminPass,
      roleId: adminRole.roleId,
    });

    const leaderAcc = await accRepo.save({
      username: 'leader',
      password: leaderPass,
      roleId: leaderRole.roleId,
    });

    adminToken = jwt.sign(
      { accId: adminAcc.accId, role: RoleEnum.ADMIN },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    leaderToken = jwt.sign(
      { accId: leaderAcc.accId, role: RoleEnum.LEADER },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('authenticateToken', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/admin/admin-only');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.error).toBe(AUTH_ERRORS.TOKEN_REQUIRED);
    });

    it('should return 403 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/admin/admin-only')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.error).toBe(AUTH_ERRORS.TOKEN_INVALID);
    });

    it('should return 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { accId: 1, role: RoleEnum.ADMIN },
        JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/admin/admin-only')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.error).toBe(AUTH_ERRORS.TOKEN_EXPIRED);
    });

    it('should return 401 when Authorization header is malformed', async () => {
      const res = await request(app)
        .get('/api/admin/admin-only')
        .set('Authorization', 'InvalidFormat');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.error).toBe(AUTH_ERRORS.TOKEN_REQUIRED);
    });
  });

  describe('requireRole', () => {
    it('should allow admin to access admin-only route', async () => {
      const res = await request(app)
        .get('/api/admin/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.message).toBe(SUCCESS_MESSAGES.ADMIN_ACCESS_GRANTED);
    });

    it('should deny leader from accessing admin-only route', async () => {
      const res = await request(app)
        .get('/api/admin/admin-only')
        .set('Authorization', `Bearer ${leaderToken}`);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.error).toBe(AUTH_ERRORS.PERMISSION_DENIED);
    });

    it('should allow leader to access leader-only route', async () => {
      const res = await request(app)
        .get('/api/leader/leader-only')
        .set('Authorization', `Bearer ${leaderToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.message).toBe(SUCCESS_MESSAGES.LEADER_ACCESS_GRANTED);
    });

    it('should deny admin from accessing leader-only route', async () => {
      const res = await request(app)
        .get('/api/leader/leader-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.error).toBe(AUTH_ERRORS.PERMISSION_DENIED);
    });
  });
});
