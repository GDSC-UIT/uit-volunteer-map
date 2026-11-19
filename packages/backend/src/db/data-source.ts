import 'reflect-metadata';
import dotenv from 'dotenv';
import { mkdirSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { User } from '../entities/User.js';
import { Account } from '../entities/Account.js';
import { Role } from '../entities/Role.js';
import { Team } from '../entities/Team.js';
import { Campaign } from '../entities/Campaign.js';
import { Post } from '../entities/Post.js';
import { Photo } from '../entities/Photo.js';
import { Attachment } from '../entities/Attachment.js';
import { InitialPostgres1795104000001 } from './postgres/1795104000001-InitialPostgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const BACKEND_ROOT = resolve(__dirname, '../..');
export const ENV_FILE_PATH = resolve(BACKEND_ROOT, '.env');
export const DEFAULT_DB_RELATIVE_PATH = 'src/data/database.sqlite';

dotenv.config({ path: ENV_FILE_PATH });

export function resolveDatabasePath(configuredPath = process.env.DB_PATH ?? process.env.DATABASE_PATH): string {
  const trimmed = configuredPath?.trim();
  if (!trimmed) {
    return resolve(BACKEND_ROOT, DEFAULT_DB_RELATIVE_PATH);
  }
  if (trimmed === ':memory:') {
    return ':memory:';
  }
  return isAbsolute(trimmed) ? normalize(trimmed) : resolve(BACKEND_ROOT, trimmed);
}

export function ensureDatabaseDirectory(databasePath: string): void {
  if (databasePath === ':memory:') {
    return;
  }
  mkdirSync(dirname(databasePath), { recursive: true });
}

const migrationExtension = extname(__filename) === '.ts' ? '.ts' : '.js';
export const DATABASE_PATH = resolveDatabasePath();
const common = {
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Account, Role, Team, Campaign, Post, Photo, Attachment],
};

function createDataSource() {
  const connection = process.env.DATABASE_URL?.trim();
  if (!connection) {
    ensureDatabaseDirectory(DATABASE_PATH);
    return new DataSource({
      ...common,
      type: 'sqlite',
      database: DATABASE_PATH,
      migrations: [join(__dirname, `./migrations/*${migrationExtension}`)],
    });
  }

  try {
    const url = new URL(connection);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.username || url.pathname.length < 2) {
      throw new Error('Invalid connection URL');
    }
    const local = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
    return new DataSource({
      ...common,
      type: 'postgres',
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.slice(1)),
      schema: 'public',
      ssl: local ? false : { rejectUnauthorized: true },
      extra: { enableChannelBinding: !local, idleTimeoutMillis: 10_000 },
      connectTimeoutMS: 15_000,
      poolSize: 5,
      installExtensions: false,
      migrations: [InitialPostgres1795104000001],
    });
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
}

export const AppDataSource = createDataSource();
