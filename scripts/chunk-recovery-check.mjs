import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export async function chunkRecoveryCheck({ browser, origin, demo, output, dist }) {
  const chunk = readdirSync(join(dist, 'assets')).find(file => /^CampaignPage-.*\.js$/.test(file));
  assert.ok(chunk, 'Campaign page must have its own lazy JS chunk');
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await context.newPage(), requests = [], errors = [], apiFailures = [];
  let block = false, blocked = 0;
  page.setDefaultTimeout(12000);
  page.on('request', request => { if (request.resourceType() === 'script') requests.push(new URL(request.url()).pathname); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(origin + '/api/') && response.status() >= 400) apiFailures.push(response.status()); });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(url.origin)) return route.abort();
    assert.equal(url.origin, origin, 'Unexpected external request');
    if (block && url.pathname.endsWith('/' + chunk)) { blocked++; return route.abort('failed'); }
    return route.continue();
  });
  try {
    await page.goto(origin + '/');
    await page.getByRole('heading', { name: 'UITVolunteer — Các chiến dịch tình nguyện', exact: true }).waitFor();
    assert.equal(requests.some(path => /CampaignPage-|AccountManagementPage-|PostEditorPage-/.test(path)), false, 'Cold homepage eagerly loaded feature pages');
    const coldScripts = [...requests];
    block = true; await page.goto(`${origin}/campaign/${demo.campaignId}`);
    const errorHeading = page.getByRole('heading', { name: 'Không thể tải trang', exact: true });
    await errorHeading.waitFor(); assert.ok(blocked > 0);
    await page.waitForFunction(() => document.activeElement?.tagName === 'H1');
    assert.equal(/TypeError|at .*\.js:\d+/.test(await page.locator('body').innerText()), false, 'Internal stack leaked to UI');
    await page.screenshot({ path: join(output, 'chunk-error-375x667.png') });
    block = false;
    const recovered = page.waitForResponse(response => response.url().endsWith('/' + chunk) && response.status() === 200);
    await page.getByRole('button', { name: 'Tải lại trang', exact: true }).click(); await recovered;
    await page.getByRole('heading', { name: '[DEMO] Chiến dịch tình nguyện UIT', exact: true }).waitFor();
    assert.deepEqual(apiFailures, []); assert.deepEqual(errors, []);
    return { passed: true, coldHomepageScripts: coldScripts, campaignChunk: chunk, blockedAssetRequests: blocked, accessibleErrorAndReloadRecovery: true, apiFailures, uncaughtErrors: errors };
  } finally { await context.close(); }
}
