import app from './app.js';
import { AppDataSource, DATABASE_PATH, ensureDatabaseDirectory } from './db/data-source.js';

function validateStartupEnv(): { port: number; databasePath: string } {
  const rawPort = process.env.PORT?.trim();
  const port = rawPort ? Number(rawPort) : 5000;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT "${rawPort}". Expected an integer between 1 and 65535.`);
  }

  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }

  if (!DATABASE_PATH) {
    throw new Error('Invalid database configuration: resolved DB_PATH is empty');
  }

  return { port, databasePath: DATABASE_PATH };
}

const startServer = async (): Promise<void> => {
  try {
    const { port, databasePath } = validateStartupEnv();
    ensureDatabaseDirectory(databasePath);

    await AppDataSource.initialize();
    console.log(`Database connected successfully (${databasePath})`);

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      console.log(`Health check: http://localhost:${port}/api/health`);
    });
  } catch (error: unknown) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

void startServer();

export default app;
