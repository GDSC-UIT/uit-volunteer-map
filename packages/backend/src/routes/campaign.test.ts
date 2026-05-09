import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
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
import { RoleEnum, CAMPAIGN_ERRORS, HTTP_STATUS } from '@uit-volunteer-map/shared';

const JWT_SECRET = process.env.JWT_SECRET!;

describe('Campaign CRUD Routes', () => {
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

    const adminAccount = await accRepo.save({
      username: 'admin',
      password: adminPass,
      roleId: adminRole.roleId,
    });

    const leaderAccount = await accRepo.save({
      username: 'leader',
      password: leaderPass,
      roleId: leaderRole.roleId,
    });

    adminToken = jwt.sign(
      { accId: adminAccount.accId, role: RoleEnum.ADMIN },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    leaderToken = jwt.sign(
      { accId: leaderAccount.accId, role: RoleEnum.LEADER },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    const campaignRepo = AppDataSource.getRepository(Campaign);
    await campaignRepo.clear();
  });

  describe('GET /api/campaigns', () => {
    it('should return empty array when no campaigns exist', async () => {
      const res = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should return all campaigns', async () => {
      const campaignRepo = AppDataSource.getRepository(Campaign);
      await campaignRepo.save({
        campaignName: 'Test Campaign 1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        description: 'Test description',
      });
      await campaignRepo.save({
        campaignName: 'Test Campaign 2',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      });

      const res = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/campaigns');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });

    it('should allow leader to access campaigns', async () => {
      const res = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${leaderToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/campaigns/:id', () => {
    it('should return a single campaign', async () => {
      const campaignRepo = AppDataSource.getRepository(Campaign);
      const campaign = await campaignRepo.save({
        campaignName: 'Test Campaign',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        description: 'Test description',
      });

      const res = await request(app)
        .get(`/api/campaigns/${campaign.campaignId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.campaignName).toBe('Test Campaign');
    });

    it('should return 404 for non-existent campaign', async () => {
      const res = await request(app)
        .get('/api/campaigns/9999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .get('/api/campaigns/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(CAMPAIGN_ERRORS.INVALID_ID);
    });
  });

  describe('POST /api/campaigns', () => {
    it('should create a new campaign', async () => {
      const campaignData = {
        campaignName: 'New Campaign',
        startDate: '2024-03-01',
        endDate: '2024-03-31',
        description: 'New campaign description',
      };

      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(campaignData);

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.campaignName).toBe('New Campaign');
      expect(res.body.data.campaignId).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ campaignName: 'Test' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 for duplicate campaign name', async () => {
      const campaignRepo = AppDataSource.getRepository(Campaign);
      await campaignRepo.save({
        campaignName: 'Existing Campaign',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          campaignName: 'Existing Campaign',
          startDate: '2024-02-01',
          endDate: '2024-02-28',
        });

      expect(res.status).toBe(HTTP_STATUS.CONFLICT);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(CAMPAIGN_ERRORS.ALREADY_EXISTS);
    });

    it('should allow leader to create campaign', async () => {
      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          campaignName: 'Leader Campaign',
          startDate: '2024-04-01',
          endDate: '2024-04-30',
        });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/campaigns/:id', () => {
    it('should update an existing campaign', async () => {
      const campaignRepo = AppDataSource.getRepository(Campaign);
      const campaign = await campaignRepo.save({
        campaignName: 'Original Name',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      const res = await request(app)
        .put(`/api/campaigns/${campaign.campaignId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          campaignName: 'Updated Name',
          startDate: '2024-01-01',
          endDate: '2024-02-15',
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.campaignName).toBe('Updated Name');
    });

    it('should return 404 for non-existent campaign', async () => {
      const res = await request(app)
        .put('/api/campaigns/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          campaignName: 'Updated Name',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .put('/api/campaigns/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ campaignName: 'Test' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should allow partial update', async () => {
      const campaignRepo = AppDataSource.getRepository(Campaign);
      const campaign = await campaignRepo.save({
        campaignName: 'Original Name',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        description: 'Original description',
      });

      const res = await request(app)
        .put(`/api/campaigns/${campaign.campaignId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated description' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated description');
      expect(res.body.data.campaignName).toBe('Original Name');
    });
  });

  describe('DELETE /api/campaigns/:id', () => {
    it('should delete an existing campaign', async () => {
      const campaignRepo = AppDataSource.getRepository(Campaign);
      const campaign = await campaignRepo.save({
        campaignName: 'To Be Deleted',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      const res = await request(app)
        .delete(`/api/campaigns/${campaign.campaignId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);

      const deleted = await campaignRepo.findOneBy({ campaignId: campaign.campaignId });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent campaign', async () => {
      const res = await request(app)
        .delete('/api/campaigns/9999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .delete('/api/campaigns/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject requests without token', async () => {
      const res = await request(app).get('/api/campaigns');
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/campaigns')
        .set('Authorization', 'Bearer invalid-token');

      expect([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN]).toContain(res.status);
    });

    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { accId: 1, role: RoleEnum.ADMIN },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });
  });
});
