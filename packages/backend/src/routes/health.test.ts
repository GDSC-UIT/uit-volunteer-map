import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve } from 'node:path';
import request from 'supertest';
import app from '../app.js';
import { BACKEND_ROOT, DEFAULT_DB_RELATIVE_PATH, resolveDatabasePath } from '../db/data-source.js';
import { HTTP_STATUS, HEALTH_MESSAGES } from '@uit-volunteer-map/shared';

describe('GET /api/health', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(HEALTH_MESSAGES.STATUS_HEALTHY);
    expect(res.body.message).toBe(HEALTH_MESSAGES.SERVER_RUNNING);
  });

  it('should return timestamp and uptime', async () => {
    const res = await request(app).get('/api/health');

    expect(res.body.data.timestamp).toBeDefined();
    expect(typeof res.body.data.uptime).toBe('number');
  });
});

describe('Database path configuration', () => {
  let originalDbPath: string | undefined;
  let originalDatabasePath: string | undefined;

  beforeEach(() => {
    originalDbPath = process.env.DB_PATH;
    originalDatabasePath = process.env.DATABASE_PATH;
    delete process.env.DB_PATH;
    delete process.env.DATABASE_PATH;
  });

  afterEach(() => {
    if (originalDbPath !== undefined) {
      process.env.DB_PATH = originalDbPath;
    } else {
      delete process.env.DB_PATH;
    }

    if (originalDatabasePath !== undefined) {
      process.env.DATABASE_PATH = originalDatabasePath;
    } else {
      delete process.env.DATABASE_PATH;
    }
  });

  it('resolves default fallback when no environment variable or parameter is provided', () => {
    const expectedDefault = resolve(BACKEND_ROOT, DEFAULT_DB_RELATIVE_PATH);

    expect(resolveDatabasePath()).toBe(expectedDefault);
    expect(resolveDatabasePath(undefined)).toBe(expectedDefault);
    expect(resolveDatabasePath('')).toBe(expectedDefault);
    expect(resolveDatabasePath('   ')).toBe(expectedDefault);
  });

  it('resolves DB_PATH environment variable override', () => {
    process.env.DB_PATH = './custom/from-db-path.sqlite';
    const expected = resolve(BACKEND_ROOT, 'custom/from-db-path.sqlite');

    expect(resolveDatabasePath()).toBe(expected);
    expect(resolveDatabasePath(undefined)).toBe(expected);
  });

  it('resolves DATABASE_PATH alias when DB_PATH is not set', () => {
    process.env.DATABASE_PATH = './custom/from-database-path.sqlite';
    const expected = resolve(BACKEND_ROOT, 'custom/from-database-path.sqlite');

    expect(resolveDatabasePath()).toBe(expected);
    expect(resolveDatabasePath(undefined)).toBe(expected);
  });

  it('gives precedence to DB_PATH when both DB_PATH and DATABASE_PATH are defined', () => {
    process.env.DB_PATH = './primary/db.sqlite';
    process.env.DATABASE_PATH = './secondary/db.sqlite';

    expect(resolveDatabasePath()).toBe(resolve(BACKEND_ROOT, 'primary/db.sqlite'));
    expect(resolveDatabasePath(undefined)).toBe(resolve(BACKEND_ROOT, 'primary/db.sqlite'));
  });

  it('gives precedence to explicit parameter over environment variables', () => {
    process.env.DB_PATH = './env/db.sqlite';
    process.env.DATABASE_PATH = './env-alias/db.sqlite';

    expect(resolveDatabasePath('./explicit/param.sqlite')).toBe(
      resolve(BACKEND_ROOT, 'explicit/param.sqlite')
    );
  });

  it('resolves relative paths consistently against backend root', () => {
    const expectedDefault = resolve(BACKEND_ROOT, DEFAULT_DB_RELATIVE_PATH);

    expect(resolveDatabasePath('./src/data/database.sqlite')).toBe(expectedDefault);
    expect(resolveDatabasePath('src/data/database.sqlite')).toBe(expectedDefault);
    expect(resolveDatabasePath('custom/app.sqlite')).toBe(resolve(BACKEND_ROOT, 'custom/app.sqlite'));
  });

  it('preserves in-memory and explicit absolute database paths', () => {
    expect(resolveDatabasePath(':memory:')).toBe(':memory:');

    process.env.DB_PATH = ':memory:';
    expect(resolveDatabasePath()).toBe(':memory:');

    const explicitAbsolute = resolve(BACKEND_ROOT, 'tmp', 'disposable.sqlite');
    expect(resolveDatabasePath(explicitAbsolute)).toBe(explicitAbsolute);

    process.env.DB_PATH = explicitAbsolute;
    expect(resolveDatabasePath()).toBe(explicitAbsolute);
  });
});
