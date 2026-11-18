import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=new URL('../../../',import.meta.url),developerPath=fileURLToPath(new URL('packages/backend/src/data/database.sqlite',root));
const hash=()=>existsSync(developerPath)?createHash('sha256').update(readFileSync(developerPath)).digest('hex'):null;
const before=hash();
process.env.DB_PATH=':memory:';process.env.DATABASE_PATH=':memory:';process.env.NODE_ENV='test';process.env.JWT_SECRET=randomBytes(32).toString('hex');
const {AppDataSource:db}=await import(new URL('packages/backend/dist/db/data-source.js',root));
const {seedDemo}=await import(new URL('packages/backend/dist/db/seeds/demo.seed.js',root));
const {default:app}=await import(new URL('packages/backend/dist/app.js',root));
const require=createRequire(import.meta.url),sqlite=require('sqlite3'),statuses=[];
let server,report;
try {
 await db.initialize();assert.equal(db.options.database,':memory:');const applied=await db.runMigrations();
 const password='fixture-'+randomBytes(16).toString('hex');
 await seedDemo(db,{adminPassword:password,leaderPassword:password});
 server=await new Promise((ok,no)=>{const value=app.listen(0,'127.0.0.1',()=>ok(value));value.once('error',no)});
 const origin='http://127.0.0.1:'+server.address().port+'/api';
 const request=async(path,{method='GET',body,token,expected=200}={})=>{
  const response=await fetch(origin+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
  statuses.push({path,method,status:response.status});assert.equal(response.status,expected,path);
  return (await response.json()).data;
 };
 await request('/health');
 const auth=await request('/auth/login',{method:'POST',body:{username:'demo-leader',password}}),token=auth.token;
 assert.equal(typeof token,'string');
 const team=await request('/leader/team',{token});await request('/posts?teamId='+team.teamId);
 const post=await request('/posts',{method:'POST',token,body:{title:'[DEPENDENCY CHECK] Runtime post',content:'Synthetic module reachability check',teamId:team.teamId,coordinates:null,photos:[]}});
 await request('/posts/'+post.postId);
 await request('/posts/'+post.postId,{method:'DELETE',token});await request('/posts/'+post.postId,{expected:404});
 const loaded={};
 for(const name of ['glob','minimatch','picomatch','fdir','tinyglobby','node-gyp','tar','mysql2','typeorm-model-generator']) {
  loaded[name]=Object.keys(require.cache).some(path=>path.replaceAll('\\','/').includes('/node_modules/'+name+'/'));
 }
 for(const name of ['picomatch','tinyglobby','node-gyp','tar','mysql2','typeorm-model-generator'])assert.equal(loaded[name],false,name+' must not be loaded by this runtime journey');
 assert.deepEqual(await db.query('PRAGMA foreign_key_check'),[]);
 report={passed:true,appliedMigrations:applied.length,sqliteVersion:sqlite.VERSION,statuses,loadedPackages:loaded,
  scope:'Module-cache observation for compiled API startup, real auth, scoped read and post create/detail/delete; not a proof for arbitrary future code.',
  inputBoundary:'TypeORM migration globs come from the checked-in data-source configuration, not HTTP parameters. No request-supplied glob API exists.',
  developerDatabaseUnchanged:hash()===before};
 assert(report.developerDatabaseUnchanged);
} finally {
 if(server){await new Promise((ok,no)=>{server.close(error=>error?no(error):ok());server.closeAllConnections();});}
 if(db.isInitialized)await db.destroy();
 assert.equal(hash(),before);
}
writeFileSync(new URL('runtime-reachability.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
