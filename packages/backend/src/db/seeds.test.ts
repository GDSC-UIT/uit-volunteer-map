import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';
import { AppDataSource } from './data-source.js';
import { seedRoles } from './seeds/roles.seed.js';
import { seedDemo, DEMO } from './seeds/demo.seed.js';
import { Role } from '../entities/Role.js';
import { Account } from '../entities/Account.js';
import { Campaign } from '../entities/Campaign.js';
import { Post } from '../entities/Post.js';

let db:DataSource;
const config={adminPassword:'synthetic-admin-only',leaderPassword:'synthetic-leader-only'};
const snapshot=async()=>Promise.all(['Role','Account','User','Campaign','Team','Post','Photo','Attachment'].map(table=>db.query(`SELECT * FROM "${table}" ORDER BY 1`)));
beforeEach(async()=>{vi.stubEnv('NODE_ENV','test');db=new DataSource({type:'sqlite',database:':memory:',entities:AppDataSource.options.entities,synchronize:true,logging:false});await db.initialize();});
afterEach(async()=>{if(db?.isInitialized)await db.destroy();vi.unstubAllEnvs();});
it('seeds roles by name with swapped IDs and never replaces existing identities',async()=>{
 await db.getRepository(Role).save([{roleId:1,roleName:'leader'},{roleId:19,roleName:'admin'}]);const before=await snapshot();await seedRoles(db);await seedRoles(db);expect(await snapshot()).toEqual(before);
});
it('adds a missing role without assuming its ID or provisioning any account',async()=>{
 await db.getRepository(Role).save({roleId:1,roleName:'leader'});await seedRoles(db);await seedRoles(db);
 expect((await db.getRepository(Role).findOneByOrFail({roleName:'admin'})).roleId).not.toBe(1);expect(await db.getRepository(Account).count()).toBe(0);
});
it('rejects ambiguous duplicate role names instead of choosing one',async()=>{
 await db.getRepository(Role).save([{roleName:'admin'},{roleName:'admin'}]);await expect(seedRoles(db)).rejects.toThrow('Ambiguous');
});
it('creates a complete demo once and never resets later passwords or content on rerun',async()=>{
 const first=await seedDemo(db,config);expect(first.created).toBe(true);
 const account=await db.getRepository(Account).findOneByOrFail({username:'demo-leader'});expect(await bcrypt.compare(config.leaderPassword,account.password)).toBe(true);
 const changed=await bcrypt.hash('changed-synthetic-password',4);await db.getRepository(Account).update(account.accId,{password:changed});
 const post=await db.getRepository(Post).findOneByOrFail({title:DEMO.postTitles[0]});await db.getRepository(Post).update(post.postId,{content:'User-edited content'});
 const before=await snapshot();expect((await seedDemo(db,{...config,leaderPassword:'different-synthetic-password'})).created).toBe(false);expect(await snapshot()).toEqual(before);
});
it('refuses non-demo application data without changing it',async()=>{
 await db.getRepository(Campaign).save({campaignName:'Real campaign',startDate:'2026-01-01',endDate:'2026-02-01'});const before=await snapshot();
 await expect(seedDemo(db,config)).rejects.toThrow('empty application');expect(await snapshot()).toEqual(before);
});
it('rejects an incomplete/conflicting demo namespace without repairing it',async()=>{
 await seedRoles(db);const role=await db.getRepository(Role).findOneByOrFail({roleName:'admin'});await db.getRepository(Account).save({username:'demo-admin',password:'preserved',roleId:role.roleId});
 const before=await snapshot();await expect(seedDemo(db,config)).rejects.toThrow('conflict');expect(await snapshot()).toEqual(before);
});
it('rolls back roles, credentials, profiles, assignment and media if a later seed photo fails',async()=>{
 await db.query(`CREATE TRIGGER fail_demo BEFORE INSERT ON Photo WHEN NEW.ImageUrl LIKE '%post-1' BEGIN SELECT RAISE(ABORT,'synthetic seed failure'); END`);
 const before=await snapshot();await expect(seedDemo(db,config)).rejects.toThrow('synthetic seed failure');expect(await snapshot()).toEqual(before);
});
it('does not seed demo data in production',async()=>{
 vi.stubEnv('NODE_ENV','production');const before=await snapshot();await expect(seedDemo(db,config)).rejects.toThrow('production');expect(await snapshot()).toEqual(before);
});
it.each(['short','x'.repeat(73)])('rejects an unsafe configured demo password',async password=>{
 const before=await snapshot();await expect(seedDemo(db,{...config,adminPassword:password})).rejects.toThrow('12 characters');expect(await snapshot()).toEqual(before);
});
