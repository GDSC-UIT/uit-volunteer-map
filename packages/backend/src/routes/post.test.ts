import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { AppDataSource as db } from "../db/data-source.js";
import { Account } from "../entities/Account.js";
import { Role } from "../entities/Role.js";
import { User } from "../entities/User.js";
import { Campaign } from "../entities/Campaign.js";
import { Team } from "../entities/Team.js";
import { Post } from "../entities/Post.js";
import { Photo } from "../entities/Photo.js";
import { Attachment } from "../entities/Attachment.js";
import { RoleEnum } from "@uit-volunteer-map/shared";

const token = (accId: number, role: RoleEnum) => jwt.sign({ accId, role }, process.env.JWT_SECRET!, { expiresIn: '1h' });
const leaderToken = token(101, RoleEnum.LEADER);
const otherToken = token(202, RoleEnum.LEADER);
const adminToken = token(303, RoleEnum.ADMIN);
const body = { title: 'New activity', content: 'Vietnamese volunteer activity', teamId: 10 };
const photo = { imageUrl: 'https://example.test/new-photo.png', isFirstImage: 0 };
const mutations = ['create', 'update', 'delete', 'photo'] as const;
type Mutation = typeof mutations[number];
function mutate(kind: Mutation, auth?: string, postId = 1001, payload?: object) {
  const req = kind === 'create' ? request(app).post('/api/posts')
    : kind === 'update' ? request(app).put(`/api/posts/${postId}`)
      : kind === 'delete' ? request(app).delete(`/api/posts/${postId}`)
        : request(app).post(`/api/posts/${postId}/photos`);
  if (auth) req.set('Authorization', `Bearer ${auth}`);
  return req.send(payload ?? (kind === 'create' ? body : kind === 'update' ? { title: 'Changed' } : kind === 'photo' ? photo : {}));
}
async function storedWrites() {
  return { posts: await db.query('SELECT * FROM Post ORDER BY PostId'), photos: await db.query('SELECT * FROM Photo ORDER BY PhotoId') };
}
async function assertDenied(kind: Mutation, auth: string | undefined, status: number, postId = 1001, payload?: object) {
  const before = await storedWrites();
  const res = await mutate(kind, auth, postId, payload);
  expect(res.status).toBe(status); expect(res.body.success).toBe(false);
  expect(await storedWrites()).toEqual(before);
}

describe('Post actor identity and team authorization', () => {
  beforeAll(async () => {
    // Never initialize or synchronize the configured developer database.
    expect(db.isInitialized).toBe(false);
    db.setOptions({ type: 'sqlite', database: ':memory:', synchronize: false, logging: false,
      entities: [Account, Role, User, Campaign, Team, Post, Photo, Attachment], migrations: [], subscribers: [] });
    await db.initialize();
  });
  afterAll(async () => { if (db.isInitialized) await db.destroy(); });
  beforeEach(async () => {
    await db.synchronize(true);
    await db.getRepository(Role).save([{ roleId: 1, roleName: RoleEnum.LEADER }, { roleId: 2, roleName: RoleEnum.ADMIN }]);
    await db.getRepository(Account).save([
      { accId: 101, username: 'leader-a', password: 'unused', roleId: 1 },
      { accId: 202, username: 'leader-b', password: 'unused', roleId: 1 },
      { accId: 303, username: 'admin', password: 'unused', roleId: 2 },
      { accId: 404, username: 'no-profile', password: 'unused', roleId: 1 },
    ]);
    await db.getRepository(Campaign).save([
      { campaignId: 1, campaignName: 'Campaign A', startDate: '2026-01-01', endDate: '2026-02-01' },
      { campaignId: 2, campaignName: 'Campaign B', startDate: '2026-03-01', endDate: '2026-04-01' },
    ]);
    await db.getRepository(Team).save([
      { teamId: 10, teamName: 'Team A', campaign: { campaignId: 1 } },
      { teamId: 20, teamName: 'Team B', campaign: { campaignId: 2 } },
    ]);
    await db.getRepository(User).save([
      { userId: 11, fullName: 'Leader A', email: 'a@example.test', account: { accId: 101 }, team: { teamId: 10 } },
      { userId: 22, fullName: 'Leader B', email: 'b@example.test', account: { accId: 202 }, team: { teamId: 20 } },
      { userId: 33, fullName: 'Admin', email: 'admin@example.test', account: { accId: 303 } },
    ]);
    // Match both relations; authorization follows User.team as in TeamService.
    await db.getRepository(Team).update(10, { leader: { userId: 11 } });
    await db.getRepository(Team).update(20, { leader: { userId: 22 } });
    await db.getRepository(Post).save([
      { postId: 1001, title: 'Post A', content: 'A', team: { teamId: 10 }, author: { userId: 11 }, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { postId: 2001, title: 'Post B', content: 'B', team: { teamId: 20 }, author: { userId: 22 }, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ]);
    await db.getRepository(Photo).save({ imageUrl: 'https://example.test/existing.png', uploadedAt: '2026-01-01', post: { postId: 2001 } });
  });

  it('derives author UserId from AccountId and creates own-team photos', async () => {
    const res = await mutate('create', leaderToken, 1001, { ...body, photos: [photo] });
    expect(res.status).toBe(200); expect(res.body.data.author.userId).toBe(11);
    expect(res.body.data.author.userId).not.toBe(101); expect(res.body.data.photos).toHaveLength(1);
    const post = await db.getRepository(Post).findOneOrFail({ where: { postId: res.body.data.postId }, relations: ['author','team','photos'] });
    expect(post.author.userId).toBe(11); expect(post.team.teamId).toBe(10); expect(post.photos[0].imageUrl).toBe(photo.imageUrl);
  });
  it.each([10, 20])('allows Admin creation in active team %i using the Admin profile as author', async teamId => {
    const res = await mutate('create', adminToken, 1001, { ...body, teamId });
    expect(res.status).toBe(200); expect(res.body.data.author.userId).toBe(33); expect(res.body.data.team.teamId).toBe(teamId);
  });
  it.each(['update', 'delete', 'photo'] as const)('allows Leader own-team %s', async kind => {
    const res = await mutate(kind, leaderToken); expect(res.status).toBe(200);
    const post = await db.getRepository(Post).findOneOrFail({ where: { postId: 1001 }, relations: ['author','team','photos'] });
    expect(post.author.userId).toBe(11); expect(post.team.teamId).toBe(10);
    if (kind === 'update') expect(post.title).toBe('Changed');
    if (kind === 'delete') expect(post.isDeleted).toBe(1);
    if (kind === 'photo') expect(post.photos[0].imageUrl).toBe(photo.imageUrl);
  });
  it.each(['update', 'delete', 'photo'] as const)('denies Leader cross-team %s without changing Post/Photo rows', async kind => assertDenied(kind, leaderToken, 403, 2001));
  it('denies cross-team creation and reciprocal access', async () => {
    await assertDenied('create', leaderToken, 403, 1001, { ...body, teamId: 20, photos: [photo] });
    await assertDenied('update', otherToken, 403);
  });
  it.each(['update', 'delete', 'photo'] as const)('allows Admin %s across teams', async kind => {
    for (const id of [1001, 2001]) {
      const res = await mutate(kind, adminToken, id, kind === 'photo' ? { ...photo, imageUrl: `https://example.test/admin-${id}.png` } : undefined);
      expect(res.status).toBe(200);
      const post = await db.getRepository(Post).findOneOrFail({ where: { postId: id }, relations: ['author','team','photos'] });
      expect(post.team.teamId).toBe(id === 1001 ? 10 : 20); expect(post.author.userId).toBe(id === 1001 ? 11 : 22);
      if (kind === 'delete') expect(post.isDeleted).toBe(1);
      if (kind === 'update') expect(post.title).toBe('Changed');
      if (kind === 'photo') expect(post.photos.some(p => p.imageUrl === `https://example.test/admin-${id}.png`)).toBe(true);
    }
  });
  it.each(mutations)('denies unauthenticated %s', async kind => assertDenied(kind, undefined, 401));
  it.each([11,22])('rejects caller-supplied authorId %i at creation', async authorId => assertDenied('create', leaderToken, 400, 1001, { ...body, authorId }));
  it.each([{ authorId: 22 }, { teamId: 20 }, { teamId: 10 }, { isDeleted: 1 }, { team: { teamId: 20 } }])('rejects ownership/extra edit fields %j for both roles', async payload => {
    await assertDenied('update', leaderToken, 400, 1001, payload);
    await assertDenied('update', adminToken, 400, 1001, payload);
  });
  it.each(mutations)('denies %s when the assigned User profile is inactive', async kind => {
    await db.getRepository(User).update(11, { isDeleted: 1 }); await assertDenied(kind, leaderToken, 403);
  });
  it.each(mutations)('denies %s for an unassigned Leader', async kind => {
    await db.query('UPDATE User SET TeamId = NULL WHERE UserId = 11');
    await assertDenied(kind, leaderToken, 403);
  });
  it.each(mutations)('denies %s with no User profile', async kind => assertDenied(kind, token(404, RoleEnum.LEADER), 403));
  it.each(mutations)('denies %s on a soft-deleted team, including Admin', async kind => {
    await db.getRepository(Team).update(10, { isDeleted: 1 });
    await assertDenied(kind, leaderToken, 404); await assertDenied(kind, adminToken, 404);
  });
  it.each(['update', 'delete', 'photo'] as const)('denies %s on a deleted post', async kind => {
    await db.getRepository(Post).update(1001, { isDeleted: 1 }); await assertDenied(kind, leaderToken, 404); await assertDenied(kind, adminToken, 404);
  });
  it.each(mutations)('rejects %s with a detached campaign parent', async kind => {
    await db.query('UPDATE Team SET CampaignId = NULL WHERE TeamId = 10');
    await assertDenied(kind, leaderToken, 404); await assertDenied(kind, adminToken, 404);
  });
  it.each(['update', 'delete', 'photo'] as const)('rejects %s with a detached team parent', async kind => {
    await db.query('UPDATE Post SET TeamId = NULL WHERE PostId = 1001'); await assertDenied(kind, adminToken, 404);
  });
  it.each(['update', 'delete', 'photo'] as const)('rejects invalid/missing post IDs on %s', async kind => {
    await assertDenied(kind, leaderToken, 404, 999999);
    for (const id of [0, -1, 1.5, NaN]) await assertDenied(kind, leaderToken, 400, id);
  });
  it('rejects nonexistent/invalid team IDs before creating rows', async () => {
    await assertDenied('create', adminToken, 404, 1001, { ...body, teamId: 999999 });
    for (const teamId of [0, -1, 1.5]) await assertDenied('create', leaderToken, 400, 1001, { ...body, teamId });
  });
  it('does not trust an Admin role claimed by a Leader token', async () => assertDenied('update', token(101, RoleEnum.ADMIN), 403, 2001));
  it('re-evaluates current assignment instead of previous authorship', async () => {
    await db.getRepository(User).update(11, { team: { teamId: 20 } });
    await assertDenied('update', leaderToken, 403, 1001);
    expect((await mutate('update', leaderToken, 2001)).status).toBe(200);
  });
  it('requires an Admin author profile to create but permits moderation without it', async () => {
    await db.getRepository(User).update(33, { isDeleted: 1 });
    await assertDenied('create', adminToken, 403);
    expect((await mutate('update', adminToken, 2001)).status).toBe(200);
  });
  it('rejects foreign relation fields in photo input', async () => assertDenied('photo', leaderToken, 400, 1001, { ...photo, postId: 2001 }));
  it('keeps public reads anonymous', async () => {
    expect((await request(app).get('/api/posts')).status).toBe(200);
    expect((await request(app).get('/api/posts/1001')).status).toBe(200);
  });

  it.each([{latitude:0,longitude:0},{latitude:90,longitude:180},{latitude:-90,longitude:-180},{latitude:10.8231,longitude:106.6296}])('persists a complete WGS84 coordinate pair %j', async coordinates => {
    const res = await mutate('create', leaderToken, 1001, { ...body, coordinates });
    expect(res.status).toBe(200);
    const detail = await request(app).get(`/api/posts/${res.body.data.postId}`);
    expect(detail.body.data.coordinates).toEqual(coordinates);
    const list = await request(app).get('/api/posts?campaignId=1');
    expect(list.body.data.find((post: {postId:number}) => post.postId === res.body.data.postId).coordinates).toEqual(coordinates);
  });
  it('keeps legacy posts unlocated, retains on unrelated edits, replaces and clears the pair', async () => {
    expect((await request(app).get('/api/posts/1001')).body.data.coordinates).toBeNull();
    const coordinates = {latitude:10.8231,longitude:106.6296};
    expect((await mutate('update',leaderToken,1001,{coordinates})).status).toBe(200);
    await mutate('update',leaderToken,1001,{title:'Coordinate retained'});
    expect((await request(app).get('/api/posts/1001')).body.data.coordinates).toEqual(coordinates);
    await mutate('update',leaderToken,1001,{coordinates:null});
    expect((await request(app).get('/api/posts/1001')).body.data.coordinates).toBeNull();
    expect((await mutate('create',leaderToken,1001,body)).body.data.latitude).toBeNull();
  });
  it.each([{}, {latitude:10}, {longitude:106}, {latitude:null,longitude:null}, {latitude:'10',longitude:106}, {latitude:91,longitude:106}, {latitude:-91,longitude:106}, {latitude:10,longitude:181}, {latitude:10,longitude:-181}, {latitude:10,longitude:106,extra:true}, [10,106]])('rejects invalid coordinate input without writes %j', async coordinates => {
    await assertDenied('create',leaderToken,400,1001,{...body,coordinates});
    await assertDenied('update',leaderToken,400,1001,{coordinates});
  });
  it('applies existing team authorization to coordinate edits', async () => {
    const coordinates = {latitude:12.2,longitude:109.1};
    await assertDenied('update',leaderToken,403,2001,{coordinates});
    expect((await mutate('update',adminToken,2001,{coordinates})).status).toBe(200);
    expect((await request(app).get('/api/posts/2001')).body.data.coordinates).toEqual(coordinates);
  });
  it('enforces paired and bounded coordinates at the database layer', async () => {
    await expect(db.query('UPDATE Post SET Latitude = 10 WHERE PostId = 1001')).rejects.toThrow();
    await expect(db.query('UPDATE Post SET Latitude = 91, Longitude = 106 WHERE PostId = 1001')).rejects.toThrow();
    expect((await request(app).get('/api/posts/1001')).body.data.coordinates).toBeNull();
  });
});
