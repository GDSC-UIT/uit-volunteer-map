import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { backupDatabase, inspectDatabase, legacyRecoveryPlanSchema, recoverLegacyDatabase, upgradeDatabase } from './maintenance.js';
async function main() {
  const {positionals,values}=parseArgs({allowPositionals:true,strict:true,options:{source:{type:'string'},target:{type:'string'},backup:{type:'string'},mapping:{type:'string'}}});
  const command=positionals[0],allowed:Record<string,string[]>={inspect:['source'],backup:['source','target'],restore:['source','target'],upgrade:['source','backup'],recover:['source','target','mapping']};
  if(positionals.length!==1||!allowed[command]||allowed[command].some(key=>!values[key as keyof typeof values])||Object.keys(values).some(key=>!allowed[command].includes(key))) {
    throw new Error('Usage: db:tool inspect --source FILE | backup/restore --source FILE --target NEW_FILE | upgrade --source FILE --backup NEW_FILE | recover --source BACKUP --target NEW_FILE --mapping JSON');
  }
  let result:unknown;
  if(command==='inspect')result=await inspectDatabase(values.source!);
  else if(command==='backup'||command==='restore')result=await backupDatabase(values.source!,values.target!);
  else if(command==='upgrade')result=await upgradeDatabase(values.source!,values.backup!);
  else result=await recoverLegacyDatabase(values.source!,values.target!,legacyRecoveryPlanSchema.parse(JSON.parse(readFileSync(values.mapping!,'utf8'))));
  console.log(JSON.stringify({command,success:true,result},null,2));
}
main().catch((error:unknown)=>{console.error(error instanceof Error?error.message:'Database operation failed.');process.exitCode=1;});
