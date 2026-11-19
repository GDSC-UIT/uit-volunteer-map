import bcrypt from 'bcrypt';
import { In, MigrationExecutor, type DataSource, type EntityManager } from 'typeorm';
import { z } from 'zod';
import { RoleEnum } from '@uit-volunteer-map/shared';
import { databaseReady } from '../config/readiness.js';
import { frontendDist } from '../config/frontend.js';
import { Account } from '../entities/Account.js';
import { Campaign } from '../entities/Campaign.js';
import { Role } from '../entities/Role.js';
import { User } from '../entities/User.js';
import { loadXtn2026, seedXtn2026 } from './seeds/xtn-2026.seed.js';
import { lockPostgresWrites } from './postgres/write-lock.js';

export class ProductionSetupError extends Error {}

const bootstrapNames = ['admin', 'leader', 'leader2'];
const adminInput = z.object({
  username: z.string().regex(/^[a-zA-Z0-9_.-]{3,50}$/).refine(value => !bootstrapNames.includes(value.toLowerCase())),
  password: z.string().min(16).refine(value => Buffer.byteLength(value, 'utf8') <= 72),
  email: z.email(),
});

function initialAdmin() {
  const result = adminInput.safeParse({
    username: process.env.PRODUCTION_ADMIN_USERNAME,
    password: process.env.PRODUCTION_ADMIN_PASSWORD,
    email: process.env.PRODUCTION_ADMIN_EMAIL,
  });
  if (!result.success) throw new ProductionSetupError('Set PRODUCTION_ADMIN_USERNAME (new username), PRODUCTION_ADMIN_EMAIL and PRODUCTION_ADMIN_PASSWORD (16+ characters, maximum 72 UTF-8 bytes).');
  return result.data;
}

async function prepareAdmin(manager: EntityManager) {
  const accounts = manager.getRepository(Account);
  const users = manager.getRepository(User);
  const legacy = await accounts.find({ where: { username: In(bootstrapNames) }, relations: { user: true, role: true } });
  const adminRole = await manager.getRepository(Role).findOneByOrFail({ roleName: RoleEnum.ADMIN });
  const configured = await accounts.find({
    where: { roleId: adminRole.roleId, isDeleted: false },
    relations: { user: true },
  });
  if (configured.some(account => !bootstrapNames.includes(account.username.toLowerCase()) && account.user?.isDeleted === 0)) {
    if (legacy.some(account => !account.isDeleted)) throw new ProductionSetupError('Disable legacy bootstrap accounts before starting production.');
    return;
  }
  if (await accounts.count() || await users.count() || await manager.getRepository(Campaign).count()) {
    throw new ProductionSetupError('Initial Admin setup requires a fresh database. Provision a verified Admin for an existing database first.');
  }

  const { username, password, email } = initialAdmin();
  const now = new Date().toISOString();
  const admin = await accounts.save(accounts.create({
    username, password: await bcrypt.hash(password, 12), roleId: adminRole.roleId, createdAt: now, updatedAt: now,
  }));
  await users.save(users.create({ fullName: 'Quản trị UIT Volunteer Map', email, account: admin }));
}

export async function prepareProduction(db: DataSource) {
  const batch = process.env.IMPORT_XTN_2026 === 'true' ? loadXtn2026(frontendDist) : undefined;
  const runner = db.createQueryRunner();
  try {
    await runner.startTransaction();
    await lockPostgresWrites(runner.manager);
    const executor = new MigrationExecutor(db, runner);
    const tables: Array<{ name: string }> = await runner.query(
      "SELECT tablename AS name FROM pg_catalog.pg_tables WHERE schemaname = 'public'",
    );
    const expected = db.migrations.map(migration => migration.name || migration.constructor.name)
      .sort((left, right) => left.slice(-13).localeCompare(right.slice(-13)));
    if (tables.length) {
      const ledger: Array<{ name: string }> = tables.some(table => table.name === 'migrations')
        ? await runner.query('SELECT name FROM public.migrations ORDER BY id')
        : [];
      if (!ledger.length || ledger.some((row, index) => row.name !== expected[index])) {
        throw new ProductionSetupError('Unsupported PostgreSQL migration history. Use a dedicated database or restore a verified backup.');
      }
    }
    await executor.executePendingMigrations();
    if (!await databaseReady({
      isInitialized: db.isInitialized, migrations: db.migrations, options: db.options,
      query: sql => runner.query(sql),
    })) throw new ProductionSetupError('PostgreSQL migration ledger is incomplete.');
    await prepareAdmin(runner.manager);
    const result = batch ? await seedXtn2026(runner.manager, batch) : undefined;
    await runner.commitTransaction();
    if (result) console.log(JSON.stringify({ import: 'XTN 2026', ...result }));
  } finally {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    await runner.release();
  }
}
