import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

/** Cross-layer invariants on the actual migration schema; focused suites remain in Vitest. */
export async function releaseApiChecks({ base, webOrigin, db, demo }) {
  const checks = [];
  async function call(method, path, body, token, status = 200) {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, status, `${method} ${path} status`);
    const result = await response.json();
    assert.equal(result.success, status < 400);
    return result.data;
  }
  const login = async (username, password) => call('POST', '/auth/login', { username, password });
  const admin = await login('demo-admin', 'r14-synthetic-admin');
  const original = await login('demo-leader', 'r14-synthetic-leader');
  const tables = ['Campaign', 'Team', 'User', 'Account', 'Post', 'Photo', 'Attachment'];
  const snapshot = async () => JSON.stringify(await Promise.all(tables.map(table => db.query(`SELECT * FROM "${table}" ORDER BY 1`))));
  async function unchanged(method, path, body, token, status) {
    const before = await snapshot(); await call(method, path, body, token, status);
    // A boolean comparison prevents failed assertions from dumping account/hash rows.
    assert.equal(await snapshot() === before, true, `${method} ${path} must not mutate DB`);
  }
  await call('GET', '/campaigns');
  await unchanged('POST', '/posts', { title: 'denied', content: 'x', teamId: demo.teamId }, undefined, 401);
  await unchanged('POST', '/campaigns', { campaignName: 'denied', startDate: '2026-01-01', endDate: '2026-02-01' }, original.token, 403);
  const campaign = await call('POST', '/campaigns', { campaignName: '[R14] API lifecycle', startDate: '2026-01-01', endDate: '2026-12-31' }, admin.token, 201);
  const account = await call('POST', '/accounts', { username: 'r14-leader', password: 'r14-synthetic-provisioned', fullname: '[R14] Chỉ huy mới', mssv: '99000003', class: 'DEMO', email: 'r14-synthetic@gm.uit.edu.vn', phoneNumber: '0900000000' }, admin.token, 201);
  assert.equal('password' in account, false); assert.equal(account.team, null);
  const team = await call('POST', '/teams', { teamName: '[R14] API team', campaignId: campaign.campaignId, leaderId: account.profile.userId }, admin.token, 201);
  const leader = await login('r14-leader', 'r14-synthetic-provisioned');
  assert.equal((await call('GET', '/leader/team', undefined, leader.token)).teamId, team.teamId);
  assert.equal((await call('GET', '/accounts/' + account.accId, undefined, admin.token)).team.teamId, team.teamId);
  checks.push('Migrated schema: Admin provisions campaign/account/team; real Leader login and both assignment relations agree');
  const data = { title: '[R14] Atomic activity', content: 'Synthetic release check', teamId: team.teamId,
    coordinates: { latitude: 10.8231, longitude: 106.6296 }, photos: [0, 1].map(index => ({ imageUrl: `${webOrigin}/Homepage_Logo.svg?r14-api=${index}` })) };
  await unchanged('POST', '/posts', data, original.token, 403);
  await unchanged('POST', '/posts', { ...data, authorId: account.profile.userId }, leader.token, 400);
  const post = await call('POST', '/posts', data, leader.token);
  assert.equal(post.author.userId, account.profile.userId);
  const detail = await call('GET', '/posts/' + post.postId);
  assert.deepEqual(detail.photos.map(photo => photo.position), [0, 1]);
  assert.deepEqual(detail.photos.map(photo => photo.imageUrl), data.photos.map(photo => photo.imageUrl));
  assert.deepEqual((await call('GET', `/posts?campaignId=${campaign.campaignId}&teamId=${team.teamId}`)).map(item => item.postId), [post.postId]);
  assert.deepEqual(await call('GET', `/posts?campaignId=${demo.campaignId}&teamId=${team.teamId}`), []);
  assert.deepEqual((await call('GET', `/teams?campaignId=${campaign.campaignId}`)).map(item => item.teamId), [team.teamId]);
  await unchanged('PUT', '/posts/' + post.postId, { title: 'denied' }, original.token, 403);
  await unchanged('DELETE', '/campaigns/' + campaign.campaignId, undefined, admin.token, 409);
  await unchanged('POST', '/posts', { ...data, title: '[R14] Must roll back', photos: [{ imageUrl: `${webOrigin}/Homepage_Logo.svg?r14-new=1` }, data.photos[0]] }, leader.token, 409);
  checks.push('Auth/filter/media: foreign Leader and spoofed author denied without writes; intersected filters; ordered gallery; real unique-photo conflict rolls back post and first photo');
  await call('PUT', '/posts/' + post.postId, { title: '[R14] Edited persisted activity' }, leader.token);
  assert.equal((await call('GET', '/posts/' + post.postId)).title, '[R14] Edited persisted activity');
  const expired = jwt.sign({ accId: account.accId, role: 'leader' }, process.env.JWT_SECRET, { expiresIn: -1 });
  await unchanged('PUT', '/posts/' + post.postId, { title: 'expired' }, expired, 401);
  const [{ RoleId: adminRole }] = await db.query("SELECT RoleId FROM Role WHERE RoleName = 'admin'");
  const [{ RoleId: leaderRole }] = await db.query("SELECT RoleId FROM Role WHERE RoleName = 'leader'");
  await db.query('UPDATE Account SET RoleId = ? WHERE AccId = ?', [adminRole, account.accId]);
  assert.equal((await call('GET', '/verify', undefined, leader.token)).user.role, 'admin');
  await call('GET', '/leader/team', undefined, leader.token, 403);
  await db.query('UPDATE Account SET RoleId = ? WHERE AccId = ?', [leaderRole, account.accId]);
  await call('DELETE', '/posts/' + post.postId, undefined, leader.token);
  await call('GET', '/posts/' + post.postId, undefined, undefined, 404);
  await call('DELETE', '/accounts/' + account.accId, undefined, admin.token);
  await call('GET', '/verify', undefined, leader.token, 401);
  await loginDenied();
  async function loginDenied() { await call('POST', '/auth/login', { username: 'r14-leader', password: 'r14-synthetic-provisioned' }, undefined, 401); }
  assert.equal((await call('GET', '/accounts/' + account.accId, undefined, admin.token)).team, null);
  checks.push('Persisted update/delete, expiry and current DB role override old JWT; deactivation denies old token/login and releases assignment');
  assert.deepEqual(await db.query('PRAGMA foreign_key_check'), []);
  return checks;
}
