async (page) => {
  const phase = new URL(page.url()).searchParams.get('capture') || 'before';
  const root = 'output/playwright/ux-responsive-foundations';
  const origin = 'http://127.0.0.1:3013';
  const widths = [375, 768, 1024, 1440];
  const surfaces = [
    ['login', '/login'], ['home', '/'], ['campaign', '/campaign/xtn'],
    ['team', '/campaign/xtn/team/1'],
    ['admin-campaigns', '/admin/campaigns'],
    ['admin-teams', '/admin/teams'], ['admin-accounts', '/admin/accounts'],
  ];
  const results = [];
  for (const [name, route] of surfaces) {
    await page.goto(`${origin}/login`);
    await page.evaluate((admin) => {
      localStorage.clear();
      if (admin) {
        localStorage.setItem('auth_token', 'invalid-local-ui-layout-only');
        localStorage.setItem('auth_user', JSON.stringify({ id: 0, username: 'layout-only', role: 'admin' }));
      }
    }, name.startsWith('admin-'));
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${origin}${route}`);
      await page.locator(name === 'login' ? 'form' : name.startsWith('admin-') ? 'main h1' : 'header').waitFor({ state: 'attached' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${root}/${phase}-${name}-${width}.png`, animations: 'disabled' });
      const measurements = await page.evaluate(() => {
        const bounds = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
        };
        return {
          viewport: innerWidth, documentWidth: document.documentElement.scrollWidth,
          header: bounds(document.querySelector('header')),
          headerControls: [...document.querySelectorAll('header a')].map(el => ({ text: el.textContent.trim() || el.getAttribute('aria-label'), ...bounds(el) })),
          fields: [...document.querySelectorAll('form input')].map(el => ({ labels: el.labels?.length, fontSize: getComputedStyle(el).fontSize, ...bounds(el) })),
          main: bounds(document.querySelector('main')),
          footer: bounds(document.querySelector('footer')),
          footerItems: [...document.querySelectorAll('footer span, footer a')].map(bounds),
        };
      });
      results.push({ phase, surface: name, width, ...measurements });
      if (name === 'home') {
        await page.locator('footer').screenshot({ path: `${root}/${phase}-footer-${width}.png`, animations: 'disabled' });
      }
    }
  }
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${origin}/login`);
  return results;
}
