import { AppDataSource as db } from '../data-source.js';
import { seedRoles } from './roles.seed.js';
import { seedDemo } from './demo.seed.js';
import { databaseReady } from '../../config/readiness.js';
import { frontendDist } from '../../config/frontend.js';
import { loadXtn2026, seedXtn2026 } from './xtn-2026.seed.js';
import { lockPostgresWrites } from '../postgres/write-lock.js';

async function runSeed() {
  try {
    const args=process.argv.slice(2);
    const importXtn = args[0] === '--xtn-2026';
    const dryRun = importXtn && args[1] === '--dry-run';
    if (args.length > (dryRun ? 2 : 1) || (args.length && !importXtn && args[0] !== '--demo')) {
      throw new Error('Usage: seed [--demo | --xtn-2026 [--dry-run]]');
    }
    const demo=args.includes('--demo');
    if ((demo || importXtn) && db.options.type === 'sqlite' && !(process.env.DB_PATH?.trim() || process.env.DATABASE_PATH?.trim())) {
      throw new Error('Content seed requires an explicit DB_PATH or DATABASE_URL.');
    }
    const batch = importXtn ? loadXtn2026(frontendDist) : undefined;
    await db.initialize();
    if (batch) {
      if (!await databaseReady(db)) throw new Error('XTN 2026 import requires a current migration ledger.');
      const runner = db.createQueryRunner();
      try {
        await runner.startTransaction();
        await lockPostgresWrites(runner.manager);
        const result = await seedXtn2026(runner.manager, batch);
        if (dryRun) await runner.rollbackTransaction();
        else await runner.commitTransaction();
        console.log(JSON.stringify({ import: 'XTN 2026', dryRun, ...result }));
      } finally {
        if (runner.isTransactionActive) await runner.rollbackTransaction();
        await runner.release();
      }
      return;
    }
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
