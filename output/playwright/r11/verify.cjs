async page => {
 const origin='http://127.0.0.1:3017',results=[],errors=[],failures=[];
 const assert=(value,message)=>{if(!value)throw Error(message)};
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.url().includes(':5017/api/')&&response.status()>=400)failures.push({status:response.status(),url:response.url()})});
 async function login(username,password,path) {
  await page.goto(origin+'/login');await page.getByLabel('Tên đăng nhập',{exact:true}).fill(username);await page.getByLabel('Mật khẩu',{exact:true}).fill(password);
  await page.getByRole('button',{name:'ĐĂNG NHẬP',exact:true}).click();await page.waitForURL('**/'+path);
 }
 for(const [width,height] of [[375,667],[1440,900]]) {
  const label=width+'x'+height;
  await page.setViewportSize({width,height});
  await page.goto(origin+'/campaign/1/team/1');
  await page.getByRole('heading',{name:'[DEMO] Đội hình kết nối cộng đồng',exact:true}).waitFor();
  await page.getByRole('link',{name:'Xem bài đăng: [DEMO] Ngày hội sẻ chia',exact:true}).waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'seeded Guest page has no overflow');
  assert(await page.getByRole('img',{name:'[DEMO] Đội hình kết nối cộng đồng — ảnh 1',exact:true}).evaluate(image=>image.complete&&image.naturalWidth>0),'packaged demo image is visible');
  await page.screenshot({path:'output/playwright/r11/guest-team-'+label+'.png',fullPage:true});
  await page.getByRole('link',{name:'Xem bài đăng: [DEMO] Ngày hội sẻ chia',exact:true}).click();
  await page.getByRole('heading',{name:'[DEMO] Ngày hội sẻ chia',exact:true}).waitFor();
  assert(await page.getByRole('img',{name:'[DEMO] Ngày hội sẻ chia — ảnh 1',exact:true}).evaluate(image=>image.complete&&image.naturalWidth>0),'seeded photo detail visible');
  await login('demo-leader','r11-synthetic-leader','leader');
  await page.getByRole('heading',{name:'[DEMO] Đội hình kết nối cộng đồng',exact:true}).waitFor();
  await page.screenshot({path:'output/playwright/r11/leader-demo-'+label+'.png',fullPage:true});
  await page.getByRole('link',{name:'Tạo bài đăng',exact:true}).click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  const title='[DEMO] Bài đăng từ seed '+label;
  await page.getByLabel('Tiêu đề',{exact:true}).fill(title);await page.getByRole('textbox',{name:'Nội dung',exact:true}).fill('Kiểm tra tài khoản và profile đã seed bằng API thật.');
  await page.getByRole('button',{name:'Đăng bài',exact:true}).click();await page.getByRole('heading',{name:title,exact:true}).waitFor();
  await page.reload();await page.getByRole('heading',{name:title,exact:true}).waitFor();await page.getByText('[DEMO] Chỉ huy',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Xin chào!',exact:true}).click();await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();await page.getByRole('button',{name:'Có',exact:true}).click();await page.waitForURL('**/login');
  await login('demo-admin','r11-synthetic-admin','admin/dashboard');
  await page.getByRole('link',{name:'Quản lý Chỉ huy',exact:true}).click();
  await page.getByRole('row',{name:'Tài khoản demo-leader',exact:true}).waitFor();
  assert(await page.getByRole('columnheader',{name:'Mật khẩu',exact:true}).count()===0,'seed credentials are not displayed as a stored password column');
  await page.screenshot({path:'output/playwright/r11/admin-demo-'+label+'.png',fullPage:true});
  await page.getByRole('link',{name:'Quản lý Đội hình',exact:true}).click();await page.getByRole('button',{name:'Sửa đội hình: [DEMO] Đội hình kết nối cộng đồng',exact:true}).waitFor();
  await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();await page.waitForURL('**/login');
  results.push({width,height,passed:true,check:'Guest reads packaged seed photos; demo Leader logs in, resolves team, creates a real post with server-derived profile and reloads it; demo Admin reads identified accounts/team; both log out'});
 }
 assert(errors.length===0,'no uncaught app errors');assert(failures.length===0,'no failed application API requests');
 return {results,uncaughtAppErrors:errors,apiFailures:failures,fixture:'Actual 15 migrations and application demo.seed function; no app API/provider response mocks; synthetic credentials only'};
}
