import { AppDataSource as db, DATABASE_PATH, ensureDatabaseDirectory } from '../data-source.js';
import { seedRoles } from './roles.seed.js';
import { seedDemo } from './demo.seed.js';

async function runSeed() {
  try {
    const args=process.argv.slice(2);
    if(args.some(arg=>arg!=='--demo'))throw new Error('Usage: seed [--demo]');
    const demo=args.includes('--demo');
    if(demo && !(process.env.DB_PATH?.trim() || process.env.DATABASE_PATH?.trim())) throw new Error('Demo seed requires an explicit DB_PATH. No default developer database is used.');
    ensureDatabaseDirectory(DATABASE_PATH);
    await db.initialize();
    if(await db.showMigrations())throw new Error('Apply pending migrations before seeding.');
    if(demo) {
      const result=await seedDemo(db,{adminPassword:process.env.DEMO_ADMIN_PASSWORD||'',leaderPassword:process.env.DEMO_LEADER_PASSWORD||''});
      console.log(result.created?'Created synthetic demo dataset.':'Demo already exists; no rows or passwords changed.');
    } else {
      await db.transaction(manager=>seedRoles(manager));
      console.log('Roles ready; demo data was not requested.');
    }
  } catch(error) {
    console.error(error instanceof Error?error.message:'Seeding failed.');
    process.exitCode=1;
  } finally {
    if(db.isInitialized)await db.destroy();
  }
}
void runSeed();
