import { DataSource } from 'typeorm';
import sqlite3 from 'sqlite3';
import { closeSync, existsSync, lstatSync, openSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { AppDataSource } from './data-source.js';

type Row = Record<string, string | number | null>;
interface BackupTask { step(pages:number, callback:(error:Error|null, complete:boolean)=>void):void; finish(callback:(error:Error|null)=>void):void; }
type BackupConnection = sqlite3.Database & { backup(target:string, callback:(error:Error|null)=>void):BackupTask };
const tables = ['Role','Account','User','Campaign','Team','Post','Photo','Attachment'] as const;
const hash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');
function sourcePath(path:string) {
  const absolute=resolve(path);
  if(!existsSync(absolute)||lstatSync(absolute).isSymbolicLink()||!lstatSync(absolute).isFile())throw new Error('Source must be an existing regular SQLite file.');
  return realpathSync(absolute);
}
function unusedTarget(path:string) {
  const absolute=resolve(path);
  if(existsSync(absolute)||!existsSync(dirname(absolute)))throw new Error('Target must not exist and its parent directory must exist.');
  return absolute;
}
async function readOnly<T>(path:string,work:(db:DataSource)=>Promise<T>):Promise<T> {
  const db=new DataSource({type:'sqlite',database:sourcePath(path),flags:sqlite3.OPEN_READONLY,synchronize:false,logging:false});
  try {await db.initialize();return await work(db);} finally {if(db.isInitialized)await db.destroy();}
}
async function history(db:DataSource):Promise<{timestamp:number;name:string}[]> {
  const table=await db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'");
  return table.length?db.query('SELECT timestamp,name FROM migrations ORDER BY timestamp'):[];
}
export async function inspectDatabase(path:string) {
  return readOnly(path,async db=>({
    history:await history(db),
    integrity:await db.query('PRAGMA integrity_check'),
    foreignKeys:await db.query('PRAGMA foreign_key_check'),
    counts:await Promise.all(tables.map(async table=>{
      const found=await db.query("SELECT name FROM sqlite_master WHERE type='table' AND name=?",[table]);
      return {table,count:found.length?(await db.query(`SELECT COUNT(*) AS count FROM "${table}"`))[0].count:0};
    })),
  }));
}
export async function backupDatabase(source:string,target:string) {
  const from=sourcePath(source),to=unusedTarget(target);
  const checked=await inspectDatabase(from);
  if(JSON.stringify(checked.integrity)!=='[{"integrity_check":"ok"}]')throw new Error('Source integrity check failed.');
  // An exclusive reservation prevents accidental overwrite. SQLite backup includes committed WAL data.
  closeSync(openSync(to,'wx',0o600));
  const connection=await new Promise<BackupConnection>((ok,no)=>{
    const value=new sqlite3.Database(from,sqlite3.OPEN_READONLY,error=>error?no(error):ok(value as BackupConnection));
  });
  try {
    await new Promise<void>((ok,no)=>{
      const task=connection.backup(to,error=>{
        if(error){no(error);return;}
        task.step(-1,(stepError,complete)=>task.finish(finishError=>{
          if(stepError||finishError)no(stepError||finishError);else if(!complete)no(new Error('Backup busy/incomplete; stop writers and retry to a new target.'));else ok();
        }));
      });
    });
  } finally {await new Promise<void>((ok,no)=>connection.close(error=>error?no(error):ok()));}
  const verified=await inspectDatabase(to);
  if(JSON.stringify(verified.integrity)!=='[{"integrity_check":"ok"}]')throw new Error('Backup verification failed.');
  return {sha256:hash(to),history:verified.history,counts:verified.counts};
}
function workingDatabase(path:string) {
  const options=AppDataSource.options;
  if(options.type!=='sqlite')throw new Error('Database maintenance requires SQLite.');
  return new DataSource({...options,database:path,synchronize:false,logging:false});
}
function knownPrefix(rows:{timestamp:number;name:string}[],db:DataSource) {
  const expected=db.migrations.map(item=>item.name||item.constructor.name).sort((a,b)=>Number(a.slice(-13))-Number(b.slice(-13)));
  return rows.length<=expected.length&&rows.every((row,index)=>row.name===expected[index]&&Number(row.timestamp)===Number(expected[index].slice(-13)));
}
export async function upgradeDatabase(source:string,backup:string) {
  const from=sourcePath(source);
  const status=await inspectDatabase(from);
  if(status.foreignKeys.length)throw new Error('Source has FK violations; reconcile a backed-up copy before upgrade.');
  const db=workingDatabase(from);
  try {
    await db.initialize();
    if(!knownPrefix(status.history,db)||status.history.length<12)throw new Error('Direct upgrade supports only the exact known migration prefix from 12 onward. Use reviewed legacy recovery for older/unknown databases.');
    await backupDatabase(from,backup);
    const applied=await db.runMigrations();
    const violations=await db.query('PRAGMA foreign_key_check');
    if(violations.length)throw new Error('Upgrade FK check failed; preserve files and restore the verified backup before serving traffic.');
    const drift=await db.driver.createSchemaBuilder().log();
    if(drift.upQueries.length)throw new Error('Upgrade schema drift detected; do not serve this candidate.');
    return {applied:applied.map(item=>item.name),history:await history(db),foreignKeyViolations:0,schemaDrift:0};
  } finally {if(db.isInitialized)await db.destroy();}
}
export const legacyRecoveryPlanSchema=z.object({
  fallbackTimestamp:z.iso.datetime({offset:true}),
  postTeams:z.record(z.string().regex(/^[1-9]\d*$/),z.number().int().positive().max(Number.MAX_SAFE_INTEGER)),
}).strict();
export type LegacyRecoveryPlan=z.infer<typeof legacyRecoveryPlanSchema>;
export async function recoverLegacyDatabase(source:string,target:string,input:LegacyRecoveryPlan) {
  const plan=legacyRecoveryPlanSchema.parse(input),from=sourcePath(source),to=unusedTarget(target),archive=unusedTarget(to+'.legacy.json');
  const before=hash(from);
  const exported=await readOnly(from,async db=>{
    await db.query('BEGIN');
    try {
      const migrated=await history(db);
      if(migrated.length!==3||migrated[2].name!=='SeedInitialData1769078305873'||migrated[0].name!=='Baseline1769042239658'||migrated[1].name!=='AddUserPhoneNumber1769042360738')throw new Error('Recovery supports only the exact first-three-migration baseline.');
      if((await db.query('PRAGMA foreign_key_check')).length)throw new Error('Source has FK violations; reconcile a backed-up copy first.');
      const columns:Record<string,string[]>={
        Role:['RoleId','RoleName'],Account:['AccID','Username','Password','RoleId','CreateAt','UpdatedAt'],
        User:['UserId','FullName','Mssv','Class','Email','TeamId','AccId','PhoneNumber'],
        Campaign:['CampaignId','CampaignName','StartDate','EndDate','Description','UserId'],Team:['TeamId','TeamName','Description','CampaignId'],
        Post:['PostId','Title','Content','Status','IsDeleted','CampaignId','AuthorId'],Photo:['PhotoId','Title','ImageUrl','UploadedAt','PostID'],
      };
      for(const [table,expected] of Object.entries(columns)) {
        const actual=(await db.query(`PRAGMA table_info("${table}")`)).map((row:{name:string})=>row.name).sort();
        if(JSON.stringify(actual)!==JSON.stringify([...expected].sort()))throw new Error('Unsupported historical columns; review this schema separately.');
      }
      const data:Record<string,Row[]>={};
      for(const table of tables.filter(table=>table!=='Attachment'))data[table]=await db.query(`SELECT * FROM "${table}" ORDER BY 1`);
      return {version:1,history:migrated,data};
    } finally {await db.query('ROLLBACK');}
  });
  if(Object.keys(plan.postTeams).length!==exported.data.Post.length)throw new Error('Provide exactly one reviewed team mapping for every historical PostId.');
  for(const post of exported.data.Post) {
    const team=exported.data.Team.find(item=>item.TeamId===plan.postTeams[String(post.PostId)]);
    if(!team||post.CampaignId===null||team.CampaignId!==post.CampaignId)throw new Error('Post mapping must identify an existing team in the historical campaign; no ownership is inferred.');
  }
  // The protected archive retains removed legacy columns (e.g. Post.Status and Campaign.UserId), hashes and IDs.
  writeFileSync(archive,JSON.stringify(exported,null,2)+'\n',{flag:'wx',mode:0o600});
  closeSync(openSync(to,'wx',0o600));
  const db=workingDatabase(to);
  try {
    await db.initialize();await db.runMigrations();
    await db.transaction(async manager=>{
      await manager.query('PRAGMA defer_foreign_keys=ON');
      for(const table of ['User','Account','Role'])await manager.query(`DELETE FROM "${table}"`);
      const insert=async(table:string,rows:Row[])=>{
        for(const row of rows) {
          const columns=Object.keys(row);
          await manager.query(`INSERT INTO "${table}" (${columns.map(column=>'"'+column+'"').join(',')}) VALUES (${columns.map(()=>'?').join(',')})`,columns.map(column=>row[column]));
        }
      };
      const data=exported.data;
      await insert('Role',data.Role.map(row=>({RoleId:row.RoleId,RoleName:row.RoleName})));
      await insert('Account',data.Account.map(row=>({AccId:row.AccID,Username:row.Username,Password:row.Password,RoleId:row.RoleId,CreateAt:row.CreateAt,UpdatedAt:row.UpdatedAt,isDeleted:0})));
      await insert('Campaign',data.Campaign.map(row=>({CampaignId:row.CampaignId,CampaignName:row.CampaignName,StartDate:row.StartDate,EndDate:row.EndDate,Description:row.Description})));
      await insert('Team',data.Team.map(row=>({TeamId:row.TeamId,TeamName:row.TeamName,Description:row.Description,CampaignId:row.CampaignId,IsDeleted:0,ImageUrl:null,LeaderId:null})));
      await insert('User',data.User.map(row=>({UserId:row.UserId,FullName:row.FullName,Mssv:row.Mssv,Class:row.Class,Email:row.Email,TeamId:row.TeamId,AccId:row.AccId,PhoneNumber:row.PhoneNumber,avatarUrl:null,isDeleted:0})));
      const timestamp=new Date(plan.fallbackTimestamp).toISOString();
      await insert('Post',data.Post.map(row=>({PostId:row.PostId,Title:row.Title,Content:row.Content,IsDeleted:row.IsDeleted,TeamId:plan.postTeams[String(row.PostId)],AuthorId:row.AuthorId,CreatedAt:timestamp,UpdatedAt:timestamp,Latitude:null,Longitude:null})));
      const positions=new Map<string,number>();
      await insert('Photo',data.Photo.map(row=>{
        const key=String(row.PostID),position=positions.get(key)||0;positions.set(key,position+1);
        return {PhotoId:row.PhotoId,Title:row.Title,ImageUrl:row.ImageUrl,UploadedAt:row.UploadedAt,PostID:row.PostID,Position:position,isFirstImage:row.PostID!==null&&position===0?1:0,isDeleted:0};
      }));
      if((await manager.query('PRAGMA foreign_key_check')).length)throw new Error('Recovered FK check failed; target must not be used.');
    });
    const drift=await db.driver.createSchemaBuilder().log();
    if(drift.upQueries.length)throw new Error('Recovered schema drift detected.');
    if(hash(from)!==before)throw new Error('Source changed during recovery; stop writers and repeat from a verified backup.');
    return {history:await history(db),counts:(await inspectDatabase(to)).counts,sourceUnchanged:true,archiveSha256:hash(archive),
      synthesizedTimestamp:new Date(plan.fallbackTimestamp).toISOString(),archivedColumns:['Post.Status','Post.CampaignId','Campaign.UserId']};
  } finally {if(db.isInitialized)await db.destroy();}
}
