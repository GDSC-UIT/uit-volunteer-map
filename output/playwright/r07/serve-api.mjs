// All records/credentials below are synthetic and exist only in the inherited :memory: fixture.
await import('../r06/serve-api.mjs');
const {AppDataSource:db}=await import('../../../packages/backend/dist/db/data-source.js');
if(db.options.database!==':memory:')throw Error('R07 fixture must use SQLite :memory:');
const {default:bcrypt}=await import('bcrypt');
const {RoleEnum}=await import('@uit-volunteer-map/shared');
const {Role}=await import('../../../packages/backend/dist/entities/Role.js');
const {Account}=await import('../../../packages/backend/dist/entities/Account.js');
const {User}=await import('../../../packages/backend/dist/entities/User.js');
const {Team}=await import('../../../packages/backend/dist/entities/Team.js');
const roles=db.getRepository(Role);
const admin=await roles.findOneBy({roleName:RoleEnum.ADMIN}) ?? await roles.save({roleName:RoleEnum.ADMIN});
const leader=await roles.findOneBy({roleName:RoleEnum.LEADER}) ?? await roles.save({roleName:RoleEnum.LEADER});
const password=await bcrypt.hash('r07-local-only',4);
await db.getRepository(Account).save([900,101,202,303,404].map(accId=>({accId,username:accId===900?'r07-admin':`r07-leader-${accId}`,password,roleId:accId===900?admin.roleId:leader.roleId})));
await db.getRepository(User).save([
 {userId:90,fullName:'Admin kiểm thử',email:'admin-r07@example.test',account:{accId:900}},
 {userId:11,fullName:'Chỉ huy A',email:'a-r07@example.test',account:{accId:101},team:{teamId:510}},
 {userId:22,fullName:'Chỉ huy B',email:'b-r07@example.test',account:{accId:202},team:{teamId:520}},
 {userId:33,fullName:'Chỉ huy trống C',email:'c-r07@example.test',account:{accId:303}},
 {userId:44,fullName:'Chỉ huy trống D',email:'d-r07@example.test',account:{accId:404}},
]);
await db.getRepository(Team).update(510,{leader:{userId:11}});await db.getRepository(Team).update(520,{leader:{userId:22}});
console.log('R07 READY: isolated Admin CRUD / assignment fixture, API on 127.0.0.1:5017; no developer database.');
