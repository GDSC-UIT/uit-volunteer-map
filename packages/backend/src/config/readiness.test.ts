import { expect, it, vi } from 'vitest';
import { databaseReady } from './readiness.js';
const migrations = [{ name: 'First1700000000000' }, { name: 'Second1700000000001' }];
it('reports an uninitialized source as not ready without issuing a query', async () => {
  const query = vi.fn(); expect(await databaseReady({ isInitialized: false, migrations, query })).toBe(false); expect(query).not.toHaveBeenCalled();
});
it.each([
  [], [{ name: migrations[0].name }],
  [{ name: migrations[0].name }, { name: 'Unknown1700000000002' }],
  [{ name: migrations[0].name }, { name: migrations[0].name }],
  [{ private: 'malformed ledger' }],
].map(rows => ({ rows })))('rejects missing, unknown, duplicate or malformed migration state %j', async ({ rows }) => {
  const query = vi.fn().mockResolvedValueOnce([{ '1': 1 }]).mockResolvedValueOnce(rows);
  expect(await databaseReady({ isInitialized: true, migrations, query })).toBe(false);
});
it('accepts a reachable source with the full current ledger, independent of discovery order', async () => {
  const query = vi.fn().mockResolvedValueOnce([{ '1': 1 }]).mockResolvedValueOnce([...migrations].reverse());
  expect(await databaseReady({ isInitialized: true, migrations, query })).toBe(true);
  expect(query.mock.calls.every(([sql]) => /^SELECT /.test(sql))).toBe(true);
});
it('fails closed on a connection/query exception', async () => {
  expect(await databaseReady({ isInitialized: true, migrations, query: vi.fn().mockRejectedValue(new Error('private driver detail')) })).toBe(false);
});
