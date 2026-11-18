import assert from 'node:assert/strict';
import { join } from 'node:path';

/** Focused R15 assertions; the R14 lifecycle remains the single CRUD browser journey. */
export async function coreBrowserChecks({ context, origin, demo, width, height, output }) {
  const page = await context.newPage(), errors = [], expectedErrors = [];
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(origin + '/api/') && response.status() >= 400) expectedErrors.push({ path: new URL(response.url()).pathname, status: response.status() });
  });
  const label = width + 'x' + height;
  const screenshot = name => page.screenshot({ path: join(output, 'core-' + name + '-' + label + '.png') });
  const focused = locator => locator.evaluate(element => document.activeElement === element);
  async function insideViewport(locator) {
    await locator.scrollIntoViewIfNeeded(); const bounds = await locator.boundingBox();
    assert.ok(bounds && bounds.width > 0 && bounds.height > 0 && bounds.x >= -1 && bounds.x + bounds.width <= width + 1, 'content/control clipped horizontally');
  }
  async function tabTo(locator) {
    for (let count = 0; count < 20 && !await focused(locator); count++) await page.keyboard.press('Tab');
    assert.equal(await focused(locator), true, 'control reachable by Tab inside modal');
  }
  try {
    await page.goto(origin + '/');
    await page.getByRole('heading', { name: 'UITVolunteer — Các chiến dịch tình nguyện', exact: true }).waitFor();
    const carousel = page.getByRole('region', { name: 'Ảnh hoạt động tình nguyện' });
    await carousel.getByRole('img', { name: 'Ảnh hoạt động tình nguyện 1', exact: true }).evaluate(image => {
      if (image.complete) { if (!image.naturalWidth) throw Error('Packaged homepage photo unavailable'); return; }
      return new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
    });
    assert.equal(await page.getByRole('button', { name: 'Bắt đầu trình chiếu', exact: true }).getAttribute('aria-pressed'), 'false');
    const next = carousel.getByRole('button', { name: 'Ảnh tiếp theo', exact: true });
    await next.focus(); await page.keyboard.press('Enter');
    assert.equal(await carousel.getByRole('button', { name: 'Xem ảnh 2', exact: true }).getAttribute('aria-pressed'), 'true');
    await insideViewport(next);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'homepage horizontal overflow');
    await screenshot('homepage');
    await page.getByRole('link', { name: 'Các chiến dịch tình nguyện', exact: true }).focus(); await page.keyboard.press('Enter');
    await page.waitForURL('**/#campaigns');
    await page.waitForFunction(() => document.activeElement?.id === 'campaigns');
    await page.getByRole('link', { name: /\[DEMO\] Chiến dịch tình nguyện UIT/ }).focus(); await page.keyboard.press('Enter');
    const campaignHeading = page.getByRole('heading', { name: '[DEMO] Chiến dịch tình nguyện UIT', exact: true });
    await campaignHeading.waitFor();
    await page.waitForFunction(() => document.activeElement?.tagName === 'H1');
    const metrics = page.locator('dl[aria-label="Thống kê chiến dịch"]');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('dl[aria-label="Thống kê chiến dịch"] dd')).map(element => element.textContent).join(',') === '2,1,2');
    assert.deepEqual(await metrics.locator('dd').allTextContents(), ['2','1','2']);
    assert.equal(await page.getByRole('combobox').count(), 0, 'no inert year selector');
    for (const item of await metrics.locator('dt,dd').all()) await insideViewport(item);
    await screenshot('campaign-metrics');
    const teamLink = page.getByRole('link', { name: 'Xem thêm', exact: true }).first();
    await teamLink.focus(); await insideViewport(teamLink); await screenshot('campaign-team-link');
    await page.keyboard.press('Enter'); await page.getByRole('heading', { name: '[DEMO] Đội hình kết nối cộng đồng', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Các chiến dịch tình nguyện', exact: true }).focus(); await page.keyboard.press('Enter');
    await page.waitForURL('**/#campaigns'); await page.waitForFunction(() => document.activeElement?.id === 'campaigns');
    // Login credential rejection is real, expected, announced and retains the entered username.
    await page.goto(origin + '/login');
    const username = page.getByLabel('Tên đăng nhập', { exact: true }), password = page.getByLabel('Mật khẩu', { exact: true });
    assert.equal(await username.getAttribute('autocomplete'), 'username'); assert.equal(await password.getAttribute('autocomplete'), 'current-password');
    await username.focus(); await username.fill('demo-leader'); await page.keyboard.press('Tab');
    assert.equal(await focused(password), true); await password.fill('r15-intentionally-wrong'); await page.keyboard.press('Enter');
    await page.getByRole('alert').waitFor(); assert.equal(await username.inputValue(), 'demo-leader');
    await password.fill('r14-synthetic-leader'); await password.press('Enter'); await page.waitForURL('**/leader');
    const heading = page.getByRole('heading', { name: '[DEMO] Đội hình kết nối cộng đồng', exact: true });
    await heading.waitFor(); await page.waitForFunction(() => document.activeElement?.tagName === 'H1');
    const trigger = page.getByRole('button', { name: 'Xin chào!', exact: true });
    await trigger.focus(); await page.keyboard.press('Enter');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    const logout = page.getByRole('button', { name: 'Đăng xuất', exact: true });
    assert.equal(await focused(logout), true); await page.keyboard.press('Escape');
    assert.equal(await focused(trigger), true); assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'Đăng xuất');
    await page.keyboard.press('Enter');
    const confirmation = page.getByRole('dialog', { name: 'Đăng xuất', exact: true });
    await confirmation.waitFor(); await insideViewport(confirmation);
    const cancel = confirmation.getByRole('button', { name: 'Không', exact: true });
    assert.equal(await focused(cancel), true, 'safe initial focus');
    await page.keyboard.press('Tab'); assert.equal(await focused(confirmation.getByRole('button', { name: 'Đóng', exact: true })), true);
    await page.keyboard.press('Shift+Tab'); assert.equal(await focused(cancel), true, 'modal tab loop');
    await screenshot('logout-dialog'); await page.keyboard.press('Escape'); await confirmation.waitFor({ state: 'detached' });
    assert.equal(await focused(trigger), true, 'Escape restores mounted opener');
    const edit = page.getByRole('button', { name: 'Chỉnh sửa đội hình', exact: true });
    await edit.focus(); await page.keyboard.press('Enter');
    const editor = page.getByRole('dialog', { name: 'Chỉnh sửa đội hình', exact: true });
    await editor.waitFor(); await insideViewport(editor);
    const teamName = editor.getByLabel('Tên đội hình', { exact: true }); await tabTo(teamName); await insideViewport(teamName);
    await page.keyboard.press('Escape'); await editor.waitFor({ state: 'detached' }); assert.equal(await focused(edit), true);
    await page.getByRole('link', { name: 'Tạo bài đăng', exact: true }).focus(); await page.keyboard.press('Enter');
    const media = page.getByRole('dialog', { name: 'Ảnh bài đăng', exact: true }); await media.waitFor(); await insideViewport(media);
    const files = media.getByLabel('Thêm ảnh', { exact: true }); await tabTo(files);
    await files.setInputFiles({ name: 'invalid-r15.txt', mimeType: 'text/plain', buffer: Buffer.from('Synthetic invalid image; no provider request') });
    await media.getByRole('alert').waitFor(); await insideViewport(media.getByRole('button', { name: 'Tiếp tục', exact: true }));
    await screenshot('media-validation'); await page.keyboard.press('Escape'); await page.waitForURL('**/leader');
    await heading.waitFor();
    await page.waitForFunction(() => document.activeElement?.tagName === 'H1');
    await page.getByRole('button', { name: 'Xin chào!', exact: true }).focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'Đăng xuất');
    await page.keyboard.press('Enter');
    const finalConfirm = page.getByRole('dialog', { name: 'Đăng xuất', exact: true }); await finalConfirm.waitFor();
    await page.keyboard.press('Shift+Tab'); assert.equal(await focused(finalConfirm.getByRole('button', { name: 'Có', exact: true })), true);
    await page.keyboard.press('Enter'); await page.waitForURL('**/login');
    assert.equal(await page.evaluate(() => localStorage.getItem('auth_token') === null && localStorage.getItem('auth_user') === null), true);
    assert.deepEqual(expectedErrors, [{ path: '/api/auth/login', status: 401 }]); assert.deepEqual(errors, []);
    return { width, height, passed: true, checks: ['packaged homepage artwork, stationary carousel and keyboard controls', 'API counts 2 posts / 1 team / 2 map points; no year selector', 'route heading focus and real announced credential error', 'Leader disclosure Escape/focus, native logout safe focus/tab loop/return', 'team editor labels, Tab reach and Escape return', 'media file validation announced without upload; keyboard-only logout'], expectedApiErrors: expectedErrors, uncaughtErrors: errors };
  } catch (error) {
    error.message += '\nFocused element: ' + await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim().slice(0,120), expanded: document.querySelector('[aria-controls]')?.getAttribute('aria-expanded') })).then(JSON.stringify);
    await screenshot('failure').catch(() => undefined); throw error;
  }
  finally { await page.close(); }
}
