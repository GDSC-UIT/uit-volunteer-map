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

const token = (accId:number,role=RoleEnum.LEADER) => jwt.sign({accId,role},process.env.JWT_SECRET!,{expiresIn:'1h'});
const admin=token(900,RoleEnum.ADMIN), leader=token(101), free=token(303);
const createBody={teamName:'New team',campaignId:1,leaderId:33};
function call(method:'get'|'post'|'put'|'delete',path:string,body?:object,auth:string|null=admin) {
  const req=request(app)[method]('/api'+path);if(auth)req.set('Authorization',`Bearer ${auth}`);return req.send(body);
}
async function snapshot() {
  return Promise.all(['Campaign','Team','User','Account','Post','Photo','Attachment'].map(table=>db.query(`SELECT * FROM "${table}" ORDER BY 1`)));
}
async function rejected(method:'post'|'put'|'delete',path:string,status:number,body?:object,auth=admin) {
  const before=await snapshot();const response=await call(method,path,body,auth);
  expect(response.status,response.text).toBe(status);expect(await snapshot()).toEqual(before);
}
beforeAll(async()=>{
  expect(db.isInitialized).toBe(false);
  db.setOptions({type:'sqlite',database:':memory:',synchronize:false,logging:false,entities:[Account,Role,User,Campaign,Team,Post,Photo,Attachment],migrations:[],subscribers:[]});
  await db.initialize();
});
afterAll(async()=>{if(db.isInitialized)await db.destroy();});
beforeEach(async()=>{
  await db.synchronize(true);
  await db.getRepository(Role).save([{roleId:1,roleName:RoleEnum.LEADER},{roleId:2,roleName:RoleEnum.ADMIN}]);
  await db.getRepository(Account).save([101,202,303,505,606,707,900].map(accId=>({accId,username:`account-${accId}`,password:'synthetic-unused',roleId:[707,900].includes(accId)?2:1,isDeleted:accId===505})));
  await db.getRepository(Campaign).save([1,2].map(campaignId=>({campaignId,campaignName:`Campaign ${campaignId}`,startDate:'2026-01-01',endDate:'2026-02-01'})));
  await db.getRepository(Team).save([{teamId:10,teamName:'Team A',campaign:{campaignId:1}},{teamId:20,teamName:'Team B',campaign:{campaignId:2}}]);
  await db.getRepository(User).save([
    {userId:11,fullName:'Leader A',email:'a@example.test',account:{accId:101},team:{teamId:10}},
    {userId:22,fullName:'Leader B',email:'b@example.test',account:{accId:202},team:{teamId:20}},
    {userId:33,fullName:'Free Leader',email:'free@example.test',account:{accId:303}},
    {userId:55,fullName:'Disabled account',email:'disabled@example.test',account:{accId:505}},
    {userId:66,fullName:'Deleted profile',email:'deleted@example.test',account:{accId:606},isDeleted:1},
    {userId:77,fullName:'Other member',email:'member@example.test',account:{accId:707},team:{teamId:10}},
  ]);
  await db.getRepository(Team).update(10,{leader:{userId:11}});await db.getRepository(Team).update(20,{leader:{userId:22}});
});

it('returns only safe Admin assignment contracts with real User IDs',async()=>{
  const options=(await call('get','/admin/team-leaders')).body.data;
  expect(options).toEqual([
    {userId:11,fullName:'Leader A',assignedTeamId:10,commandedTeamIds:[10]},
    {userId:22,fullName:'Leader B',assignedTeamId:20,commandedTeamIds:[20]},
    {userId:33,fullName:'Free Leader',assignedTeamId:null,commandedTeamIds:[]},
  ]);
  const response=await call('get','/admin/teams?campaignId=1');expect(response.status).toBe(200);
  expect(response.body.data).toHaveLength(1);expect(response.body.data[0].leaderId).toBe(11);
  for(const field of ['password','email','account','accId','roleId'])expect(JSON.stringify(response.body.data)).not.toContain(`"${field}":`);
});
it.each(['/admin/teams','/admin/team-leaders'])('protects management read %s',async path=>{
  expect((await call('get',path,undefined,null)).status).toBe(401);expect((await call('get',path,undefined,leader)).status).toBe(403);
});
it('creates an unassigned team, assigns and clears both sides',async()=>{
  const created=await call('post','/teams',{...createBody,leaderId:null});expect(created.status).toBe(201);
  const id=created.body.data.teamId;expect(created.body.data.leaderId).toBeNull();
  expect((await call('put',`/teams/${id}`,{leaderId:33})).body.data.leaderId).toBe(33);
  expect((await call('get','/leader/team',undefined,free)).body.data.teamId).toBe(id);
  expect((await call('put',`/teams/${id}`,{leaderId:null})).body.data.leaderId).toBeNull();
  expect((await call('get','/leader/team',undefined,free)).status).toBe(404);
});
it('creates an assigned team with canonical read data and no private graph',async()=>{
  const response=await call('post','/teams',createBody);expect(response.status).toBe(201);
  expect(response.body.data.leaders.map((item:{userId:number})=>item.userId)).toEqual([33]);
  expect((await db.getRepository(User).findOneOrFail({where:{userId:33},relations:['team']})).team.teamId).toBe(response.body.data.teamId);
  expect(JSON.stringify(response.body.data)).not.toContain('synthetic-unused');
});
it('replaces the Leader, updates own-team/post permissions and keeps ordinary members active',async()=>{
  expect((await call('put','/teams/10',{leaderId:33})).status).toBe(200);
  expect((await call('get','/leader/team',undefined,leader)).status).toBe(404);
  expect((await call('get','/leader/team',undefined,free)).body.data.teamId).toBe(10);
  await rejected('post','/posts',403,{title:'Denied post',content:'Body',teamId:10},leader);
  expect((await call('post','/posts',{title:'Allowed post',content:'Body',teamId:10},free)).status).toBe(200);
  const member=await db.getRepository(User).findOneOrFail({where:{userId:77},relations:['team']});expect(member.team.teamId).toBe(10);expect(member.isDeleted).toBe(0);
});
it('clears stale additional Leader membership when Admin explicitly clears assignment',async()=>{
  await db.getRepository(User).update(33,{team:{teamId:10}});
  await call('put','/teams/10',{leaderId:null});
  expect((await call('get','/teams/10')).body.data.leaders).toEqual([]);
  expect((await call('get','/leader/team',undefined,leader)).status).toBe(404);expect((await call('get','/leader/team',undefined,free)).status).toBe(404);
});
it.each([11,22])('rejects an already assigned Leader %i without partial creation',async leaderId=>rejected('post','/teams',409,{...createBody,leaderId}));
it('also checks Team.leader when User.team is inconsistent',async()=>{
  await db.createQueryBuilder().relation(User,'team').of(11).set(null);
  await rejected('post','/teams',409,{...createBody,leaderId:11});
});
it.each([[55,404],[66,404],[77,400],[999,404]])('rejects unavailable/wrong-role Leader %i',async(leaderId,status)=>rejected('post','/teams',status,{...createBody,leaderId}));
it('keeps reassignment Admin-only while allowing own-team descriptive edits',async()=>{
  for(const leaderId of [null,11,33])await rejected('put','/teams/10',403,{leaderId},leader);
  expect((await call('put','/teams/10',{description:'Updated by owner'},leader)).status).toBe(200);
  await rejected('put','/teams/20',403,{description:'Foreign edit'},leader);
  await rejected('put','/teams/10',400,{campaignId:2});
});
it('enforces existing globally unique names for create and rename',async()=>{
  await rejected('post','/teams',409,{...createBody,teamName:'Team A',campaignId:2});
  await rejected('put','/teams/20',409,{teamName:'Team A'});
  await rejected('put','/campaigns/2',409,{campaignName:'Campaign 1'});
});
it.each([0,1])('protects teams with retained posts, deleted flag %i',async isDeleted=>{
  await db.getRepository(Post).save({title:'Retained',content:'Body',createdAt:'2026-01-01',updatedAt:'2026-01-01',team:{teamId:10},isDeleted});
  await rejected('delete','/teams/10',409);await rejected('delete','/campaigns/1',409);
});
it.each(['team','campaign'] as const)('protects %s attachment metadata',async kind=>{
  await db.getRepository(Attachment).save({imageUrl:'https://example.test/retained.png',uploadedAt:'2026-01-01',...(kind==='team'?{team:{teamId:10}}:{campaign:{campaignId:2}})});
  await rejected('delete',kind==='team'?'/teams/10':'/campaigns/2',409);
});
it('deletes empty teams and campaigns without deactivating any profile/account',async()=>{
  const accounts=await db.query('SELECT * FROM Account ORDER BY AccId');
  expect((await call('delete','/teams/10')).status).toBe(200);
  expect((await call('get','/teams/10')).status).toBe(404);
  const member=await db.getRepository(User).findOneOrFail({where:{userId:11},relations:['team']});expect(member.team).toBeNull();expect(member.isDeleted).toBe(0);
  expect(await db.query('SELECT * FROM Account ORDER BY AccId')).toEqual(accounts);
  expect((await call('delete','/campaigns/1')).status).toBe(200);expect(await db.query('PRAGMA foreign_key_check')).toEqual([]);
});
it('rolls back both assignment links and metadata on a database failure, then accepts the next request',async()=>{
  await db.query("CREATE TRIGGER force_assignment_failure BEFORE UPDATE OF TeamId ON User WHEN NEW.UserId=33 AND NEW.TeamId=10 BEGIN SELECT RAISE(ABORT,'forced test failure'); END");
  await rejected('put','/teams/10',409,{leaderId:33,teamName:'Must roll back'});
  await db.query('DROP TRIGGER force_assignment_failure');
  expect((await call('put','/teams/10',{leaderId:33})).status).toBe(200);
});
it('serializes concurrent requests claiming the same free Leader',async()=>{
  const responses=await Promise.all(['Concurrent A','Concurrent B'].map(teamName=>call('post','/teams',{...createBody,teamName})));
  expect(responses.map(res=>res.status).sort()).toEqual([201,409]);
  const assigned=(await db.getRepository(User).findOneOrFail({where:{userId:33},relations:['team']})).team;
  expect((await db.getRepository(Team).findOneOrFail({where:{teamId:assigned.teamId},relations:['leader']})).leader?.userId).toBe(33);
});
it.each(['2026-02-30','2026-13-01','not-a-date'])('rejects an invalid campaign date %s',async startDate=>rejected('post','/campaigns',400,{campaignName:'Invalid date',startDate,endDate:'2026-12-31'}));
it('checks dates against retained values on partial updates',async()=>{
  await rejected('put','/campaigns/1',400,{startDate:'2026-03-01'});
  expect((await call('put','/campaigns/1',{description:'Metadata only'})).status).toBe(200);
});
it.each(['0','-1','01','1e1','invalid'])('rejects malformed lifecycle IDs %s',async id=>{
  await rejected('delete',`/teams/${id}`,400);await rejected('delete',`/campaigns/${id}`,400);
});
