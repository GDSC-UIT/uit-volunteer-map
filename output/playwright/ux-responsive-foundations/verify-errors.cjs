async (page) => {
  const origin = 'http://127.0.0.1:3013';
  const results = [];
  await page.route('**/auth/login', route => route.fulfill({
    status: 401, contentType: 'application/json',
    body: JSON.stringify({ success: false, error: 'Kiểm tra giao diện: tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại. (Phản hồi mô phỏng)' }),
  }));
  try {
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${origin}/login`);
      await page.getByLabel('Tên đăng nhập', { exact: true }).fill('layout-only');
      await page.getByLabel('Mật khẩu', { exact: true }).fill('not-a-real-password');
      await page.getByRole('button', { name: 'ĐĂNG NHẬP', exact: true }).click();
      await page.getByRole('alert').waitFor();
      const bounds = await page.evaluate(() => ({
        errorBottom: document.querySelector('[role="alert"]').getBoundingClientRect().bottom,
        inputTop: document.querySelector('input').getBoundingClientRect().top,
        documentWidth: document.documentElement.scrollWidth, viewport: innerWidth,
      }));
      if (bounds.errorBottom >= bounds.inputTop || bounds.documentWidth > width) throw new Error(`Login error overlaps/overflows at ${width}`);
      if (await page.getByLabel('Tên đăng nhập', { exact: true }).inputValue() !== 'layout-only') throw new Error('Input lost on simulated error');
      await page.screenshot({ path: `output/playwright/ux-responsive-foundations/after-login-error-simulated-${width}.png` });
      results.push({ width, check: 'simulated long 401 error reflows above fields; input retained; no horizontal overflow', passed: true, simulated: true, ...bounds });
    }
  } finally {
    await page.unroute('**/auth/login');
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.evaluate(() => {
    localStorage.setItem('auth_token', 'invalid-local-ui-layout-only');
    localStorage.setItem('auth_user', JSON.stringify({ id: 0, username: 'layout-only', role: 'admin' }));
  });
  await page.goto(`${origin}/admin/accounts`);
  await page.screenshot({ path: 'output/playwright/ux-responsive-foundations/after-admin-accounts-375.png' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${origin}/login`);
  return results;
}
