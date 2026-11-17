import { isAxiosError } from 'axios';
export function routeId(value?: string): number {
  const id = value && /^[1-9]\d*$/.test(value) ? Number(value) : 0;
  return Number.isSafeInteger(id) ? id : 0;
}
export function isNotFound(error: unknown) { return isAxiosError(error) && error.response?.status === 404; }
export function readRetry(failures: number,error: unknown) { return !isNotFound(error) && failures < 1; }
