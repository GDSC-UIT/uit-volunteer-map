import type { EntityManager } from 'typeorm';
import { AppDataSource } from '../db/data-source.js';
import { lockPostgresWrites } from '../db/postgres/write-lock.js';
import { HttpError } from '../errors/HttpError.js';

// The SQLite datasource uses one connection. Serialize lifecycle transactions so
// concurrent requests cannot accidentally share nested savepoints or claim a Leader twice.
let previous: Promise<unknown> = Promise.resolve();
export function lifecycleTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
  const result = previous.then(() => AppDataSource.transaction(async manager => {
    await lockPostgresWrites(manager);
    return work(manager);
  })).catch((error: unknown) => {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
    if (code.startsWith('SQLITE_CONSTRAINT') || code === 'SQLITE_BUSY' ||
        ['23503', '23505', '23514', '40001', '40P01'].includes(code)) {
      throw new HttpError('Dữ liệu đang được sử dụng hoặc bị trùng. Vui lòng tải lại và thử lại.', 409);
    }
    throw error;
  });
  previous = result.catch(() => undefined);
  return result;
}
