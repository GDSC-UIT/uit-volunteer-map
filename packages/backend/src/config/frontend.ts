import { accessSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import { HttpError } from '../errors/HttpError.js';

export const frontendDist = fileURLToPath(new URL('../../../frontend/dist/', import.meta.url));

export function mountFrontend(app: Express) {
  const index = join(frontendDist, 'index.html');
  accessSync(index);
  app.use((req, _res, next) => {
    if (/^\/api(?:\/|$)/i.test(req.path)) {
      next(new HttpError('API route not found.', 404));
      return;
    }
    next();
  });
  app.use('/assets', express.static(join(frontendDist, 'assets'), { immutable: true, maxAge: '1y', index: false }));
  app.use(express.static(frontendDist, { index: false, redirect: false }));
  app.get('*', (req, res, next) => {
    if (!req.accepts('html') || /^\/(?:assets|data|homepage|map-element|xtn-2026)(?:\/|$)/.test(req.path)
        || /\.[^/]+$/.test(req.path)) {
      next();
      return;
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(index);
  });
}
