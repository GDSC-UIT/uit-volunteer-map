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
ensureDatabaseDirectory(DATABASE_PATH);

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: DATABASE_PATH,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Account, Role, Team, Campaign, Post, Photo, Attachment],
  migrations: [
    join(__dirname, `./migrations/*${migrationExtension}`),
  ],
  subscribers: [],
});
