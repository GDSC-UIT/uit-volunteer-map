import type { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES, type ApiResponse } from '@uit-volunteer-map/shared';
import { HttpError } from '../errors/HttpError.js';

export interface AppError extends Error {
  statusCode?: number;
  type?: string;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) { next(err); return; }
  const publicError = err instanceof HttpError && err.statusCode >= 400 && err.statusCode < 500;
  const parseError = err.type === 'entity.parse.failed';
  const tooLarge = err.type === 'entity.too.large';
  const statusCode = publicError ? err.statusCode : parseError ? 400 : tooLarge ? 413 : HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const response: ApiResponse<null> = {
    success: false,
    error: publicError ? err.message : parseError ? 'Invalid JSON body.' : tooLarge ? 'Request body is too large.' : ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
  };

  // SQL, request bodies and tokens can occur in exception messages and stacks.
  if (statusCode >= 500) console.error('[Error] Unhandled request failure (500).');

  res.status(statusCode).json(response);
};
