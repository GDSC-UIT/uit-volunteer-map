process.env.DB_PATH=':memory:';
process.env.DATABASE_PATH=':memory:';
process.env.JWT_SECRET='r11-disposable-browser-only';
process.env.NODE_ENV='test';
const {AppDataSource:db}=await import('../../../packages/backend/dist/db/data-source.js');
const {seedDemo}=await import('../../../packages/backend/dist/db/seeds/demo.seed.js');
await db.initialize();
const applied=await db.runMigrations();
if(db.options.database!==':memory:'||applied.length!==15)throw Error('Expected fresh in-memory 15-migration fixture');
const demo=await seedDemo(db,{adminPassword:'r11-synthetic-admin',leaderPassword:'r11-synthetic-leader'});
const {default:app}=await import('../../../packages/backend/dist/app.js');
const server=app.listen(5017,'127.0.0.1',()=>console.log('R11 READY: real demo seed, 15 migrations, API 127.0.0.1:5017; campaignId='+demo.campaignId+' teamId='+demo.teamId));
let closing=false;
function close(){if(closing)return;closing=true;server.close(async()=>{await db.destroy();process.exit(0);});}
process.on('SIGINT',close);process.on('SIGTERM',close);
