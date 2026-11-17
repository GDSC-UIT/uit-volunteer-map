// Reuse the isolated migrated R05 Guest fixtures and loopback server, not a developer DB.
await import('../r05/serve-api.mjs');
const { AppDataSource: db } = await import('../../../packages/backend/dist/db/data-source.js');
if (db.options.database !== ':memory:') throw Error('R06 browser fixture must use SQLite :memory:');
const { Post } = await import('../../../packages/backend/dist/entities/Post.js');
await db.getRepository(Post).update(5101,{latitude:10.8231,longitude:106.6296});
await db.getRepository(Post).update(5102,{latitude:12.2388,longitude:109.1967});
await db.getRepository(Post).update(5201,{latitude:16.0471,longitude:108.2062});
await db.getRepository(Post).save({postId:5103,title:'Bài chưa có tọa độ',content:'Vẫn đọc được trong danh sách',createdAt:'2026-01-03',updatedAt:'2026-01-03',team:{teamId:510}});
console.log('R06 READY: 13 migrations, two campaign-A markers, separate campaign-B marker and an unlocated post; SQLite :memory:.');
