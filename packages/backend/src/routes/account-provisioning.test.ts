import { beforeAll, beforeEach, afterAll, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import app from '../app.js';
import { AppDataSource as db } from '../db/data-source.js';
import { Account } from '../entities/Account.js';
import { User } from '../entities/User.js';
import { Role } from '../entities/Role.js';
import { Team } from '../entities/Team.js';
import { Campaign } from '../entities/Campaign.js';
import { Post } from '../entities/Post.js';
import { Photo } from '../entities/Photo.js';
import { Attachment } from '../entities/Attachment.js';
import { RoleEnum } from '@uit-volunteer-map/shared';

const token=(id:number,role=RoleEnum.LEADER)=>jwt.sign({accId:id,role},process.env.JWT_SECRET!,{expiresIn:'1h'});
const admin=token(900,RoleEnum.ADMIN),leader=token(101);
const body={username:'new-leader',password:'synthetic-new-password',fullname:'New Leader',mssv:'99000001',class:'SE.01',email:'fixture-r08-new@gm.uit.edu.vn',phoneNumber:'0900000000'};
let oldHash:string;
function call(method:'get'|'post'|'put'|'delete',path:string,data?:object,auth:string|null=admin){
  const req=request(app)[method]('/api'+path);if(auth)req.set('Authorization',`Bearer ${auth}`);return req.send(data);
}
async function snapshot(){return Promise.all(['Account','User','Team','Campaign','Post','Photo'].map(table=>db.query(`SELECT * FROM "${table}" ORDER BY 1`)));}
async function denied(method:'post'|'put'|'delete',path:string,status:number,data?:object,auth=admin){
  const before=await snapshot(),result=await call(method,path,data,auth);expect(result.status,result.text).toBe(status);expect(await snapshot()).toEqual(before);
}
function safe(data:unknown){for(const key of ['password','roleId','account','token'])expect(JSON.stringify(data)).not.toContain(`"${key}":`);}
beforeAll(async()=>{
  expect(db.isInitialized).toBe(false);db.setOptions({type:'sqlite',database:':memory:',synchronize:false,logging:false,entities:[Account,User,Role,Team,Campaign,Post,Photo,Attachment],migrations:[],subscribers:[]});
  await db.initialize();oldHash=await bcrypt.hash('synthetic-old-password',4);
});
afterAll(async()=>{if(db.isInitialized)await db.destroy();});
beforeEach(async()=>{
  await db.synchronize(true);
  // ID 2 is deliberately Admin; provisioning must select Leader by name (ID 19).
  await db.getRepository(Role).save([{roleId:2,roleName:RoleEnum.ADMIN},{roleId:19,roleName:RoleEnum.LEADER}]);
  await db.getRepository(Account).save([900,101,202,303,404,505].map(accId=>({accId,username:accId===404?'disabled':`account-${accId}`,password:oldHash,roleId:accId===900?2:19,isDeleted:accId===404})));
  await db.getRepository(Campaign).save({campaignId:1,campaignName:'Campaign',startDate:'2026-01-01',endDate:'2026-02-01'});
  await db.getRepository(Team).save([{teamId:10,teamName:'Team A',campaign:{campaignId:1}},{teamId:20,teamName:'Team B',campaign:{campaignId:1}}]);
  await db.getRepository(User).save([
    {userId:11,fullName:'Leader A',email:'old-a@gm.uit.edu.vn',account:{accId:101},team:{teamId:10}},
    {userId:22,fullName:'Free Leader',email:'free@gm.uit.edu.vn',account:{accId:202}},
    {userId:44,fullName:'Disabled Leader',email:'disabled@gm.uit.edu.vn',account:{accId:404}},
    {userId:55,fullName:'Archived profile',email:'Archive@GM.UIT.EDU.VN',account:{accId:505},isDeleted:1},
  ]);
  await db.getRepository(Team).update(10,{leader:{userId:11}});
  await db.getRepository(Post).save({postId:1001,title:'Retained history',content:'Original content',team:{teamId:10},author:{userId:11},createdAt:'2026-01-01',updatedAt:'2026-01-01'});
  await db.getRepository(Photo).save({imageUrl:'https://example.test/history.png',uploadedAt:'2026-01-01',post:{postId:1001}});
});

it('lists only Leader accounts including inactive/missing profiles and returns explicit safe details',async()=>{
  const list=await call('get','/accounts');expect(list.status).toBe(200);expect(list.body.data.map((item:{accId:number})=>item.accId)).toEqual([101,202,303,404,505]);safe(list.body.data);
  expect(list.body.data.find((item:{accId:number})=>item.accId===303).profile).toBeNull();
  expect(list.body.data.find((item:{accId:number})=>item.accId===404).active).toBe(false);
  expect(list.body.data.find((item:{accId:number})=>item.accId===505).profile.active).toBe(false);
  const detail=(await call('get','/accounts/101')).body.data;safe(detail);expect(detail.accId).toBe(101);expect(detail.profile.userId).toBe(11);expect(detail.team.teamId).toBe(10);expect(detail.commandedTeamIds).toEqual([10]);
});
it.each([['get','/accounts'],['get','/accounts/101'],['post','/accounts'],['put','/accounts/101'],['delete','/accounts/101']] as const)('protects %s %s for guests and Leaders',async(method,path)=>{
  const before=await snapshot();expect((await call(method,path,method==='post'?body:undefined,null)).status).toBe(401);expect((await call(method,path,method==='post'?body:undefined,leader)).status).toBe(403);expect(await snapshot()).toEqual(before);
});
it('creates a complete unassigned profile, hashes credentials and selects role by name',async()=>{
  const response=await call('post','/accounts',{...body,email:body.email.toUpperCase()});expect(response.status,response.text).toBe(201);const dto=response.body.data;safe(dto);
  expect(dto.role).toBe(RoleEnum.LEADER);expect(dto.profile.email).toBe(body.email);expect(dto.team).toBeNull();expect(dto.commandedTeamIds).toEqual([]);expect(dto.profile.userId).not.toBe(dto.accId);
  const stored=await db.getRepository(Account).findOneOrFail({where:{accId:dto.accId},relations:['role']});expect(stored.role.roleId).toBe(19);expect(stored.password).not.toBe(body.password);expect(await bcrypt.compare(body.password,stored.password)).toBe(true);
  expect((await call('get','/admin/team-leaders')).body.data.some((item:{userId:number})=>item.userId===dto.profile.userId)).toBe(true);
});
it('provisions -> assigns -> logs in, then revokes old tokens while preserving authored posts/photos',async()=>{
  const created=(await call('post','/accounts',body)).body.data;
  expect((await call('put','/teams/20',{leaderId:created.profile.userId})).status).toBe(200);
  const login=await call('post','/auth/login',{username:body.username,password:body.password},null);expect(login.status).toBe(200);const auth=login.body.data.token;
  expect((await call('get','/leader/team',undefined,auth)).body.data.teamId).toBe(20);
  expect((await call('get','/accounts',undefined,auth)).status).toBe(403);
  const published=await call('post','/posts',{teamId:20,title:'New authorship',content:'Body',photos:[{imageUrl:'https://example.test/new-authored.png'}]},auth);expect(published.status).toBe(200);
  const before=await Promise.all([db.query('SELECT * FROM Post ORDER BY PostId'),db.query('SELECT * FROM Photo ORDER BY PhotoId')]);
  const deactivated=await call('delete',`/accounts/${created.accId}`);expect(deactivated.status).toBe(200);safe(deactivated.body.data);expect(deactivated.body.data.active).toBe(false);expect(deactivated.body.data.team).toBeNull();expect(deactivated.body.data.commandedTeamIds).toEqual([]);
  expect(await Promise.all([db.query('SELECT * FROM Post ORDER BY PostId'),db.query('SELECT * FROM Photo ORDER BY PhotoId')])).toEqual(before);
  expect((await call('get',`/posts/${published.body.data.postId}`)).body.data.author.userId).toBe(created.profile.userId);
  expect((await call('get','/leader/team',undefined,auth)).status).toBe(401);expect((await call('post','/auth/login',{username:body.username,password:body.password},null)).status).toBe(401);
  expect((await db.getRepository(User).findOneOrFail({where:{userId:created.profile.userId}})).isDeleted).toBe(0);
});
it('updates profile fields without resetting password and supports an explicit password reset',async()=>{
  const first=await call('put','/accounts/202',{fullname:'Renamed Leader',phoneNumber:null});expect(first.status).toBe(200);safe(first.body.data);expect(first.body.data.profile.fullName).toBe('Renamed Leader');expect(first.body.data.profile.phoneNumber).toBeNull();
  expect((await db.getRepository(Account).findOneByOrFail({accId:202})).password).toBe(oldHash);
  const next=await call('put','/accounts/202',{password:'synthetic-replacement-password'});expect(next.status).toBe(200);safe(next.body.data);
  expect((await call('post','/auth/login',{username:'account-202',password:'synthetic-old-password'},null)).status).toBe(401);
  expect((await call('post','/auth/login',{username:'account-202',password:'synthetic-replacement-password'},null)).status).toBe(200);
});
it('repairs a legacy missing profile only with complete profile data',async()=>{
  await denied('put','/accounts/303',409,{password:'synthetic-replacement-password'});
  const {username:unusedUsername,password:unusedPassword,...profile}=body;void unusedUsername;void unusedPassword;
  const repaired=await call('put','/accounts/303',profile);expect(repaired.status).toBe(200);expect(repaired.body.data.profile.fullName).toBe(body.fullname);expect(repaired.body.data.team).toBeNull();safe(repaired.body.data);
});
it.each([404,505])('does not silently reactivate inactive identity/profile %i',async id=>denied('put',`/accounts/${id}`,409,{fullname:'Attempted change'}));
it('keeps Admin accounts outside this Leader-only namespace',async()=>{
  expect((await call('get','/accounts/900')).status).toBe(404);await denied('put','/accounts/900',404,{password:'synthetic-replacement-password'});await denied('delete','/accounts/900',404);
});
it('deactivation is idempotent and clears legacy references on an already inactive account',async()=>{
  await db.getRepository(User).update(44,{team:{teamId:20}});await db.getRepository(Team).update(20,{leader:{userId:44}});
  expect((await call('delete','/accounts/404')).body.data.commandedTeamIds).toEqual([]);expect((await call('delete','/accounts/404')).status).toBe(200);expect(await db.query('PRAGMA foreign_key_check')).toEqual([]);
});
it.each([{roleId:2},{role:RoleEnum.ADMIN},{teamId:20},{userId:11},{active:true},{isDeleted:false},{username:'renamed-login'}])('rejects unsupported update fields %j',async data=>denied('put','/accounts/202',400,data));
it.each([{teamId:20},{roleId:2},{accId:101}])('rejects ownership/role injection at creation %j',async extra=>denied('post','/accounts',400,{...body,...extra}));
it.each([{password:'short'},{password:'a'.repeat(73)},{password:'ắ'.repeat(25)},{mssv:'1234567'},{email:'outside@example.test'},{phoneNumber:'123'},{fullname:'  '}])('rejects invalid provisioning fields %j',async extra=>denied('post','/accounts',400,{...body,...extra}));
it('protects retained usernames and email uniqueness, including case variants and archived profiles',async()=>{
  await denied('post','/accounts',409,{...body,username:'disabled'});
  await denied('post','/accounts',409,{...body,email:'archive@gm.uit.edu.vn'});
  await denied('put','/accounts/202',409,{email:'old-a@gm.uit.edu.vn',password:'synthetic-replacement-password'});
});
it('does not fall back to a numeric role when Leader configuration is missing',async()=>{
  await db.query("UPDATE Role SET RoleName='unconfigured' WHERE RoleId=19");await denied('post','/accounts',409,body);
});
it('rolls back Account insertion on profile failure and permits retry',async()=>{
  await db.query(`CREATE TRIGGER force_profile_failure BEFORE INSERT ON User WHEN NEW.Email='${body.email}' BEGIN SELECT RAISE(ABORT,'synthetic profile failure'); END`);
  await denied('post','/accounts',409,body);await db.query('DROP TRIGGER force_profile_failure');expect((await call('post','/accounts',body)).status).toBe(201);
});
it('rolls back profile edits if the Account update fails',async()=>{
  await db.query("CREATE TRIGGER force_account_failure BEFORE UPDATE OF Password ON Account WHEN NEW.AccId=202 BEGIN SELECT RAISE(ABORT,'synthetic account failure'); END");
  await denied('put','/accounts/202',409,{fullname:'Must roll back',password:'synthetic-replacement-password'});
});
it('rolls back assignment release on failed deactivation; successful retry denies the old token',async()=>{
  await db.query("CREATE TRIGGER force_deactivation_failure BEFORE UPDATE OF isDeleted ON Account WHEN NEW.AccId=101 BEGIN SELECT RAISE(ABORT,'synthetic deactivate failure'); END");
  await denied('delete','/accounts/101',409);expect((await call('get','/leader/team',undefined,leader)).status).toBe(200);
  await db.query('DROP TRIGGER force_deactivation_failure');expect((await call('delete','/accounts/101')).status).toBe(200);expect((await call('get','/leader/team',undefined,leader)).status).toBe(401);
});
it('serializes assignment against deactivation without leaving an inactive commander',async()=>{
  const [assigned,deactivated]=await Promise.all([call('put','/teams/20',{leaderId:22}),call('delete','/accounts/202')]);expect([200,404]).toContain(assigned.status);expect(deactivated.status).toBe(200);
  const user=await db.getRepository(User).findOneOrFail({where:{userId:22},relations:['team']});expect(user.team).toBeNull();expect((await db.getRepository(Team).findOneOrFail({where:{teamId:20},relations:['leader']})).leader).toBeNull();
});
it.each(['0','-1','01','1e2','invalid'])('validates Account IDs %s',async id=>{
  expect((await call('get',`/accounts/${id}`)).status).toBe(400);await denied('put',`/accounts/${id}`,400,{fullname:'Valid name'});await denied('delete',`/accounts/${id}`,400);
});
