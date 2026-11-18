import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import app from '../app.js';
import { httpPolicy } from '../config/http.js';
import { startupConfig } from '../config/startup.js';
import { loginSchema } from '../schemas/auth.js';
import { AuthService } from '../service/authService.js';
import { HttpError } from '../errors/HttpError.js';
import { asyncRoute } from './asyncRoute.js';
import { errorHandler } from './errorHandler.js';
import { loginLimit } from './loginLimit.js';

afterEach(() => vi.restoreAllMocks());
describe('R13 HTTP policy and error boundary', () => {
  it('allows configured origins and preflight; rejects other origins without reflecting them', async () => {
    const allowed = await request(app).options('/api/auth/login').set('Origin', 'http://localhost:3001').set('Access-Control-Request-Method', 'POST');
    expect(allowed.status).toBe(204);
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3001');
    const rejected = await request(app).get('/api/health').set('Origin', 'https://untrusted.invalid');
    expect(rejected.status).toBe(403);
    expect(rejected.headers['access-control-allow-origin']).toBeUndefined();
    expect((await request(app).get('/api/health')).status).toBe(200);
    expect(app.get('trust proxy')).toBe(false);
  });
  it('catches rejected auth work and sanitizes internal errors and logs', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(AuthService.prototype, 'login').mockRejectedValue(new Error('SQL password=private-sentinel'));
    const res = await request(app).post('/api/auth/login').send({ username: 'test', password: 'synthetic' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, error: 'Internal Server Error' });
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-sentinel');
  });
  it.each([new Error('private'), new HttpError('private JWT configuration', 500)])('sanitizes async exceptions', async error => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const isolated = express().get('/', asyncRoute(async () => { throw error; })).use(errorHandler);
    const res = await request(isolated).get('/');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');
  });
  it('preserves expected public status and handles malformed/oversized JSON without echoing input', async () => {
    const isolated = express().get('/', asyncRoute(async () => { throw new HttpError('Access denied', 403); })).use(errorHandler);
    expect((await request(isolated).get('/')).body.error).toBe('Access denied');
    const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"private-sentinel":');
    expect(bad.status).toBe(400); expect(JSON.stringify(bad.body)).not.toContain('private-sentinel');
    const large = await request(app).post('/api/auth/login').send({ password: 'private-sentinel'.repeat(10_000) });
    expect(large.status).toBe(413); expect(JSON.stringify(large.body)).not.toContain('private-sentinel');
  });
  it('rejects unsafe/missing production origins and unbounded rate settings', () => {
    expect(() => httpPolicy({ NODE_ENV: 'production' })).toThrow('CORS_ORIGINS');
    for (const origin of ['*', 'null', 'https://safe.invalid/path', 'https://safe.invalid/', 'https://user:pass@safe.invalid', 'https://*.invalid']) {
      expect(() => httpPolicy({ CORS_ORIGINS: origin })).toThrow();
    }
    for (const value of ['0', '-1', 'Infinity', '1001']) expect(() => httpPolicy({ LOGIN_RATE_LIMIT_MAX: value })).toThrow();
    expect(httpPolicy({ CORS_ORIGINS: 'https://demo.invalid,https://demo.invalid' }).origins).toEqual(['https://demo.invalid']);
  });
  it('validates startup without disclosing supplied values', () => {
    expect(() => startupConfig({ JWT_SECRET: 'test', PORT: 'private-sentinel' })).toThrow('Invalid PORT');
    expect(() => startupConfig({})).toThrow('JWT_SECRET');
    expect(() => startupConfig({ JWT_SECRET: 'short', NODE_ENV: 'production' })).toThrow('32');
    expect(startupConfig({ JWT_SECRET: 'a'.repeat(32), NODE_ENV: 'production', CORS_ORIGINS: 'https://demo.invalid' })).toEqual({ port: 5000, host: '127.0.0.1' });
  });
  it('bounds credentials in bytes and denies extra privilege fields', () => {
    expect(loginSchema.safeParse({ username: '   ', password: 'ok' }).success).toBe(false);
    expect(loginSchema.safeParse({ username: 'x'.repeat(101), password: 'ok' }).success).toBe(false);
    expect(loginSchema.safeParse({ username: 'test', password: 'ế'.repeat(25) }).success).toBe(false);
    expect(loginSchema.safeParse({ username: 'test', password: 'ok', role: 'admin' }).success).toBe(false);
    expect(loginSchema.parse({ username: ' test ', password: 'ok' }).username).toBe('test');
  });
});
describe('bounded login attempt limiter', () => {
  it('keeps failed attempts, ignores spoofed proxy headers and resets after the window', async () => {
    let clock = 1000;
    const isolated = express().use(loginLimit({ max: 2, windowMs: 2000, now: () => clock })).post('/', (_req, res) => { res.sendStatus(401); });
    expect((await request(isolated).post('/').set('X-Forwarded-For', '1.2.3.4')).status).toBe(401);
    expect((await request(isolated).post('/').set('X-Forwarded-For', '5.6.7.8')).status).toBe(401);
    const blocked = await request(isolated).post('/');
    expect(blocked.status).toBe(429); expect(blocked.headers['retry-after']).toBe('2');
    clock += 2001;
    expect((await request(isolated).post('/')).status).toBe(401);
  });
  it('does not consume failed-login budget for successful login or internal service failure', async () => {
    let status = 200;
    const isolated = express().use(loginLimit({ max: 1, windowMs: 2000 })).post('/', (_req, res) => { res.sendStatus(status); });
    for (status of [200, 200, 500, 500, 401]) expect((await request(isolated).post('/')).status).toBe(status);
    expect((await request(isolated).post('/')).status).toBe(429);
  });
  it('reserves concurrent attempts and caps distinct IP storage', async () => {
    let release!: () => void;
    let enteredResolve!: () => void;
    const entered = new Promise<void>(resolve => { enteredResolve = resolve; });
    const isolated = express().use(loginLimit({ max: 1, windowMs: 2000 })).post('/', (_req, res) => { release = () => res.sendStatus(401); enteredResolve(); });
    const pending = request(isolated).post('/').then(response => response);
    await entered;
    const blocked = await request(isolated).post('/');
    release();
    expect((await pending).status).toBe(401);
    expect(blocked.status).toBe(429);
    // This isolated test trusts proxy values only to exercise the capacity branch; production app does not.
    const bounded = express().set('trust proxy', true).use(loginLimit({ max: 1, maxKeys: 1, windowMs: 2000 })).post('/', (_req, res) => { res.sendStatus(401); });
    expect((await request(bounded).post('/').set('X-Forwarded-For', '1.1.1.1')).status).toBe(401);
    expect((await request(bounded).post('/').set('X-Forwarded-For', '2.2.2.2')).status).toBe(429);
  });
});
