import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest';
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
import { RoleEnum } from '@uit-volunteer-map/shared';

const leader = jwt.sign({accId:101,role:RoleEnum.LEADER},process.env.JWT_SECRET!,{expiresIn:'1h'});
const admin = jwt.sign({accId:900,role:RoleEnum.ADMIN},process.env.JWT_SECRET!,{expiresIn:'1h'});
const photo = (name:string) => ({imageUrl:`https://example.test/${name}.png`});
const body = {title:'Atomic post',content:'Body',teamId:10};
function write(path:string,data:object,auth=leader) { return request(app).post('/api'+path).set('Authorization',`Bearer ${auth}`).send(data); }
async function snapshot() { return Promise.all(['Team','User','Post','Photo','Attachment'].map(table=>db.query(`SELECT * FROM "${table}" ORDER BY 1`))); }
beforeAll(async()=>{
 expect(db.isInitialized).toBe(false);
 db.setOptions({type:'sqlite',database:':memory:',synchronize:false,logging:false,entities:[Account,Role,User,Campaign,Team,Post,Photo,Attachment],migrations:[],subscribers:[]});
 await db.initialize();
});
afterAll(async()=>{if(db.isInitialized)await db.destroy();});
beforeEach(async()=>{
 await db.synchronize(true);
 await db.getRepository(Role).save([{roleId:1,roleName:RoleEnum.LEADER},{roleId:2,roleName:RoleEnum.ADMIN}]);
 await db.getRepository(Account).save([101,202,303,900].map(accId=>({accId,username:'media-'+accId,password:'fixture-only',roleId:accId===900?2:1})));
 await db.getRepository(Campaign).save({campaignId:1,campaignName:'Fixture',startDate:'2026-01-01',endDate:'2026-02-01'});
 await db.getRepository(Team).save([{teamId:10,teamName:'Team A',campaign:{campaignId:1}},{teamId:20,teamName:'Team B',campaign:{campaignId:1}}]);
 await db.getRepository(User).save([
  {userId:11,fullName:'Leader A',email:'a@example.test',account:{accId:101},team:{teamId:10}},
  {userId:22,fullName:'Leader B',email:'b@example.test',account:{accId:202},team:{teamId:20}},
  {userId:33,fullName:'Free leader',email:'c@example.test',account:{accId:303}},
  {userId:90,fullName:'Admin',email:'admin@example.test',account:{accId:900}},
 ]);
 await db.getRepository(Team).update(10,{leader:{userId:11}});
 await db.getRepository(Post).save({postId:100,title:'Existing',content:'Body',team:{teamId:10},author:{userId:11},createdAt:'2026-01-01',updatedAt:'2026-01-01'});
 await db.getRepository(Photo).save({...photo('existing'),position:0,isFirstImage:1,uploadedAt:'2026-01-01',post:{postId:100}});
});
it('rolls back a post and earlier photos when a later photo insert fails, then permits the same retry',async()=>{
 await db.query(`CREATE TRIGGER fail_photo BEFORE INSERT ON Photo WHEN NEW.ImageUrl LIKE '%fail%' BEGIN SELECT RAISE(ABORT,'injected photo failure'); END`);
 const before=await snapshot(),data={...body,photos:[photo('good'),photo('fail')]};
 expect((await write('/posts',data)).status).toBe(409);expect(await snapshot()).toEqual(before);
 await db.query('DROP TRIGGER fail_photo');
 const retry=await write('/posts',data);expect(retry.status).toBe(200);
 expect(await db.getRepository(Post).countBy({title:body.title})).toBe(1);
 expect((await request(app).get('/api/posts/'+retry.body.data.postId)).body.data.photos.map((p:Photo)=>p.position)).toEqual([0,1]);
});
it('rolls back the entire post on an existing globally unique image URL conflict',async()=>{
 const before=await snapshot();expect((await write('/posts',{...body,photos:[photo('new'),photo('existing')]})).status).toBe(409);expect(await snapshot()).toEqual(before);
});
it('persists array order and one canonical thumbnail despite contradictory legacy first flags',async()=>{
 const result=await write('/posts',{...body,photos:[{...photo('z'),isFirstImage:0},{...photo('a'),isFirstImage:1},photo('m')]});expect(result.status).toBe(200);
 const detail=(await request(app).get('/api/posts/'+result.body.data.postId)).body.data;
 expect(detail.photos.map((p:Photo)=>p.imageUrl)).toEqual(['z','a','m'].map(n=>photo(n).imageUrl));
 expect(detail.photos.map((p:Photo)=>p.position)).toEqual([0,1,2]);expect(detail.photos.map((p:Photo)=>p.isFirstImage)).toEqual([true,false,false]);
 const list=(await request(app).get('/api/posts?teamId=10')).body.data;expect(list.find((p:Post)=>p.postId===detail.postId).thumbnail).toEqual(detail.photos[0]);
});
it('promotes an explicitly first appended photo and normalizes persisted positions',async()=>{
 expect((await write('/posts/100/photos',{...photo('promoted'),isFirstImage:1})).status).toBe(200);
 const photos=(await request(app).get('/api/posts/100')).body.data.photos;
 expect(photos.map((p:Photo)=>p.imageUrl)).toEqual([photo('promoted').imageUrl,photo('existing').imageUrl]);
 expect(photos.map((p:Photo)=>p.position)).toEqual([0,1]);expect(photos.map((p:Photo)=>p.isFirstImage)).toEqual([true,false]);
});
it('rolls back thumbnail/position changes when appending a duplicate fails',async()=>{
 const before=await snapshot();expect((await write('/posts/100/photos',{...photo('existing'),isFirstImage:1})).status).toBe(409);expect(await snapshot()).toEqual(before);
});
it('serializes concurrent photo appends and enforces the total limit without repeated positions',async()=>{
 const results=await Promise.all([1,2,3,4,5].map(id=>write('/posts/100/photos',photo('parallel-'+id))));
 expect(results.map(result=>result.status).sort()).toEqual([200,200,200,409,409]);
 const detail=(await request(app).get('/api/posts/100')).body.data;expect(detail.photos.map((p:Photo)=>p.position)).toEqual([0,1,2,3]);
 expect(detail.photos.filter((p:Photo)=>p.isFirstImage)).toHaveLength(1);
});
it.each(['file:///tmp/photo.png','data:image/png;base64,AA==','ftp://example.test/photo.png'])('rejects unsupported URL %s before any DB write',async imageUrl=>{
 const before=await snapshot();expect((await write('/posts',{...body,photos:[{imageUrl}]})).status).toBe(400);expect(await snapshot()).toEqual(before);
});
it('rejects oversized metadata batches and extra image fields',async()=>{
 const before=await snapshot();
 expect((await write('/posts',{...body,photos:Array.from({length:5},(_,i)=>photo('too-many-'+i))})).status).toBe(400);
 expect((await write('/posts/100/photos',{...photo('extra'),position:99})).status).toBe(400);
 expect(await snapshot()).toEqual(before);
});
it('rolls back team, assignment and preceding attachments when a later attachment fails',async()=>{
 await db.query(`CREATE TRIGGER fail_attachment BEFORE INSERT ON Attachment WHEN NEW.ImageUrl LIKE '%fail%' BEGIN SELECT RAISE(ABORT,'injected attachment failure'); END`);
 const before=await snapshot(),data={teamName:'Atomic team',campaignId:1,leaderId:33,attachments:[photo('team-good'),photo('team-fail')]};
 expect((await write('/teams',data,admin)).status).toBe(409);expect(await snapshot()).toEqual(before);
 await db.query('DROP TRIGGER fail_attachment');const retry=await write('/teams',data,admin);expect(retry.status).toBe(201);
 expect(retry.body.data.attachments.map((item:Attachment)=>item.position)).toEqual([0,1]);
 expect(retry.body.data.leaderId).toBe(33);expect(await db.getRepository(Team).countBy({teamName:'Atomic team'})).toBe(1);
});
it('keeps an attachment batch atomic on a later unique conflict, then appends in order',async()=>{
 await db.getRepository(Attachment).save({...photo('taken'),uploadedAt:'2026-01-01',position:0,team:{teamId:20}});
 const before=await snapshot();
 expect((await write('/teams/10/attachments',{attachments:[photo('team-first'),photo('taken')]})).status).toBe(409);expect(await snapshot()).toEqual(before);
 expect((await write('/teams/10/attachments',{attachments:[photo('team-first'),photo('team-second')]})).status).toBe(201);
 expect((await request(app).get('/api/teams/10')).body.data.attachments.map((item:Attachment)=>item.position)).toEqual([0,1]);
});
it('checks attachment access inside the transaction and denies detached/foreign parents',async()=>{
 const before=await snapshot();expect((await write('/teams/20/attachments',{attachments:[photo('foreign')]})).status).toBe(403);expect(await snapshot()).toEqual(before);
 await db.query('UPDATE Team SET CampaignId=NULL WHERE TeamId=10');
 expect((await write('/teams/10/attachments',{attachments:[photo('detached')]})).status).toBe(404);
});
it('serializes attachment appends and enforces the existing total quota',async()=>{
 const results=await Promise.all([1,2,3,4,5].map(id=>write('/teams/10/attachments',{attachments:[photo('attachment-'+id)]})));
 expect(results.map(result=>result.status).sort()).toEqual([201,201,201,201,409]);
 expect((await request(app).get('/api/teams/10')).body.data.attachments.map((item:Attachment)=>item.position)).toEqual([0,1,2,3]);
});
