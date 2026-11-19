async page => {
 const results=[];const assert=(v,m)=>{if(!v)throw Error(m)};
 const fits=async selector=>page.locator(selector).evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,text:el.textContent?.slice(0,40),left:r.left,right:r.right,width:r.width,ok:r.width>0&&r.left>=-1&&r.right<=innerWidth+1&&(el.id==='map'||el.classList.contains('leader-gallery')||el.scrollWidth<=el.clientWidth+2)}}));
 for(const [width,height] of [[375,900],[768,900],[1024,900],[1440,900],[375,667]]) {
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:3015/campaign/xtn');await page.waitForTimeout(5500);
  const selectors=['#mapSection','#map','.campaign-map-frame','.campaign-statistics','#info p','#teams h3','#teams a','#activities h3'];
  for(const selector of selectors){const bounds=await fits(selector);assert(bounds.length>0&&bounds.every(x=>x.ok),selector+JSON.stringify(bounds));}
  const map=page.locator('#map');const frame=page.locator('.campaign-map-frame');
  const art=page.locator('.campaign-map-art');assert(await art.evaluate(el=>el.complete&&el.naturalWidth>0),'frame loaded');
  const ratio=await frame.evaluate(el=>el.clientWidth/el.clientHeight);assert(Math.abs(ratio-1280/1080)<.02,'art aspect');
  const zoom=page.getByRole('button',{name:'Zoom in'});await zoom.click();
  await page.getByLabel('Năm chiến dịch').focus();await page.keyboard.press('ArrowUp');
  assert(await map.evaluate(el=>Math.abs(el.clientWidth-el.parentElement.clientWidth)<=1),'map uses parent width');
  await page.setViewportSize({width:width+20,height});await page.waitForTimeout(200);await page.setViewportSize({width,height});
  // Long Vietnamese fixture changes rendered text only; no stored data mutation.
  await page.locator('#teams h3').first().evaluate(el=>el.textContent='Đội hình Tình nguyện vì cộng đồng và những hành trình mùa xuân tại Thành phố Hồ Chí Minh');
  assert((await fits('#teams h3')).every(x=>x.ok),'long timeline heading');
  await page.goto('http://127.0.0.1:3015/campaign/xtn/team/1');await page.waitForTimeout(5500);
  for(const selector of ['main h1','main section','main img','main h3'])assert((await fits(selector)).every(x=>x.ok),'team '+selector);
  await page.locator('main h1').evaluate(el=>el.textContent='Đội hình Tình nguyện vì cộng đồng và những hành trình mùa xuân');
  assert((await fits('main h1')).every(x=>x.ok),'long team title');
  await page.evaluate(()=>{localStorage.setItem('auth_token','invalid-ui-token');localStorage.setItem('auth_user',JSON.stringify({id:'ui',role:'leader',username:'test'}));});
  await page.goto('http://127.0.0.1:3015/leader');
  for(const selector of ['.leader-gallery','.leader-gallery-main','.leader-gallery-side','main button','main a'])assert((await fits(selector)).every(x=>x.ok),'leader '+selector+JSON.stringify(await fits(selector)));
  const del=page.getByRole('button',{name:'Xóa bài đăng 1',exact:true});await del.scrollIntoViewIfNeeded();
  assert(await del.evaluate(el=>{const r=el.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el.contains(top);}), 'delete hit target');
  await del.focus();await page.keyboard.press('Enter');await page.getByRole('dialog',{name:'Xóa bài đăng',exact:true}).waitFor();await page.keyboard.press('Escape');assert(await del.evaluate(el=>el===document.activeElement),'delete restore');
  const edit=page.getByRole('button',{name:'Chỉnh sửa thông tin đội hình',exact:true});await edit.click();await page.getByRole('dialog',{name:'Chỉnh sửa thông tin đội hình',exact:true}).waitFor();await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Chỉnh sửa ban chỉ huy 1',exact:true}).click();await page.getByRole('dialog',{name:'Chỉnh sửa ban chỉ huy',exact:true}).waitFor();await page.keyboard.press('Escape');
  assert(await page.getByRole('link',{name:'Chỉnh sửa bài đăng 1',exact:true}).getAttribute('href')==='/leader/post/1','edit link preserved');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow');
  results.push({width,height,passed:true,checks:'map/frame/stats/timeline/cards bounds; loaded frame; zoom/year reachable; resize; long Vietnamese titles; team gallery/portrait bounds; leader hit targets and dialogs/focus; unchanged edit route'});
 }
 return results;
}