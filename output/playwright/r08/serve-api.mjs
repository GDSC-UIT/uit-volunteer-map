// Extend only the disposable migrated R07 database; no real account is created.
await import('../r07/serve-api.mjs');
const {AppDataSource:db}=await import('../../../packages/backend/dist/db/data-source.js');
if(db.options.database!==':memory:')throw Error('R08 fixture requires SQLite :memory:');
const {Account}=await import('../../../packages/backend/dist/entities/Account.js');
const {User}=await import('../../../packages/backend/dist/entities/User.js');
const {Role}=await import('../../../packages/backend/dist/entities/Role.js');
const {RoleEnum}=await import('@uit-volunteer-map/shared');
const leader=await db.getRepository(Role).findOneByOrFail({roleName:RoleEnum.LEADER});
const template=await db.getRepository(Account).findOneByOrFail({accId:900});
await db.getRepository(Account).save([
 {accId:700,username:'r08-orphan',password:template.password,roleId:leader.roleId},
 {accId:701,username:'r08-disabled',password:template.password,roleId:leader.roleId,isDeleted:true},
]);
await db.getRepository(User).save({userId:71,fullName:'Chỉ huy đã vô hiệu',email:'fixture-r08-disabled@gm.uit.edu.vn',account:{accId:701}});
console.log('R08 READY: isolated Leader provisioning, orphan-profile and inactive-account fixtures; API 127.0.0.1:5017.');
