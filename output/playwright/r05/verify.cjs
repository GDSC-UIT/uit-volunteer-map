async page => {
 const results=[], requests=[];
 const origin='http://127.0.0.1:3017';
 const assert=(ok,message)=>{if(!ok)throw Error(message)};
 page.on('request',req=>{if(req.url().includes(':5017/api/'))requests.push(req.url());});
 await page.evaluate(()=>localStorage.clear());
 for(const [width,height] of [[375,900],[768,900],[1024,900],[1440,900],[375,667]]) {
  await page.setViewportSize({width,height});await page.goto(origin);
  const entry=page.getByRole('link',{name:/Chiến dịch kiểm thử A/});await entry.waitFor();
  await page.locator('#campaigns').screenshot({path:`output/playwright/r05/home-live-${width}x${height}.png`});
  await entry.click();await page.waitForURL('**/campaign/501');
  await page.getByRole('heading',{name:'Chiến dịch kiểm thử A',exact:true}).waitFor();
  await page.getByRole('link',{name:'Xem bài đăng: Bài SQLite A thứ hai',exact:true}).waitFor();
  assert(await page.getByRole('link',{name:'Xem bài đăng: Bài SQLite B',exact:true}).count()===0,'campaign isolation');
  assert(await page.getByText('Mô tả thực từ SQLite A',{exact:true}).count()===1,'real campaign description');
  await page.getByRole('link',{name:'Xem thêm',exact:true}).click();await page.waitForURL('**/campaign/501/team/510');
  await page.getByRole('heading',{name:'Đội hình SQLite A',exact:true}).waitFor();
  const second=page.getByRole('link',{name:'Xem bài đăng: Bài SQLite A thứ hai',exact:true});await second.waitFor();
  await second.click();await page.waitForURL('**/team/510/post/5102');
  await page.getByRole('heading',{name:'Bài SQLite A thứ hai',exact:true}).waitFor();
  assert(await page.getByText('Nội dung chính xác của bài thứ hai thuộc A',{exact:true}).count()===1,'selected second post content');
  await page.getByRole('button',{name:'Ảnh tiếp theo',exact:true}).click();
  assert((await page.getByRole('img',{name:'Bài SQLite A thứ hai — ảnh 2',exact:true}).getAttribute('src')).includes('mhx.png'),'ordered second photo');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'detail page width');
  await page.screenshot({path:`output/playwright/r05/detail-live-${width}x${height}.png`,fullPage:true});
  await page.reload();await page.getByRole('heading',{name:'Bài SQLite A thứ hai',exact:true}).waitFor();
  await page.getByRole('button',{name:'Quay lại danh sách',exact:true}).click();await page.waitForURL('**/campaign/501/team/510');
  await page.goto(`${origin}/campaign/501/post/5102`);await page.getByRole('heading',{name:'Bài SQLite A thứ hai',exact:true}).waitFor();
  await page.getByRole('button',{name:'Quay lại danh sách',exact:true}).click();await page.waitForURL('**/campaign/501');
  await page.goto(`${origin}/campaign/502`);await page.getByRole('link',{name:'Xem bài đăng: Bài SQLite B',exact:true}).waitFor();
  assert(await page.getByRole('link',{name:'Xem bài đăng: Bài SQLite A thứ hai',exact:true}).count()===0,'second campaign cache isolation');
  results.push({width,height,passed:true,check:'live migrated SQLite Home -> campaign -> team -> selected second post, gallery, reload, close/direct-link fallback and campaign isolation'});
 }
 for(const path of ['/campaign/502/post/5102','/campaign/502/team/510','/campaign/501/post/99999','/campaign/xtn']) {
  await page.goto(origin+path);await page.getByRole('alert').waitFor();assert((await page.getByRole('alert').textContent()).includes('Không tìm thấy'),'404/context guard '+path);
 }
 await page.goto(`${origin}/campaign/503`);await page.getByText('Chưa có đội hình.',{exact:true}).waitFor();await page.getByText('Chưa có bài đăng.',{exact:true}).waitFor();
 await page.screenshot({path:'output/playwright/r05/empty-live-375x667.png',fullPage:true});
 results.push({passed:true,check:'live empty parent, missing post, invalid route IDs and wrong campaign/team context'});
 // Error and loading states below deliberately simulate transport faults only.
 await page.route('**/api/campaigns/501',route=>route.fulfill({status:500,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"success":false,"error":"Simulated transport error"}'}));
 await page.goto(`${origin}/campaign/501`);await page.getByRole('button',{name:'Thử lại chiến dịch',exact:true}).waitFor();
 await page.screenshot({path:'output/playwright/r05/error-simulated-375x667.png'});
 await page.unroute('**/api/campaigns/501');await page.getByRole('button',{name:'Thử lại chiến dịch',exact:true}).click();await page.getByRole('heading',{name:'Chiến dịch kiểm thử A',exact:true}).waitFor();
 results.push({passed:true,check:'simulated server error announces retry; retry recovers using live API'});
 assert(requests.some(url=>url.includes('/teams?campaignId=501')),'campaign team filter sent');
 assert(requests.some(url=>url.includes('/posts?teamId=510&campaignId=501')),'team and campaign post filters sent');
 return {results,apiRequests:requests};
}