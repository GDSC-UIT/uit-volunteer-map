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

    // Create a leader User linked to the leader Account
    const leaderUser = await userRepo.save({
      fullName: 'Team Leader User',
      email: 'teamleader@test.com',
      isDeleted: 0,
      account: leaderAccount,
    });
    testLeaderUserId = leaderUser.userId;

    // Create a campaign for team tests
    const campaign = await campaignRepo.save({
      campaignName: 'Team Test Campaign',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    testCampaignId = campaign.campaignId;

    // Create a team assigned to leader so leader-specific routes work
    const teamRepo = AppDataSource.getRepository(Team);
    const leaderTeam = await teamRepo.save({
      teamName: 'Temp Leader Team',
      isDeleted: 0,
      campaign: { campaignId: testCampaignId },
      leader: { userId: testLeaderUserId },
    });

    // Link user to team
    leaderUser.team = leaderTeam;
    await userRepo.save(leaderUser);
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
    it('should return teams list (public, no token)', async () => {
      const res = await request(app).get('/api/teams');

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should not return soft-deleted teams', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      await teamRepo.save({
        teamName: 'Deleted Team',
        isDeleted: 1,
        campaign: { campaignId: testCampaignId },
      });

      const res = await request(app).get('/api/teams');

      expect(res.status).toBe(HTTP_STATUS.OK);
      const names = res.body.data.map((t: any) => t.teamName);
      expect(names).not.toContain('Deleted Team');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/teams/:id — public
  // ---------------------------------------------------------------------------
  describe('GET /api/teams/:id', () => {
    it('should return a single team', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.save({
        teamName: 'Detail Team',
        description: 'A test team',
        isDeleted: 0,
        campaign: { campaignId: testCampaignId },
      });

      const res = await request(app).get(`/api/teams/${team.teamId}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teamName).toBe('Detail Team');
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
  // POST /api/teams — ADMIN only
  // ---------------------------------------------------------------------------
  describe('POST /api/teams', () => {
    it('should create a team (admin)', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Brand New Team',
          campaignId: testCampaignId,
          leaderId: testLeaderUserId,
          description: 'A brand new team',
        });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teamName).toBe('Brand New Team');
    });

    it('should return 400 when teamName is missing', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          campaignId: testCampaignId,
          leaderId: testLeaderUserId,
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

    it('should return 409 for duplicate team name in same campaign', async () => {
      // First create
      await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Duplicate Team',
          campaignId: testCampaignId,
          leaderId: testLeaderUserId,
        });

      // Second create — same name, same campaign
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamName: 'Duplicate Team',
          campaignId: testCampaignId,
          leaderId: testLeaderUserId,
        });

      expect(res.status).toBe(HTTP_STATUS.CONFLICT);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(TEAM_ERRORS.ALREADY_EXISTS);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({
          teamName: 'No Token Team',
          campaignId: testCampaignId,
          leaderId: testLeaderUserId,
        });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when leader tries to create team', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          teamName: 'Leader Cannot Create',
          campaignId: testCampaignId,
          leaderId: testLeaderUserId,
        });

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // PUT /api/teams/:id — ADMIN + LEADER (own team only)
  // ---------------------------------------------------------------------------
  describe('PUT /api/teams/:id', () => {
    it('should update team (admin)', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.save({
        teamName: 'Update Me',
        isDeleted: 0,
        campaign: { campaignId: testCampaignId },
      });

      const res = await request(app)
        .put(`/api/teams/${team.teamId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teamName: 'Updated Name' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teamName).toBe('Updated Name');
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(app)
        .put('/api/teams/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teamName: 'Does Not Exist' });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .put('/api/teams/invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teamName: 'Invalid' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put('/api/teams/1')
        .send({ teamName: 'No Token' });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/teams/:id — ADMIN only (soft delete)
  // ---------------------------------------------------------------------------
  describe('DELETE /api/teams/:id', () => {
    it('should soft-delete a team (admin)', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.save({
        teamName: 'To Be Deleted',
        isDeleted: 0,
        campaign: { campaignId: testCampaignId },
      });

      const res = await request(app)
        .delete(`/api/teams/${team.teamId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);

      // Verify soft delete
      const deleted = await teamRepo.findOneBy({ teamId: team.teamId });
      expect(deleted).not.toBeNull();
      expect(deleted!.isDeleted).toBe(1);
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(app)
        .delete('/api/teams/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .delete('/api/teams/invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).delete('/api/teams/1');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when leader tries to delete', async () => {
      const teamRepo = AppDataSource.getRepository(Team);
      const team = await teamRepo.save({
        teamName: 'Leader Cannot Delete',
        isDeleted: 0,
        campaign: { campaignId: testCampaignId },
      });

      const res = await request(app)
        .delete(`/api/teams/${team.teamId}`)
        .set('Authorization', `Bearer ${leaderToken}`);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
    });
  });
});
