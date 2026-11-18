import { startupConfig } from './config/startup.js';
import { AppDataSource, DATABASE_PATH, ensureDatabaseDirectory } from './db/data-source.js';

const startServer = async (): Promise<void> => {
  try {
    const { port, host } = startupConfig();
    const { default: app } = await import('./app.js');
    ensureDatabaseDirectory(DATABASE_PATH);

    await AppDataSource.initialize();
    await new Promise<void>((resolve, reject) => {
      const server = app.listen(port, host, () => resolve());
      server.once('error', reject);
    });
    console.log(`Server is running on http://${host}:${port}`);
    console.log(`Health check: http://${host}:${port}/api/health`);
  } catch {
    // Do not print raw configuration/driver errors containing credentials or SQL.
    console.error('Server startup failed. Check HOST/PORT, JWT, CORS and database configuration.');
    if (AppDataSource.isInitialized) await AppDataSource.destroy().catch(() => undefined);
    process.exitCode = 1;
  }
};

void startServer();
