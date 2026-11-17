import { HttpError } from '../errors/HttpError.js';
import { HTTP_STATUS } from '@uit-volunteer-map/shared';

export function readId(value: unknown, resource: string): number {
  if ((typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) && typeof value !== 'number') {
    throw new HttpError(`Invalid ${resource} ID`, HTTP_STATUS.BAD_REQUEST);
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(`Invalid ${resource} ID`, HTTP_STATUS.BAD_REQUEST);
  return id;
}
export function optionalReadId(value: unknown, resource: string): number | undefined {
  return value === undefined ? undefined : readId(value, resource);
}
