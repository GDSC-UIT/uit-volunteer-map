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
import { RoleEnum, HTTP_STATUS, TEAM_ERRORS } from '@uit-volunteer-map/shared';

const JWT_SECRET = process.env.JWT_SECRET!;

describe('Team CRUD Routes', () => {
  let adminToken: string;
  let leaderToken: string;
  let testCampaignId: number;
  let testLeaderUserId: number;

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
    const userRepo = AppDataSource.getRepository(User);
    const campaignRepo = AppDataSource.getRepository(Campaign);
    const teamRepo = AppDataSource.getRepository(Team);

    const adminRole = await roleRepo.save({ roleName: RoleEnum.ADMIN });
    const leaderRole = await roleRepo.save({ roleName: RoleEnum.LEADER });

    const adminPass = await bcrypt.hash('admin123', 10);
    const leaderPass = await bcrypt.hash('leader123', 10);

    const adminAccount = await accRepo.save({
      username: 'team_admin',
      password: adminPass,
      roleId: adminRole.roleId,
    });

    const leaderAccount = await accRepo.save({
      username: 'team_leader',
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

    // Setup campaign
    const campaign = await campaignRepo.save({
      campaignName: 'Team Test Campaign',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    testCampaignId = campaign.campaignId;

    // Setup a temp team to attach the leader user to
    const tempTeam = await teamRepo.save({
      teamName: 'Temp Leader Team',
      campaign: { campaignId: campaign.campaignId },
      isDeleted: 0,
    });

    // Create a user with LEADER role for testing
    const leaderUser = await userRepo.save({
      fullName: 'Test Leader',
      email: 'leader@gm.uit.edu.vn',
      team: { teamId: tempTeam.teamId },
      account: { accId: leaderAccount.accId },
      isDeleted: 0,
    });
    testLeaderUserId = leaderUser.userId;
  });

  beforeEach(async () => {
    // Clean up teams (except Temp Leader Team) between tests
    const teamRepo = AppDataSource.getRepository(Team);
    const teams = await teamRepo.find({ where: { isDeleted: 0 } });
    for (const team of teams) {
      if (team.teamName !== 'Temp Leader Team') {
        await teamRepo.delete({ teamId: team.teamId });
      }
    }
    // Also hard-delete soft-deleted teams from previous tests
    await teamRepo
      .createQueryBuilder()
      .delete()
      .where('isDeleted = :val', { val: 1 })
      .execute();
  });

  // ---------------------------------------------------------------------------
  // GET /api/teams — public
  // ---------------------------------------------------------------------------
  describe('GET /api/teams', () => {
    it('should return teams without token (public)', async () => {
      const res = await request(app).get('/api/teams');

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return limited fields for unauthenticated requests', async () => {
      const res = await request(app).get('/api/teams');

      expect(res.status).toBe(HTTP_STATUS.OK);
      // Guest view: no "members" field, only teamId, teamName, imageUrl, leaders
      if (res.body.data.length > 0) {
        const team = res.body.data[0];
        expect(team).toHaveProperty('teamId');
        expect(team).toHaveProperty('teamName');
        expect(team).not.toHaveProperty('members');
      }
    });

    it('should return full data for authenticated ADMIN', async () => {
      const res = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/teams/:id — public
  // ---------------------------------------------------------------------------
  describe('GET /api/teams/:id', () => {
    it('should return a team by ID (public)', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.save({
        teamName: 'Get Detail Team',
        campaign: { campaignId: testCampaignId },
        isDeleted: 0,
      });

      const res = await request(app).get(`/api/teams/${team.teamId}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teamName).toBe('Get Detail Team');
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(app).get('/api/teams/99999');

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(TEAM_ERRORS.NOT_FOUND);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app).get('/api/teams/invalid');

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(TEAM_ERRORS.INVALID_ID);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/teams — requires ADMIN
  // ---------------------------------------------------------------------------
  describe('POST /api/teams', () => {
    it('should create a team (admin)', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'New Test Team',
          leaderId: testLeaderUserId,
          campaignId: testCampaignId,
          description: 'Test description',
        });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teamName).toBe('New Test Team');
    });

    it('should return 400 when teamName is missing', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leaderId: testLeaderUserId,
          campaignId: testCampaignId,
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when leaderId is missing', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'No Leader Team',
          campaignId: testCampaignId,
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when campaignId is missing', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'No Campaign Team',
          leaderId: testLeaderUserId,
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when campaignId does not exist', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Bad Campaign Team',
          leaderId: testLeaderUserId,
          campaignId: 99999,
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(TEAM_ERRORS.CAMPAIGN_NOT_FOUND);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({
          teamName: 'Unauthorized Team',
          leaderId: testLeaderUserId,
          campaignId: testCampaignId,
        });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 for LEADER creating team', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          teamName: 'Leader Created Team',
          leaderId: testLeaderUserId,
          campaignId: testCampaignId,
        });

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // PUT /api/teams/:id — requires ADMIN or LEADER (own team only)
  // ---------------------------------------------------------------------------
  describe('PUT /api/teams/:id', () => {
    it('should update a team (admin)', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.save({
        teamName: 'Update Me Team',
        campaign: { campaignId: testCampaignId },
        isDeleted: 0,
      });

      const res = await request(app)
        .put(`/api/teams/${team.teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teamName: 'Updated Team Name', description: 'Updated desc' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teamName).toBe('Updated Team Name');
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(app)
        .put('/api/teams/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teamName: 'Ghost Team' });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(TEAM_ERRORS.NOT_FOUND);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .put('/api/teams/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teamName: 'Bad ID' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(TEAM_ERRORS.INVALID_ID);
    });

    it('should return 401 without token', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.save({
        teamName: 'No Auth Update Team',
        campaign: { campaignId: testCampaignId },
        isDeleted: 0,
      });

      const res = await request(app)
        .put(`/api/teams/${team.teamId}`)
        .send({ teamName: 'Unauthorized Update' });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/teams/:id — requires ADMIN
  // ---------------------------------------------------------------------------
  describe('DELETE /api/teams/:id', () => {
    it('should soft-delete a team (admin)', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.save({
        teamName: 'Delete Me Team',
        campaign: { campaignId: testCampaignId },
        isDeleted: 0,
      });

      const res = await request(app)
        .delete(`/api/teams/${team.teamId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);

      // Verify soft delete: isDeleted = 1
      const deleted = await teamRepo.findOneBy({ teamId: team.teamId });
      expect(deleted!.isDeleted).toBe(1);
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(app)
        .delete('/api/teams/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(TEAM_ERRORS.NOT_FOUND);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .delete('/api/teams/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(TEAM_ERRORS.INVALID_ID);
    });

    it('should return 401 without token', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.save({
        teamName: 'No Auth Delete Team',
        campaign: { campaignId: testCampaignId },
        isDeleted: 0,
      });

      const res = await request(app).delete(`/api/teams/${team.teamId}`);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should return 403 for LEADER deleting team', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.save({
        teamName: 'Leader Cannot Delete',
        campaign: { campaignId: testCampaignId },
        isDeleted: 0,
      });

      const res = await request(app)
        .delete(`/api/teams/${team.teamId}`)
        .set('Authorization', `Bearer ${leaderToken}`);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/teams/:id/attachments — public
  // ---------------------------------------------------------------------------
  describe('GET /api/teams/:id/attachments', () => {
    it('should return attachments for a team (public)', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.save({
        teamName: 'Attachment Team',
        campaign: { campaignId: testCampaignId },
        isDeleted: 0,
      });

      const res = await request(app).get(`/api/teams/${team.teamId}/attachments`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent team attachments', async () => {
      const res = await request(app).get('/api/teams/99999/attachments');

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });
  });
});
