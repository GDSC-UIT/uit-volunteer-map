import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
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
import bcrypt from 'bcrypt';
import { RoleEnum, HTTP_STATUS, AUTH_ERRORS, SUCCESS_MESSAGES } from '@uit-volunteer-map/shared';

describe('POST /api/auth/login', () => {

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

    await AppDataSource.synchronize(true);
    const roleRepo = AppDataSource.getRepository(Role);
    const accRepo = AppDataSource.getRepository(Account);

    const adminRole = await roleRepo.save({ roleName: RoleEnum.ADMIN });
    const leaderRole = await roleRepo.save({ roleName: RoleEnum.LEADER });

    const adminPass = await bcrypt.hash('admin123', 10);
    const leaderPass = await bcrypt.hash('leader123', 10);

    await accRepo.save({
      username: 'admin',
      password: adminPass,
      roleId: adminRole.roleId
    });

    await accRepo.save({
      username: 'leader',
      password: leaderPass,
      roleId: leaderRole.roleId
    });
  });

  it('should login with valid admin credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toMatchObject({
      username: 'admin',
      role: RoleEnum.ADMIN,
    });
  });

  it('should login with valid leader credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'leader', password: 'leader123' });

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({
      username: 'leader',
      role: RoleEnum.LEADER,
    });
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe(AUTH_ERRORS.INVALID_CREDENTIALS);
  });

  it('should reject empty username', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: '', password: 'admin123' });

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('username: Username is required');
  });

  it('should reject missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin' , password: ''});

    expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Password is required');
  });
});

describe('POST /api/auth/logout', () => {
  it('should logout successfully', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(SUCCESS_MESSAGES.LOGGED_OUT);
  });
});
