async (page) => {
  const origin = 'http://127.0.0.1:3013';
  const results = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const fits = async (selector) => page.locator(selector).evaluateAll(elements => elements.every(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.left >= -1 && r.right <= innerWidth + 1;
  }));
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/login`);
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill('layout-check');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('synthetic-input');
    await page.getByLabel('Tên đăng nhập', { exact: true }).focus();
    await page.keyboard.press('Tab');
    assert(await page.getByLabel('Mật khẩu', { exact: true }).evaluate(el => el === document.activeElement), `password tab order ${width}`);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    assert(await page.getByLabel('Mật khẩu', { exact: true }).getAttribute('type') === 'text', `password toggle ${width}`);
    assert(await fits('form, form input, form button'), `login control bounds ${width}`);
    const focus = await page.evaluate(() => getComputedStyle(document.activeElement).outlineWidth);
    assert(parseFloat(focus) > 0, `visible toggle focus ${width}`);
    results.push({ width, check: 'login labels, tab order, keyboard reveal, focus and bounds', passed: true });

    await page.goto(`${origin}/campaign/xtn`);
    assert(await fits('header a'), `campaign header bounds ${width}`);
    const overlaps = await page.locator('header a').evaluateAll(elements => elements.some((a, i) => elements.some((b, j) => {
      if (i >= j) return false;
      const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
      return Math.min(x.right, y.right) > Math.max(x.left, y.left) && Math.min(x.bottom, y.bottom) > Math.max(x.top, y.top);
    })));
    assert(!overlaps, `campaign header overlap ${width}`);
    for (const [label, id] of [['Thông tin', 'info'], ['Đội hình', 'teams'], ['Hoạt động', 'activities']]) {
      await page.locator('header').getByRole('link', { name: label, exact: true }).click();
      await page.waitForFunction(id => {
        const top = document.getElementById(id).getBoundingClientRect().top;
        const height = document.querySelector('header').getBoundingClientRect().height;
        return top >= height - 2 && top <= height + 20;
      }, id, { timeout: 5000 });
      await page.goto(`${origin}/campaign/xtn/team/1`);
      await page.locator('header').getByRole('link', { name: label, exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.waitForURL(`${origin}/campaign/xtn#${id}`);
      await page.waitForFunction(id => {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        const height = document.querySelector('header').getBoundingClientRect().height;
        return top >= height - 2 && top <= height + 20;
      }, id, { timeout: 5000 });
    }
    results.push({ width, check: 'nonoverlapping header; all three local and Team-to-campaign anchors; keyboard activation; sticky offset', passed: true });

    await page.goto(`${origin}/`);
    assert(await fits('header a, footer a, footer span'), `public header/footer bounds ${width}`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Home horizontal overflow ${width}`);
    await page.locator('header').getByRole('link', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL(`${origin}/login`);
    results.push({ width, check: 'public header login navigation; Home/footer no horizontal overflow', passed: true });

    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'invalid-local-ui-layout-only');
      localStorage.setItem('auth_user', JSON.stringify({ id: 0, username: 'layout-only', role: 'admin' }));
    });
    for (const route of ['campaigns', 'teams', 'accounts']) {
      await page.goto(`${origin}/admin/${route}`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `admin document overflow ${route} ${width}`);
      assert(await fits('main, aside, aside a, main button, main input'), `admin controls ${route} ${width}`);
      const main = await page.locator('main').evaluate(el => ({ width: el.getBoundingClientRect().width, scroll: el.scrollWidth, client: el.clientWidth }));
      assert(main.width >= 300, `admin usable content width ${route} ${width}`);
      assert(main.scroll <= main.client + 1, `admin main horizontal overflow ${route} ${width}`);
      if (route === 'accounts' && width === 375) {
        const region = page.getByRole('region', { name: 'Danh sách tài khoản' });
        await region.focus();
        for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
        await page.waitForFunction(() => document.querySelector('[aria-label="Danh sách tài khoản"]').scrollLeft > 0);
      }
      results.push({ width, check: `admin ${route} shell/controls fit; main width ${main.width}px; account grid scroll is local`, passed: true });
    }
    await page.evaluate(() => localStorage.clear());
  }
  await page.goto(`${origin}/login`);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.getByLabel('Tên đăng nhập', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  assert(await fits('form input, form button'), 'short viewport login bounds');
  await page.screenshot({ path: 'output/playwright/ux-responsive-foundations/after-login-375x667.png' });
  results.push({ width: 375, height: 667, check: 'short viewport login keyboard access and bounds', passed: true });
  return results;
}
