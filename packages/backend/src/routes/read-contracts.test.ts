import { beforeAll, beforeEach, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { AppDataSource as db } from '../db/data-source.js';
import { Account } from '../entities/Account.js';
import { Role } from '../entities/Role.js';
import { User } from '../entities/User.js';
import { Campaign } from '../entities/Campaign.js';
import { Team } from '../entities/Team.js';
import { Post } from '../entities/Post.js';
import { Photo } from '../entities/Photo.js';
import { Attachment } from '../entities/Attachment.js';
import { RoleEnum, type CampaignReadDto, type TeamReadDto, type PostDetailDto, API_ROUTES } from '@uit-volunteer-map/shared';

const token = (accId: number, role = RoleEnum.LEADER) => jwt.sign({accId, role}, process.env.JWT_SECRET!, {expiresIn:'1h'});
const photoDto = (photoId: number, first = false) => ({photoId,title:null,imageUrl:`https://example.test/photo-${photoId}.png`,uploadedAt:'2026-01-01',isFirstImage:first});
const teamA = {
  teamId:10,campaignId:1,teamName:'Team A',description:null,imageUrl:null,
  leaders:[{userId:11,fullName:'Leader A',avatarUrl:null,role:'leader'}],
  attachments:[{attachmentId:2,imageUrl:'https://example.test/attachment-2.png',uploadedAt:'2026-01-01',position:1},
    {attachmentId:1,imageUrl:'https://example.test/attachment-1.png',uploadedAt:'2026-01-01',position:2}],
} satisfies TeamReadDto;
const campaignA = {campaignId:1,campaignName:'Campaign A',startDate:'2026-01-01',endDate:'2026-02-01',description:null,attachments:[]} satisfies CampaignReadDto;
const detailA = {postId:1001,title:'Post A',content:'A',createdAt:'2026-01-01',updatedAt:'2026-01-01',
  coordinates:null,
  team:{teamId:10,teamName:'Team A',campaignId:1},author:{userId:11,fullName:'Leader A',avatarUrl:null},
  thumbnail:photoDto(10,true),photos:[photoDto(10,true),photoDto(30,true),photoDto(40)],
} satisfies PostDetailDto;

async function get(path: string) { return request(app).get('/api'+path); }
function expectSafe(data: unknown) {
  const text=JSON.stringify(data);
  for(const key of ['password','email','account','roleId','accId','isDeleted','leaderId']) expect(text).not.toContain(`"${key}":`);
}
describe('Canonical scoped read contracts',()=>{
  beforeAll(async()=>{
    expect(db.isInitialized).toBe(false);
    db.setOptions({type:'sqlite',database:':memory:',synchronize:false,logging:false,entities:[Account,Role,User,Campaign,Team,Post,Photo,Attachment],migrations:[],subscribers:[]});
    await db.initialize();
  });
  afterAll(async()=>{if(db.isInitialized)await db.destroy();});
  beforeEach(async()=>{
    await db.synchronize(true);
    await db.getRepository(Role).save([{roleId:1,roleName:RoleEnum.LEADER},{roleId:2,roleName:RoleEnum.ADMIN}]);
    await db.getRepository(Account).save([
      {accId:101,username:'a',password:'must-never-appear',roleId:1},
      {accId:202,username:'b',password:'must-never-appear',roleId:1},
      {accId:303,username:'admin',password:'must-never-appear',roleId:2},
      {accId:404,username:'unassigned',password:'must-never-appear',roleId:1},
    ]);
    await db.getRepository(Campaign).save([
      {campaignId:1,campaignName:'Campaign A',startDate:'2026-01-01',endDate:'2026-02-01'},
      {campaignId:2,campaignName:'Campaign B',startDate:'2026-03-01',endDate:'2026-04-01'},
      {campaignId:3,campaignName:'Empty campaign',startDate:'2026-05-01',endDate:'2026-06-01'},
    ]);
    await db.getRepository(Team).save([{teamId:10,teamName:'Team A',campaign:{campaignId:1}},{teamId:20,teamName:'Team B',campaign:{campaignId:2}}]);
    await db.getRepository(User).save([
      {userId:11,fullName:'Leader A',email:'private-a@example.test',account:{accId:101},team:{teamId:10}},
      {userId:22,fullName:'Leader B',email:'private-b@example.test',account:{accId:202},team:{teamId:20}},
    ]);
    await db.getRepository(Team).update(10,{leader:{userId:11}});
    await db.getRepository(Team).update(20,{leader:{userId:22}});
    await db.getRepository(Post).save([
      {postId:1001,title:'Post A',content:'A',createdAt:'2026-01-01',updatedAt:'2026-01-01',team:{teamId:10},author:{userId:11}},
      {postId:1002,title:'No media',content:'Empty',createdAt:'2026-01-01',updatedAt:'2026-01-01',team:{teamId:10}},
      {postId:2001,title:'Post B',content:'B',createdAt:'2026-01-01',updatedAt:'2026-01-01',team:{teamId:20},author:{userId:22}},
    ]);
    for(const [photoId,first,deleted,postId] of [[50,1,1,1001],[40,0,0,1001],[30,1,0,1001],[10,1,0,1001],[90,0,0,2001]]) {
      await db.getRepository(Photo).save({photoId,imageUrl:`https://example.test/photo-${photoId}.png`,uploadedAt:'2026-01-01',isFirstImage:first,isDeleted:deleted,post:{postId}});
    }
    await db.getRepository(Attachment).save([
      {attachmentId:1,imageUrl:'https://example.test/attachment-1.png',uploadedAt:'2026-01-01',position:2,team:{teamId:10}},
      {attachmentId:2,imageUrl:'https://example.test/attachment-2.png',uploadedAt:'2026-01-01',position:1,team:{teamId:10}},
    ]);
  });
  it('returns explicit campaign list/detail DTOs and ordered attachments',async()=>{
    expect((await get('/campaigns/1')).body.data).toEqual(campaignA);
    const res=await get('/campaigns');expect(res.status).toBe(200);expect(res.body.data.map((c:CampaignReadDto)=>c.campaignId)).toEqual([1,2,3]);expect(res.body.data[0]).toEqual(campaignA);expectSafe(res.body.data);
    await db.getRepository(Attachment).save({imageUrl:'https://example.test/campaign.png',uploadedAt:'2026-01-01',campaign:{campaignId:1}});
    const detail=(await get('/campaigns/1')).body.data;expect(detail.attachments[0].position).toBeNull();expect(detail.attachments).toHaveLength(1);
  });
  it('filters teams by campaign and uses the same detail/attachment DTO',async()=>{
    const res=await get('/teams?campaignId=1');expect(res.status).toBe(200);expect(res.body.data).toEqual([teamA]);expectSafe(res.body.data);
    expect((await get('/teams/10')).body.data).toEqual(teamA);
    expect((await get('/teams/10/attachments')).body.data).toEqual(teamA);
    expect((await get('/teams?campaignId=2')).body.data.map((t:TeamReadDto)=>t.teamId)).toEqual([20]);
  });
  it('filters posts by team/campaign with intersecting filters',async()=>{
    for(const path of ['/posts?campaignId=1','/posts?teamId=10','/posts?campaignId=1&teamId=10']) {
      const res=await get(path);expect(res.status).toBe(200);expect(res.body.data.map((p:PostDetailDto)=>p.postId)).toEqual([1001,1002]);expectSafe(res.body.data);
    }
    expect((await get('/posts?campaignId=2')).body.data.map((p:PostDetailDto)=>p.postId)).toEqual([2001]);
    expect((await get('/posts?campaignId=1&teamId=20')).body.data).toEqual([]);
  });
  it('returns complete live photos in stable order with a matching list thumbnail',async()=>{
    const detail=await get('/posts/1001');expect(detail.status).toBe(200);expect(detail.body.data).toEqual(detailA);expectSafe(detail.body.data);
    const list=(await get('/posts?teamId=10')).body.data;
    const {photos,...summary}=detailA;expect(photos).toHaveLength(3);expect(list[0]).toEqual(summary);
    expect((await get('/posts/1001')).body.data.photos).toEqual(detailA.photos);
    const fallback=(await get('/posts/2001')).body.data;expect(fallback.thumbnail).toEqual(photoDto(90));
  });
  it('represents empty photos and missing author explicitly',async()=>{
    const detail=(await get('/posts/1002')).body.data;expect(detail.photos).toEqual([]);expect(detail.thumbnail).toBeNull();expect(detail.author).toBeNull();
    await db.getRepository(User).update(11,{isDeleted:1});expect((await get('/posts/1001')).body.data.author).toBeNull();
  });
  it('returns empty lists for an existing empty parent',async()=>{
    expect((await get('/teams?campaignId=3')).body.data).toEqual([]);
    expect((await get('/posts?campaignId=3')).body.data).toEqual([]);
  });
  it.each(['/teams?campaignId=999','/posts?campaignId=999','/posts?teamId=999','/campaigns/999','/teams/999','/teams/999/attachments','/posts/999'])('returns 404 for missing resource %s',async path=>{
    const res=await get(path);expect(res.status).toBe(404);expect(res.body.success).toBe(false);
  });
  it.each(['0','-1','1.5','abc','1e1','0xA','9007199254740992','%20'])('rejects malformed ID %s consistently',async id=>{
    for(const path of [`/campaigns/${id}`,`/teams/${id}`,`/teams/${id}/attachments`,`/posts/${id}`,`/teams?campaignId=${id}`,`/posts?campaignId=${id}`,`/posts?teamId=${id}`]) {
      const res=await get(path);expect(res.status).toBe(400);expect(res.body.success).toBe(false);
    }
  });
  it.each(['/posts?teamId=10&teamId=20','/teams?campaignId=','/posts?campaignId=1&campaignId=2','/posts?teamId[x]=10'])('rejects ambiguous filter %s',async path=>expect((await get(path)).status).toBe(400));
  it('excludes deleted posts/parents on lists and details',async()=>{
    await db.getRepository(Post).update(1002,{isDeleted:1});expect((await get('/posts?teamId=10')).body.data.map((p:PostDetailDto)=>p.postId)).toEqual([1001]);expect((await get('/posts/1002')).status).toBe(404);
    await db.getRepository(Team).update(10,{isDeleted:1});
    expect((await get('/teams')).body.data.map((t:TeamReadDto)=>t.teamId)).toEqual([20]);expect((await get('/posts')).body.data.map((p:PostDetailDto)=>p.postId)).toEqual([2001]);
    for(const path of ['/teams/10','/teams/10/attachments','/posts/1001','/posts?teamId=10'])expect((await get(path)).status).toBe(404);
  });
  it('excludes detached parents instead of returning orphan records',async()=>{
    await db.query('UPDATE Team SET CampaignId=NULL WHERE TeamId=10');
    expect((await get('/teams')).body.data.map((t:TeamReadDto)=>t.teamId)).toEqual([20]);
    expect((await get('/posts')).body.data.map((p:PostDetailDto)=>p.postId)).toEqual([2001]);expect((await get('/posts/1001')).status).toBe(404);
    expect((await get('/teams/10')).status).toBe(404);
    await db.query('UPDATE Post SET TeamId=NULL WHERE PostId=2001');expect((await get('/posts/2001')).status).toBe(404);expect((await get('/posts')).body.data).toEqual([]);
  });
  it('hides deleted-account and inactive-profile leader summaries',async()=>{
    await db.getRepository(Account).update(101,{isDeleted:true});expect((await get('/teams/10')).body.data.leaders).toEqual([]);
    await db.getRepository(User).update(22,{isDeleted:1});expect((await get('/teams/20')).body.data.leaders).toEqual([]);
  });
  it('resolves own team from Account -> active User assignment, ignoring caller IDs',async()=>{
    for(const [accId,teamId] of [[101,10],[202,20]]) {
      const res=await request(app).get('/api'+API_ROUTES.LEADER.TEAM+'?teamId=20&campaignId=2').set('Authorization',`Bearer ${token(accId)}`);
      expect(res.status).toBe(200);expect(res.body.data.teamId).toBe(teamId);if(teamId===10)expect(res.body.data).toEqual(teamA);expectSafe(res.body.data);
    }
  });
  it('requires current Leader authentication for own-team',async()=>{
    expect((await get('/leader/team')).status).toBe(401);
    expect((await request(app).get('/api/leader/team').set('Authorization',`Bearer ${token(303,RoleEnum.ADMIN)}`)).status).toBe(403);
  });
  it.each(['missing-profile','unassigned','deleted-profile','deleted-team','missing-campaign'])('returns 404 for own-team without active assignment: %s',async state=>{
    let accId=101;
    if(state==='missing-profile')accId=404;
    if(state==='unassigned')await db.query('UPDATE User SET TeamId=NULL WHERE UserId=11');
    if(state==='deleted-profile')await db.getRepository(User).update(11,{isDeleted:1});
    if(state==='deleted-team')await db.getRepository(Team).update(10,{isDeleted:1});
    if(state==='missing-campaign')await db.query('UPDATE Team SET CampaignId=NULL WHERE TeamId=10');
    expect((await request(app).get('/api/leader/team').set('Authorization',`Bearer ${token(accId)}`)).status).toBe(404);
  });
});
