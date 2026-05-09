import { DataSource } from 'typeorm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: join(__dirname, '../data/database.sqlite'),
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Account, Role, Team, Campaign, Post, Photo, Attachment],
  migrations: [
    join(__dirname, './migrations/**/*.{ts,js}'),
  ],
  subscribers: [],
});
