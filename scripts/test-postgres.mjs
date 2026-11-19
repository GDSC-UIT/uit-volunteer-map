import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { Client } from 'pg';

/** Tests own one randomly named database on a local disposable server. */
export async function createTestDatabase() {
  assert.ok(process.env.TEST_DATABASE_URL, 'Set TEST_DATABASE_URL to a local PostgreSQL server.');
  const url = new URL(process.env.TEST_DATABASE_URL);
  assert.ok(['postgres:', 'postgresql:'].includes(url.protocol)
    && ['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname === '/postgres',
  'TEST_DATABASE_URL must point to the postgres database on a loopback server.');
  const name = 'uit_verify_' + randomBytes(10).toString('hex');
  const admin = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000 });
  const clientUrl = new URL(url);
  clientUrl.pathname = '/' + name;
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
  } catch (error) {
    await admin.end();
    throw error;
  }
  return {
    url: clientUrl.toString(),
    async query(sql, values) {
      const client = new Client({ connectionString: clientUrl.toString() });
      await client.connect();
      try { return (await client.query(sql, values)).rows; }
      finally { await client.end(); }
    },
    async close() {
      try { await admin.query(`DROP DATABASE "${name}"`); }
      finally { await admin.end(); }
    },
  };
}
