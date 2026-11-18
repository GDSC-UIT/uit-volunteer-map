import type { Request, Response, NextFunction, RequestHandler } from 'express';
/** Express 4 needs an explicit rejection boundary. */
export function asyncRoute(work: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => { Promise.resolve().then(() => work(req, res, next)).catch(next); };
}
