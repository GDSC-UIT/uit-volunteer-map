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
import { RoleEnum, HTTP_STATUS } from '@uit-volunteer-map/shared';

const JWT_SECRET = process.env.JWT_SECRET!;

describe('Post CRUD Routes', () => {
  let adminToken: string;
  let leaderToken: string;
  let testTeamId: number;
  let testAdminUserId: number;

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
      username: 'post_admin',
      password: adminPass,
      roleId: adminRole.roleId,
    });

    const leaderAccount = await accRepo.save({
      username: 'post_leader',
      password: leaderPass,
      roleId: leaderRole.roleId,
    });

    const adminUser = await userRepo.save({
      fullName: 'Post Admin User',
      email: 'postadmin@test.com',
      isDeleted: 0,
      account: adminAccount,
    });
    testAdminUserId = adminUser.userId;

    await userRepo.save({
      fullName: 'Post Leader User',
      email: 'postleader@test.com',
      isDeleted: 0,
      account: leaderAccount,
    });

    const campaign = await campaignRepo.save({
      campaignName: 'Post Test Campaign',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });

    const team = await teamRepo.save({
      teamName: 'Post Test Team',
      isDeleted: 0,
      campaign: { campaignId: campaign.campaignId },
    });
    testTeamId = team.teamId;

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
    const photoRepo = AppDataSource.getRepository(Photo);
    const postRepo = AppDataSource.getRepository(Post);
    await photoRepo.clear();
    await postRepo.clear();
  });

  // ---------------------------------------------------------------------------
  // GET /api/posts — public (no auth required)
  // ---------------------------------------------------------------------------
  describe('GET /api/posts', () => {
    it('should return empty array when no posts exist (public, no token)', async () => {
      const res = await request(app).get('/api/posts');

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should return list of posts (public)', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      await postRepo.save({
        title: 'Test Post',
        content: 'Test Content',
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        team: { teamId: testTeamId },
        author: { userId: testAdminUserId },
      });

      const res = await request(app).get('/api/posts');

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should not return soft-deleted posts', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      await postRepo.save({
        title: 'Deleted Post',
        content: 'Deleted Content',
        isDeleted: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        team: { teamId: testTeamId },
        author: { userId: testAdminUserId },
      });

      const res = await request(app).get('/api/posts');

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/posts/:id — public
  // ---------------------------------------------------------------------------
  describe('GET /api/posts/:id', () => {
    it('should return a single post (public)', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'Detail Post',
        content: 'Detail Content',
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        team: { teamId: testTeamId },
        author: { userId: testAdminUserId },
      });

      const res = await request(app).get(`/api/posts/${post.postId}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Detail Post');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app).get('/api/posts/99999');

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/posts — requires ADMIN or LEADER
  // ---------------------------------------------------------------------------
  describe('POST /api/posts', () => {
    it('should create a post (admin)', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Post',
          content: 'New Content',
          teamId: testTeamId,
          authorId: testAdminUserId,
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('New Post');
    });

    it('should create a post with photos', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Post With Photos',
          content: 'Content with photos',
          teamId: testTeamId,
          authorId: testAdminUserId,
          photos: [
            { imageUrl: 'https://example.com/photo1.jpg', title: 'Photo 1' },
            { imageUrl: 'https://example.com/photo2.jpg' },
          ],
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.photos).toHaveLength(2);
    });

    it('should allow leader to create post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          title: 'Leader Post',
          content: 'Leader Content',
          teamId: testTeamId,
          authorId: testAdminUserId,
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Content',
          teamId: testTeamId,
          authorId: testAdminUserId,
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when content is missing', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Title Only',
          teamId: testTeamId,
          authorId: testAdminUserId,
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when teamId is missing', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Title',
          content: 'Content',
          authorId: testAdminUserId,
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          title: 'No Token Post',
          content: 'Content',
          teamId: testTeamId,
          authorId: testAdminUserId,
        });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // PUT /api/posts/:id — requires ADMIN or LEADER
  // ---------------------------------------------------------------------------
  describe('PUT /api/posts/:id', () => {
    it('should update post title and content', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'Original Title',
        content: 'Original Content',
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        team: { teamId: testTeamId },
        author: { userId: testAdminUserId },
      });

      const res = await request(app)
        .put(`/api/posts/${post.postId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
          content: 'Updated Content',
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.content).toBe('Updated Content');
    });

    it('should allow partial update (only title)', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'Original Title',
        content: 'Original Content',
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        team: { teamId: testTeamId },
        author: { userId: testAdminUserId },
      });

      const res = await request(app)
        .put(`/api/posts/${post.postId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Only Title Updated' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.title).toBe('Only Title Updated');
      expect(res.body.data.content).toBe('Original Content');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .put('/api/posts/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Does Not Exist' });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .put('/api/posts/1')
        .send({ title: 'No Token' });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/posts/:id — requires ADMIN or LEADER (soft delete)
  // ---------------------------------------------------------------------------
  describe('DELETE /api/posts/:id', () => {
    it('should soft-delete a post', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'To Be Deleted',
        content: 'Delete Me',
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        team: { teamId: testTeamId },
        author: { userId: testAdminUserId },
      });

      const res = await request(app)
        .delete(`/api/posts/${post.postId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);

      // Verify soft delete: record still exists but isDeleted = 1
      const deleted = await postRepo.findOneBy({ postId: post.postId });
      expect(deleted).not.toBeNull();
      expect(deleted!.isDeleted).toBe(1);
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .delete('/api/posts/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'No Token Delete',
        content: 'Content',
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        team: { teamId: testTeamId },
        author: { userId: testAdminUserId },
      });

      const res = await request(app).delete(`/api/posts/${post.postId}`);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/posts/:id/photos — add photo to a post
  // ---------------------------------------------------------------------------
  describe('POST /api/posts/:id/photos', () => {
    it('should add a photo to a post', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'Post for Photo',
        content: 'Content',
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        team: { teamId: testTeamId },
        author: { userId: testAdminUserId },
      });

      const res = await request(app)
        .post(`/api/posts/${post.postId}/photos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          imageUrl: 'https://example.com/photo.jpg',
          title: 'Test Photo',
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.imageUrl).toBe('https://example.com/photo.jpg');
    });

    it('should return 400 when imageUrl is missing', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'Post for Bad Photo',
        content: 'Content',
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        team: { teamId: testTeamId },
        author: { userId: testAdminUserId },
      });

      const res = await request(app)
        .post(`/api/posts/${post.postId}/photos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'No URL' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when post does not exist', async () => {
      const res = await request(app)
        .post('/api/posts/99999/photos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          imageUrl: 'https://example.com/photo.jpg',
        });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });
  });
});
