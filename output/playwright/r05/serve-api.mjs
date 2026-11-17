import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
process.env.DB_PATH = ':memory:';
process.env.DATABASE_PATH = ':memory:';
process.env.JWT_SECRET = 'r05-local-read-check-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';
const root = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const {AppDataSource: db} = await import(`${new URL('../../../packages/backend/dist/db/data-source.js',import.meta.url)}`);
await db.initialize();
await db.runMigrations();
const {Campaign} = await import(new URL('../../../packages/backend/dist/entities/Campaign.js',import.meta.url));
const {Team} = await import(new URL('../../../packages/backend/dist/entities/Team.js',import.meta.url));
const {Post} = await import(new URL('../../../packages/backend/dist/entities/Post.js',import.meta.url));
const {Photo} = await import(new URL('../../../packages/backend/dist/entities/Photo.js',import.meta.url));
const {Attachment} = await import(new URL('../../../packages/backend/dist/entities/Attachment.js',import.meta.url));
await db.getRepository(Campaign).save([
 {campaignId:501,campaignName:'Chiến dịch kiểm thử A',description:'Mô tả thực từ SQLite A',startDate:'2026-01-01',endDate:'2026-02-01'},
 {campaignId:502,campaignName:'Chiến dịch kiểm thử B',description:'Mô tả thực từ SQLite B',startDate:'2026-03-01',endDate:'2026-04-01'},
 {campaignId:503,campaignName:'Chiến dịch chưa có nội dung',startDate:'2026-05-01',endDate:'2026-06-01'},
]);
await db.getRepository(Team).save([
 {teamId:510,teamName:'Đội hình SQLite A',campaign:{campaignId:501},description:'Mô tả đội hình A',imageUrl:'/src/assets/icons/bnd.png'},
 {teamId:520,teamName:'Đội hình SQLite B',campaign:{campaignId:502},description:'Mô tả đội hình B'},
]);
await db.getRepository(Attachment).save({imageUrl:'/src/assets/icons/bnd.png',uploadedAt:'2026-01-01',campaign:{campaignId:501}});
await db.getRepository(Post).save([
 {postId:5101,title:'Bài SQLite A thứ nhất',content:'Nội dung bài thứ nhất thuộc A',team:{teamId:510},createdAt:'2026-01-01',updatedAt:'2026-01-01'},
 {postId:5102,title:'Bài SQLite A thứ hai',content:'Nội dung chính xác của bài thứ hai thuộc A',team:{teamId:510},createdAt:'2026-01-02',updatedAt:'2026-01-02'},
 {postId:5201,title:'Bài SQLite B',content:'Chỉ thuộc B',team:{teamId:520},createdAt:'2026-03-01',updatedAt:'2026-03-01'},
]);
await db.getRepository(Photo).save([
 {photoId:1,imageUrl:'/src/assets/icons/bnd.png',uploadedAt:'2026-01-01',isFirstImage:1,post:{postId:5101}},
 {photoId:2,imageUrl:'/src/assets/icons/xtn.png',uploadedAt:'2026-01-01',isFirstImage:1,post:{postId:5102}},
 {photoId:3,imageUrl:'/src/assets/icons/mhx.png',uploadedAt:'2026-01-01',isFirstImage:0,post:{postId:5102}},
]);
const {default: app} = await import(new URL('../../../packages/backend/dist/app.js',import.meta.url));
const server=app.listen(5017,'127.0.0.1',()=>console.log('R05 API fixture: http://127.0.0.1:5017/api — migrated SQLite :memory:; root '+root));
let closing=false;
async function close(){if(closing)return;closing=true;server.close(async()=>{await db.destroy();process.exit(0);});}
process.on('SIGINT',close);process.on('SIGTERM',close);
