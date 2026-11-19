async (page) => {
  const origin = 'http://127.0.0.1:3014';
  const output = 'output/playwright/ux-shared-accessibility';
  const results = [];
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  await page.unroute('**/api/**');
  await page.route(`${origin}/api/**`, route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Browser validation: backend disabled"}' }));
  await page.route('**/api.cloudinary.com/**', route => route.abort());
  const inside = () => page.evaluate(() => !!document.querySelector('dialog[open]')?.contains(document.activeElement));
  const verifyDialog = async (name) => {
    const dialog = page.getByRole('dialog', { name, exact: true });
    await dialog.waitFor();
    assert(await inside(), `${name}: initial focus`);
    const geometry = await dialog.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, fits: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, horizontalOverflow: el.scrollWidth > el.clientWidth + 1 };
    });
    assert(geometry.fits && !geometry.horizontalOverflow, `${name}: bounds ${JSON.stringify(geometry)}`);
    for (let i = 0; i < 15; i++) { await page.keyboard.press('Tab'); assert(await inside(), `${name}: Tab containment`); }
    for (let i = 0; i < 5; i++) { await page.keyboard.press('Shift+Tab'); assert(await inside(), `${name}: reverse Tab containment`); }
    assert(await page.evaluate(() => document.body.style.overflow === 'hidden'), `${name}: scroll locked`);
    await page.evaluate(() => document.querySelector('main button')?.focus());
    assert(await inside(), `${name}: background inert`);
    return geometry;
  };
  for (const [width,height] of [[375,900],[768,900],[1024,900],[1440,900],[375,667],[375,400]]) {
    await page.setViewportSize({width,height});
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${origin}/login`);
    assert(await page.locator('html').getAttribute('lang') === 'vi', 'Vietnamese language');
    const username = page.getByRole('textbox', { name: 'Tên đăng nhập' });
    await username.fill('synthetic-user');
    await page.getByLabel('Mật khẩu', {exact:true}).fill('synthetic-password');
    assert(await username.getAttribute('autocomplete') === 'username', 'username autocomplete');
    assert(await page.getByLabel('Mật khẩu', {exact:true}).getAttribute('autocomplete') === 'current-password', 'password autocomplete');
    await username.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Space');
    assert(await page.getByLabel('Mật khẩu', {exact:true}).getAttribute('type') === 'text', 'keyboard password reveal');
    await page.getByRole('button', {name:'ĐĂNG NHẬP',exact:true}).click();
    await page.getByRole('alert').waitFor();
    assert(await username.getAttribute('aria-describedby') === 'login-error', 'associated login error');
    await page.screenshot({path:`${output}/login-simulated-error-${width}x${height}.png`});
    results.push({width,height,check:'login labels, autocomplete, keyboard, associated simulated error',passed:true});
    await page.evaluate(() => { localStorage.setItem('auth_token','invalid-ui-test-token'); localStorage.setItem('auth_user', JSON.stringify({id:'synthetic-leader',username:'Accessibility test',role:'leader'})); });
    await page.goto(`${origin}/leader`);
    const cases = [
      ['Chỉnh sửa thông tin đội hình','Chỉnh sửa thông tin đội hình','formation'],
      ['Chỉnh sửa ban chỉ huy 1','Chỉnh sửa ban chỉ huy','commander'],
      ['Xóa bài đăng 1','Xóa bài đăng','delete'],
      ['+ Tạo bài đăng','Tạo bài viết — chọn ảnh','picker-select'],
    ];
    for (const [triggerName, title, slug] of cases) {
      const trigger = page.getByRole('button',{name:triggerName,exact:true});
      await trigger.focus(); await page.keyboard.press('Enter');
      if(slug === 'delete') assert(await page.getByRole('button',{name:'Hủy',exact:true}).evaluate(el=>el===document.activeElement),'safe delete focus');
      const geometry = await verifyDialog(title);
      await page.getByRole('dialog',{name:title,exact:true}).evaluate(el=>el.scrollTop=0);
      await page.screenshot({path:`${output}/${slug}-synthetic-${width}x${height}.png`});
      await page.keyboard.press('Escape');
      assert(await trigger.evaluate(el=>el===document.activeElement),`${slug}: focus restored`);
      assert(await page.locator('dialog[open]').count() === 0,`${slug}: escaped`);
      results.push({width,height,check:slug+' focus, trapping, inertness, escape, restore and bounds',geometry,passed:true});
    }
    await page.getByRole('button',{name:'Xin chào!'}).click();
    await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();
    await verifyDialog('Đăng xuất');
    await page.keyboard.press('Escape');
    assert(await page.getByRole('button',{name:'Xin chào!'}).evaluate(el=>el===document.activeElement),'logout focus restoration');
    results.push({width,height,check:'logout safe dialog and focus restore (no logout submitted)',passed:true});
    await page.getByRole('button',{name:'+ Tạo bài đăng',exact:true}).click();
    await page.locator('input[type=file]').setInputFiles([1,2,3,4,5].map(i=>`${output}/fixture-${i}.svg`));
    assert(await inside(),'focus after selecting files');
    for (let i = 1; i <= 4; i++) { await page.getByRole('button',{name:`fixture-${i}.svg`,exact:true}).focus(); await page.keyboard.press('Space'); }
    await page.getByRole('button',{name:'fixture-5.svg',exact:true}).click();
    assert((await page.getByRole('alert').textContent()).includes('tối đa 4'),'selection limit feedback');
    assert(await page.getByRole('button',{name:'fixture-1.svg, thứ tự 1',exact:true}).getAttribute('aria-pressed')==='true','pressed state');
    await verifyDialog('Tạo bài viết — chọn ảnh');
    await page.screenshot({path:`${output}/picker-limit-synthetic-${width}x${height}.png`});
    await page.getByRole('button',{name:'Quay lại',exact:true}).click(); assert(await inside(),'focus on Back');
    await page.getByRole('button',{name:'Tiếp tục chọn ảnh',exact:true}).click(); assert(await inside(),'focus on continue');
    assert(await page.getByRole('button',{name:'fixture-1.svg, thứ tự 1',exact:true}).getAttribute('aria-pressed')==='true','selection retained');
    await page.keyboard.press('Escape');
    results.push({width,height,check:'keyboard image selection, count, limit, Back retention and step focus',passed:true});
  }
  return results;
}
