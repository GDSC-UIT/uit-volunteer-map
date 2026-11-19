import { accessSync, constants } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { startupConfig } from './config/startup.js';
import { frontendDist } from './config/frontend.js';
import { prepareProduction, ProductionSetupError } from './db/production.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const startServer = async (): Promise<void> => {
  let db;
  try {
    const { port, host } = startupConfig();
    const production = process.argv.includes('--production') || process.env.NODE_ENV === 'production';
    if (production) {
      if (process.env.NODE_ENV !== 'production' || process.env.SERVE_FRONTEND !== 'true') {
        throw new ProductionSetupError('Production startup requires NODE_ENV=production and SERVE_FRONTEND=true.');
      }
      if (!process.env.DATABASE_URL?.trim()) throw new ProductionSetupError('Set DATABASE_URL to the Neon PostgreSQL connection URL.');
      accessSync(join(frontendDist, 'index.html'), constants.R_OK);
    }

    ({ AppDataSource: db } = await import('./db/data-source.js'));
    const { default: app } = await import('./app.js');
    await db.initialize();
    if (production) await prepareProduction(db);
    await new Promise<void>((resolve, reject) => {
      const server = app.listen(port, host, () => resolve());
      server.once('error', reject);
    });
    console.log(`Server is running on http://${host}:${port}`);
    console.log(`Health check: http://${host}:${port}/api/health`);
  } catch (error) {
    // Do not print raw configuration/driver errors containing credentials or SQL.
    console.error(error instanceof ProductionSetupError ? error.message :
      'Server startup failed. Check the frontend build, HOST/PORT, JWT, CORS and database configuration.');
    if (db?.isInitialized) await db.destroy().catch(() => undefined);
    process.exitCode = 1;
  }
};

void startServer();
