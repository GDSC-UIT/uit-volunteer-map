import assert from 'node:assert/strict';
import { join } from 'node:path';

export async function releaseBrowserChecks({ context, origin, demo, width, height, output }) {
  const page = await context.newPage(), errors = [], failures = [], external = [], blockedFonts = new Set();
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(origin + '/api/') && response.status() >= 400) failures.push({ status: response.status(), path: new URL(response.url()).pathname }); });
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(origin + '/') || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    // Existing optional web fonts must not make the offline functional gate network-dependent.
    if (['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(new URL(url).origin) && ['stylesheet','font'].includes(route.request().resourceType())) {
      blockedFonts.add(new URL(url).origin); return route.abort();
    }
    external.push(new URL(url).origin); return route.abort();
  });
  const label = width + 'x' + height;
  const screenshot = name => page.screenshot({ path: join(output, name + '-' + label + '.png'), fullPage: true });
  async function mutation(path, action, status) {
    const pending = page.waitForResponse(response => new URL(response.url()).pathname === '/api' + path && ['POST','PUT','DELETE'].includes(response.request().method()));
    await action(); const response = await pending;
    assert.equal(response.status(), status, 'UI mutation ' + path);
    return (await response.json()).data;
  }
  async function login(username, password, target) {
    await page.goto(origin + '/login');
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'ĐĂNG NHẬP', exact: true }).click();
    await page.waitForURL('**/' + target);
  }
  async function logout(leader = false) {
    if (leader) {
      await page.getByRole('button', { name: 'Xin chào!', exact: true }).click();
      await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
      await page.getByRole('button', { name: 'Có', exact: true }).click();
    } else await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await page.waitForURL('**/login');
    assert.equal(await page.evaluate(() => localStorage.getItem('auth_token') === null && localStorage.getItem('auth_user') === null), true);
  }
  try {
    await page.goto(`${origin}/campaign/${demo.campaignId}/team/${demo.teamId}`);
    await page.getByRole('heading', { name: '[DEMO] Đội hình kết nối cộng đồng', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Xem bài đăng: [DEMO] Ngày hội sẻ chia', exact: true }).waitFor();
    await screenshot('guest-demo');
    for (const title of ['[DEMO] Ngày hội sẻ chia', '[DEMO] Đồng hành cùng địa phương']) {
      await page.goto(`${origin}/campaign/${demo.campaignId}`);
      const marker = page.getByTitle('Mở bài đăng: ' + title, { exact: true });
      await marker.focus(); await page.keyboard.press('Enter');
      await page.getByRole('heading', { name: title, exact: true }).waitFor();
      assert.equal(await page.getByRole('img', { name: title + ' — ảnh 1', exact: true }).evaluate(image => image.complete && image.naturalWidth > 0), true);
    }
    await login('demo-admin', 'r14-synthetic-admin', 'admin/dashboard');
    await page.goto(origin + '/admin/campaigns');
    await page.getByRole('button', { name: 'Thêm chiến dịch', exact: true }).click();
    const campaignName = `[R14 ${width}] Chiến dịch từ trình duyệt`;
    await page.getByLabel('Tên chiến dịch', { exact: true }).fill(campaignName);
    await page.getByLabel('Ngày bắt đầu', { exact: true }).fill('2026-01-01');
    await page.getByLabel('Ngày kết thúc', { exact: true }).fill('2026-12-31');
    const campaign = await mutation('/campaigns', () => page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click(), 201);
    await page.getByText('Đã lưu chiến dịch.', { exact: true }).waitFor();
    await page.goto(origin + '/admin/accounts');
    assert.equal(await page.getByRole('columnheader', { name: 'Mật khẩu', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Thêm tài khoản', exact: true }).click();
    const username = 'r14-browser-' + width, fullname = `[R14 ${width}] Chỉ huy kiểm thử`;
    for (const [name, value] of Object.entries({ 'Tên tài khoản': username, 'Mật khẩu': 'r14-synthetic-browser', 'Họ và tên': fullname, Email: `r14-browser-${width}@gm.uit.edu.vn`, MSSV: String(99000000 + width), 'Lớp': 'DEMO', 'Số điện thoại': '0900000000' })) await page.getByLabel(name, { exact: true }).fill(value);
    await mutation('/accounts', () => page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click(), 201);
    await page.getByRole('row', { name: 'Tài khoản ' + username, exact: true }).waitFor();
    await page.goto(`${origin}/admin/teams?campaignId=${campaign.campaignId}`);
    await page.getByRole('button', { name: 'Thêm đội hình', exact: true }).click();
    const teamName = `[R14 ${width}] Đội hình được phân công`;
    await page.getByLabel('Tên đội hình', { exact: true }).fill(teamName);
    await page.getByRole('combobox', { name: /^Chỉ huy/ }).selectOption({ label: fullname });
    const team = await mutation('/teams', () => page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click(), 201);
    await page.getByRole('heading', { name: teamName, exact: true }).waitFor(); await screenshot('admin-assignment');
    await logout();
    await login(username, 'r14-synthetic-browser', 'leader');
    await page.getByRole('heading', { name: teamName, exact: true }).waitFor();
    await page.getByRole('link', { name: 'Tạo bài đăng', exact: true }).click();
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
    const title = `[R14 ${width}] Bài đăng xuyên vai trò`, edited = title + ' đã sửa';
    await page.getByLabel('Tiêu đề', { exact: true }).fill(title);
    await page.getByRole('textbox', { name: 'Nội dung', exact: true }).fill('Nội dung tổng hợp kiểm tra Admin → Leader → Guest trên SQLite thật.');
    await page.getByLabel('Vĩ độ', { exact: true }).fill('10.8231'); await page.getByLabel('Kinh độ', { exact: true }).fill('106.6296');
    const post = await mutation('/posts', () => page.getByRole('button', { name: 'Đăng bài', exact: true }).click(), 200);
    await page.getByRole('heading', { name: title, exact: true }).waitFor();
    await page.getByRole('link', { name: 'Chỉnh sửa bài đăng', exact: true }).click();
    await page.getByLabel('Tiêu đề', { exact: true }).fill(edited);
    await mutation('/posts/' + post.postId, () => page.getByRole('button', { name: 'Lưu bài đăng', exact: true }).click(), 200);
    await page.getByRole('heading', { name: edited, exact: true }).waitFor(); await page.reload();
    await page.getByRole('heading', { name: edited, exact: true }).waitFor(); await screenshot('leader-persisted-post');
    await logout(true);
    await page.goto(`${origin}/campaign/${campaign.campaignId}/team/${team.teamId}/post/${post.postId}`); await page.reload();
    await page.getByRole('heading', { name: edited, exact: true }).waitFor(); await page.getByText(fullname, { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'Guest post viewport overflow'); await screenshot('guest-persisted-post');
    await login(username, 'r14-synthetic-browser', 'leader');
    await page.getByRole('button', { name: 'Xóa bài đăng: ' + edited, exact: true }).click();
    await mutation('/posts/' + post.postId, () => page.getByRole('button', { name: 'Có, xóa bài đăng', exact: true }).click(), 200);
    await page.getByRole('link', { name: 'Xem bài đăng: ' + edited, exact: true }).waitFor({ state: 'detached' });
    await logout(true);
    const deleted = await page.request.get(origin + '/api/posts/' + post.postId); assert.equal(deleted.status(), 404);
    assert.deepEqual(errors, [], 'Uncaught browser errors'); assert.deepEqual(failures, [], 'Unexpected application API failures'); assert.deepEqual(external, [], 'Browser attempted external requests');
    return { width, height, passed: true, checks: ['Guest demo gallery and two distinct map markers by keyboard', 'Admin creates campaign/account/assigned team in UI', 'Provisioned Leader logs in, creates and edits persisted post', 'Reload and logout isolate identity; anonymous Guest sees edited post and author', 'Leader deletes and Guest receives 404'], uncaughtErrors: errors, apiFailures: failures, externalRequests: external, blockedOptionalFontOrigins: [...blockedFonts] };
  } catch (error) { await screenshot('failure').catch(() => undefined); throw error; }
}
