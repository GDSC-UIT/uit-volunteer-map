async page => {
 await page.unroute('**/data/index.json');
 const results=[], apiRequests=[], validErrors=[];
 let checkingValidFlows=true;
 const origin='http://127.0.0.1:3017';
 const assert=(condition,message)=>{if(!condition)throw Error(message)};
 page.on('request',request=>{if(request.url().includes(':5017/api/'))apiRequests.push(request.url())});
 page.on('pageerror',error=>{if(checkingValidFlows)validErrors.push(error.message)});
 page.on('console',message=>{if(checkingValidFlows&&message.type()==='error')validErrors.push(message.text())});
 async function ready() {
  await page.getByRole('button',{name:'Mở bài đăng: Bài SQLite A thứ hai',exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===1);
 }
 async function assertMapControls() {
  const map=page.getByRole('region',{name:'Bản đồ hoạt động'});
  const area=await map.boundingBox();
  assert(area.width>150&&area.height>100,'usable map area');
  for(const name of ['Zoom in','Zoom out','Mở bài đăng: Bài SQLite A thứ nhất','Mở bài đăng: Bài SQLite A thứ hai']) {
   const control=map.getByRole('button',{name,exact:true});
   const box=await control.boundingBox();
   assert(box&&box.x>=area.x-1&&box.y>=area.y-1&&box.x+box.width<=area.x+area.width+1&&box.y+box.height<=area.y+area.height+1,'unclipped control '+name);
  }
  await map.getByRole('button',{name:'Zoom in',exact:true}).click();
  await map.getByRole('button',{name:'Zoom out',exact:true}).click();
 }
 await page.goto(origin);await page.evaluate(()=>localStorage.clear());
 for(const [width,height] of [[375,900],[768,900],[1024,900],[1440,900],[375,667]]) {
  await page.setViewportSize({width,height});await page.goto(origin+'/campaign/501');await ready();
  assert(await page.getByRole('button',{name:/Mở bài đăng:/}).count()===2,'two real markers only');
  assert(await page.getByRole('button',{name:'Mở bài đăng: Bài SQLite B',exact:true}).count()===0,'no foreign campaign marker');
  assert(await page.getByRole('button',{name:'Mở bài đăng: Bài chưa có tọa độ',exact:true}).count()===0,'no fabricated unlocated marker');
  assert((await page.getByRole('status').allTextContents()).some(text=>text.includes('1 bài chưa có tọa độ hợp lệ')),'missing coordinate notice');
  await assertMapControls();
  await page.getByRole('group',{name:'Thống kê chiến dịch'}).getByText('3',{exact:true}).waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no document overflow');
  await page.screenshot({path:`output/playwright/r06/campaign-map-${width}x${height}.png`,fullPage:true});
  const second=page.getByRole('button',{name:'Mở bài đăng: Bài SQLite A thứ hai',exact:true});
  await second.focus();await page.keyboard.press('Enter');await page.waitForURL('**/campaign/501/post/5102');
  await page.getByRole('heading',{name:'Bài SQLite A thứ hai',exact:true}).waitFor();
  await page.reload();await page.getByRole('heading',{name:'Bài SQLite A thứ hai',exact:true}).waitFor();
  assert(await page.getByText('Nội dung chính xác của bài thứ hai thuộc A',{exact:true}).count()===1,'selected marker opens correct detail after reload');
  await page.getByRole('button',{name:'Quay lại danh sách',exact:true}).click();await ready();
  await page.getByRole('button',{name:'Mở bài đăng: Bài SQLite A thứ nhất',exact:true}).click();
  await page.getByRole('heading',{name:'Bài SQLite A thứ nhất',exact:true}).waitFor();
  await page.getByRole('button',{name:'Quay lại danh sách',exact:true}).click();await ready();
  await page.getByRole('button',{name:'Mở bài đăng: Bài SQLite A thứ hai',exact:true}).focus();await page.keyboard.press('Space');
  await page.getByRole('heading',{name:'Bài SQLite A thứ hai',exact:true}).waitFor();
  await page.goto(origin+'/campaign/502');
  await page.getByRole('button',{name:'Mở bài đăng: Bài SQLite B',exact:true}).waitFor();
  assert(await page.getByRole('button',{name:/Mở bài đăng:/}).count()===1,'campaign B marker isolation');
  await page.getByRole('button',{name:'Mở bài đăng: Bài SQLite B',exact:true}).click();
  await page.getByRole('heading',{name:'Bài SQLite B',exact:true}).waitFor();
  results.push({width,height,passed:true,check:'two persisted markers, correct first/second identity, Enter/Space, zoom controls inside map, reload, missing-coordinate notice and campaign isolation'});
 }
 await page.setViewportSize({width:1440,height:900});await page.goto(origin+'/campaign/501');await ready();
 for(const [width,height] of [[375,667],[1440,900]]) {
  await page.setViewportSize({width,height});
  await page.waitForFunction(()=>{
   const map=document.querySelector('.volunteer-map');if(!map)return false;
   const area=map.getBoundingClientRect();
   return [...map.querySelectorAll('.leaflet-marker-icon')].every(marker=>{
    const box=marker.getBoundingClientRect();
    return box.left>=area.left&&box.right<=area.right&&box.top>=area.top&&box.bottom<=area.bottom;
   });
  });
  await assertMapControls();
 }
 results.push({passed:true,check:'same mounted Leaflet instance resizes desktop -> mobile -> desktop with both marker boxes and zoom controls inside its bounds'});
 await page.setViewportSize({width:375,height:667});
 await page.goto(origin+'/campaign/503');
 await page.getByText('Chưa có bài đăng có tọa độ trong chiến dịch này.',{exact:true}).waitFor();
 await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===1);
 assert(await page.getByRole('button',{name:/Mở bài đăng:/}).count()===0,'empty campaign has no annotations');
 await page.screenshot({path:'output/playwright/r06/empty-map-375x667.png',fullPage:true});
 assert(validErrors.length===0,'no app/map console errors in live valid flows: '+validErrors.join('; '));
 checkingValidFlows=false;
 await page.route('**/data/index.json',route=>route.fulfill({status:404,body:'Missing test asset'}));
 await page.goto(origin+'/campaign/501');
 await page.getByRole('button',{name:'Thử tải lại nền bản đồ',exact:true}).waitFor();
 assert(await page.getByRole('button',{name:/Mở bài đăng:/}).count()===2,'boundary failure preserves real markers');
 await page.screenshot({path:'output/playwright/r06/missing-boundary-375x667.png',fullPage:true});
 await page.getByRole('button',{name:'Mở bài đăng: Bài SQLite A thứ hai',exact:true}).click();
 await page.getByRole('heading',{name:'Bài SQLite A thứ hai',exact:true}).waitFor();
 await page.getByRole('button',{name:'Quay lại danh sách',exact:true}).click();
 await page.getByRole('button',{name:'Thử tải lại nền bản đồ',exact:true}).waitFor();
 await page.unroute('**/data/index.json');await page.getByRole('button',{name:'Thử tải lại nền bản đồ',exact:true}).click();await ready();
 assert(await page.getByRole('alert').count()===0,'boundary retry recovers');
 results.push({passed:true,check:'real empty campaign; deliberately missing manifest announces error, keeps marker identity usable and retries to real packaged boundary'});
 return {results,validFlowConsoleErrors:validErrors,apiRequests};
}
