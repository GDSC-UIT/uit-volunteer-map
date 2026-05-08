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
import { RoleEnum, HTTP_STATUS, POST_ERRORS } from '@uit-volunteer-map/shared';

const JWT_SECRET = process.env.JWT_SECRET!;

describe('Post CRUD Routes', () => {
  let adminToken: string;
  let leaderToken: string;
  let testTeamId: number;
  let testAuthorId: number;

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

    // Setup: campaign → team → user (author)
    const campaign = await campaignRepo.save({
      campaignName: 'Post Test Campaign',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });

    const team = await teamRepo.save({
      teamName: 'Post Test Team',
      campaign: { campaignId: campaign.campaignId },
      isDeleted: 0,
    });
    testTeamId = team.teamId;

    const author = await userRepo.save({
      fullName: 'Test Author',
      email: 'author@gm.uit.edu.vn',
      team: { teamId: team.teamId },
      isDeleted: 0,
    });
    testAuthorId = author.userId;
  });

  beforeEach(async () => {
    const photoRepo = AppDataSource.getRepository(Photo);
    const postRepo = AppDataSource.getRepository(Post);
    await photoRepo.clear();
    await postRepo.clear();
  });

  // ---------------------------------------------------------------------------
  // GET /api/posts — public
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
        title: 'Post 1',
        content: 'Content 1',
        team: { teamId: testTeamId },
        author: { userId: testAuthorId },
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await postRepo.save({
        title: 'Post 2',
        content: 'Content 2',
        team: { teamId: testTeamId },
        author: { userId: testAuthorId },
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await request(app).get('/api/posts');

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should not return soft-deleted posts', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      await postRepo.save({
        title: 'Deleted Post',
        content: 'Content',
        team: { teamId: testTeamId },
        author: { userId: testAuthorId },
        isDeleted: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await request(app).get('/api/posts');
      expect(res.status).toBe(HTTP_STATUS.OK);
      const titles = res.body.data.map((p: any) => p.title);
      expect(titles).not.toContain('Deleted Post');
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
        content: 'Detail content',
        team: { teamId: testTeamId },
        author: { userId: testAuthorId },
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
      expect(res.body.error).toBe(POST_ERRORS.NOT_FOUND);
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
          content: 'New content',
          teamId: testTeamId,
          authorId: testAuthorId,
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('New Post');
      expect(res.body.data.postId).toBeDefined();
    });

    it('should create a post with photos', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Post With Photos',
          content: 'Content',
          teamId: testTeamId,
          authorId: testAuthorId,
          photos: [
            { imageUrl: 'https://example.com/photo1.jpg', title: 'Photo 1', isFirstImage: 1 },
          ],
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.photos).toHaveLength(1);
    });

    it('should allow leader to create post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${leaderToken}`)
        .send({
          title: 'Leader Post',
          content: 'Leader content',
          teamId: testTeamId,
          authorId: testAuthorId,
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Content without title',
          teamId: testTeamId,
          authorId: testAuthorId,
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when content is missing', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Title without content',
          teamId: testTeamId,
          authorId: testAuthorId,
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when teamId is missing', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'No Team',
          content: 'Content',
          authorId: testAuthorId,
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          title: 'Unauthorized',
          content: 'Content',
          teamId: testTeamId,
          authorId: testAuthorId,
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
        content: 'Original content',
        team: { teamId: testTeamId },
        author: { userId: testAuthorId },
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .put(`/api/posts/${post.postId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title', content: 'Updated content' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('should allow partial update (only title)', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'Partial Original',
        content: 'Keep this content',
        team: { teamId: testTeamId },
        author: { userId: testAuthorId },
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .put(`/api/posts/${post.postId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Partial Update' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Partial Update');
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .put('/api/posts/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated' });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe(POST_ERRORS.NOT_FOUND);
    });

    it('should return 401 without token', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'Auth Test',
        content: 'Content',
        team: { teamId: testTeamId },
        author: { userId: testAuthorId },
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .put(`/api/posts/${post.postId}`)
        .send({ title: 'No Auth' });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/posts/:id — requires ADMIN or LEADER (soft delete)
  // ---------------------------------------------------------------------------
  describe('DELETE /api/posts/:id', () => {
    it('should soft-delete a post', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'To Delete',
        content: 'Content',
        team: { teamId: testTeamId },
        author: { userId: testAuthorId },
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
      expect(res.body.error).toBe(POST_ERRORS.NOT_FOUND);
    });

    it('should return 401 without token', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'Delete No Auth',
        content: 'Content',
        team: { teamId: testTeamId },
        author: { userId: testAuthorId },
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await request(app).delete(`/api/posts/${post.postId}`);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/posts/:id/photos — requires ADMIN or LEADER
  // ---------------------------------------------------------------------------
  describe('POST /api/posts/:id/photos', () => {
    it('should add a photo to a post', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'Photo Post',
        content: 'Content',
        team: { teamId: testTeamId },
        author: { userId: testAuthorId },
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post(`/api/posts/${post.postId}/photos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imageUrl: 'https://example.com/new-photo.jpg', title: 'New Photo' });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.imageUrl).toBe('https://example.com/new-photo.jpg');
    });

    it('should return 400 when imageUrl is missing', async () => {
      const postRepo = AppDataSource.getRepository(Post);
      const post = await postRepo.save({
        title: 'Photo Validate Post',
        content: 'Content',
        team: { teamId: testTeamId },
        author: { userId: testAuthorId },
        isDeleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        .send({ imageUrl: 'https://example.com/photo.jpg' });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });
  });
});
