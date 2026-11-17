async page => {
 const origin='http://127.0.0.1:3017',results=[],requests=[],apiFailures=[],pageErrors=[];
 const assert=(condition,message)=>{if(!condition)throw Error(message)};
 const watch=(target,actor)=>{
  target.on('request',request=>{if(request.url().includes(':5017/api/'))requests.push({actor,method:request.method(),url:request.url()})});
  target.on('response',response=>{if(response.url().includes(':5017/api/')&&response.status()>=400)apiFailures.push({actor,status:response.status(),url:response.url()})});
  target.on('pageerror',error=>pageErrors.push({actor,message:error.message}));
 };
 async function login(target,username,password){
  await target.getByLabel('Tên đăng nhập',{exact:true}).fill(username);await target.getByLabel('Mật khẩu',{exact:true}).fill(password);
  const response=target.waitForResponse(item=>item.url().endsWith('/api/auth/login')&&item.request().method()==='POST');
  await target.getByRole('button',{name:'ĐĂNG NHẬP',exact:true}).click();return (await response).status();
 }
 async function ownTeam(target){
  return target.evaluate(async()=>{
   const {default:client}=await import('/src/api/client.ts');
   try {const result=await client.get('/leader/team');return {status:result.status,teamId:result.data.data.teamId,credentialSent:typeof result.config.headers.Authorization==='string'};}
   catch(error){return {status:error.response?.status ?? 0,credentialSent:typeof error.config?.headers?.Authorization==='string'};}
  });
 }
 watch(page,'admin');await page.goto(origin);await page.evaluate(()=>localStorage.clear());await page.goto(origin+'/login');
 assert(await login(page,'r07-admin','r07-local-only')===200,'real Admin login');await page.waitForURL('**/admin/dashboard');
 const browser=page.context().browser();assert(browser,'isolated Leader context support');
 for(const [width,height] of [[375,900],[768,900],[1024,900],[1440,900],[375,667]]) {
  const label=`${width}x${height}`,username=`r08-leader-${width}-${height}`,email=`fixture-r08-${width}-${height}@gm.uit.edu.vn`;
  const password='r08-initial-local-only',nextPassword='r08-updated-local-only',fullName=`Chỉ huy R08 ${label}`,updatedName=fullName+' đã sửa',teamName=`Đội hình R08 ${label}`;
  await page.setViewportSize({width,height});await page.goto(origin+'/admin/accounts');await page.getByRole('button',{name:'Thêm tài khoản',exact:true}).click();
  assert(await page.getByLabel('Tên tài khoản',{exact:true}).evaluate(element=>document.activeElement===element),'create form focuses username');
  await page.getByLabel('Tên tài khoản',{exact:true}).fill('r07-leader-101');await page.getByLabel('Mật khẩu',{exact:true}).fill(password);
  assert(await page.getByLabel('Mật khẩu',{exact:true}).getAttribute('type')==='password','credential input is masked');
  await page.getByLabel('Họ và tên',{exact:true}).fill(fullName);await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('MSSV',{exact:true}).fill('99000001');await page.getByLabel('Lớp',{exact:true}).fill('SE.01');await page.getByLabel('Số điện thoại',{exact:true}).fill('0900000000');
  await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await page.getByRole('alert').filter({hasText:'Tên tài khoản đã tồn tại'}).waitFor();
  assert(await page.getByLabel('Họ và tên',{exact:true}).inputValue()===fullName,'duplicate creation retains profile');assert(await page.getByLabel('Mật khẩu',{exact:true}).inputValue()===password,'duplicate creation retains credential input without echo');
  if(height===667||width===1440)await page.screenshot({path:`output/playwright/r08/account-create-conflict-${label}.png`,fullPage:true});
  await page.getByLabel('Tên tài khoản',{exact:true}).fill(username);
  const createdResponse=page.waitForResponse(response=>response.url().endsWith('/api/accounts')&&response.request().method()==='POST'&&response.status()===201);
  await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();const created=(await (await createdResponse).json()).data;
  assert(created.role==='leader'&&created.team===null&&created.profile.userId!==created.accId,'new Leader has a separate unassigned profile');assert(!JSON.stringify(created).includes('"password"')&&!JSON.stringify(created).includes('"roleId"'),'safe creation payload');
  await page.getByRole('row',{name:`Tài khoản ${username}`,exact:true}).waitFor();
  assert(await page.getByRole('columnheader',{name:'Mật khẩu',exact:true}).count()===0,'no stored-password column');
  await page.reload();await page.getByLabel('Tìm kiếm chỉ huy',{exact:true}).fill(username);
  let row=page.getByRole('row',{name:`Tài khoản ${username}`,exact:true});await row.waitFor();
  await row.getByRole('button',{name:`Sửa tài khoản: ${username}`,exact:true}).click();
  assert(await page.getByLabel('Họ và tên',{exact:true}).evaluate(element=>document.activeElement===element),'edit form focuses profile');
  assert(await page.getByLabel('Mật khẩu mới (không bắt buộc)',{exact:true}).inputValue()==='','stored password never prefilled');
  await page.getByLabel('Họ và tên',{exact:true}).fill(updatedName);await page.getByLabel('Mật khẩu mới (không bắt buộc)',{exact:true}).fill(nextPassword);await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await page.getByText('Đã cập nhật tài khoản và hồ sơ.',{exact:true}).waitFor();
  row=page.getByRole('row',{name:`Tài khoản ${username}`,exact:true});await row.getByRole('link',{name:'Phân công đội hình',exact:true}).click();
  await page.getByRole('combobox',{name:'Chiến dịch',exact:true}).selectOption('503');await page.getByRole('button',{name:'Thêm đội hình',exact:true}).click();
  await page.getByLabel('Tên đội hình',{exact:true}).fill(teamName);await page.getByRole('combobox',{name:'Chỉ huy',exact:true}).selectOption(String(created.profile.userId));
  const teamResponse=page.waitForResponse(response=>response.url().endsWith('/api/teams')&&response.request().method()==='POST');
  await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();const team=(await (await teamResponse).json()).data;
  assert(team.leaderId===created.profile.userId,'assignment uses User ID');await page.getByText('Đã lưu đội hình.',{exact:true}).waitFor();
  await page.getByRole('link',{name:'Quản lý Chỉ huy',exact:true}).click();await page.getByLabel('Tìm kiếm chỉ huy',{exact:true}).fill(username);
  row=page.getByRole('row',{name:`Tài khoản ${username}`,exact:true});await row.getByText(teamName,{exact:true}).waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no account-page document overflow');
  await page.screenshot({path:`output/playwright/r08/accounts-live-${label}.png`,fullPage:true});
  const region=page.getByRole('region',{name:'Danh sách tài khoản',exact:true});
  if(await region.evaluate(element=>element.scrollWidth>element.clientWidth+1)){
   await region.focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('[aria-label="Danh sách tài khoản"]').scrollLeft>0);
   await row.getByRole('button',{name:`Vô hiệu hóa: ${username}`,exact:true}).scrollIntoViewIfNeeded();
   const box=await row.getByRole('button',{name:`Vô hiệu hóa: ${username}`,exact:true}).boundingBox();assert(box.x>=0&&box.x+box.width<=width+1,'actions reachable inside scrollable table');
   await page.screenshot({path:`output/playwright/r08/accounts-actions-${label}.png`,fullPage:true});
  }
  const leaderContext=await browser.newContext({viewport:{width,height}});const leaderPage=await leaderContext.newPage();watch(leaderPage,'leader');
  try {
   await leaderPage.goto(origin+'/login');assert(await login(leaderPage,username,password)===401,'old password rejected after reset');await leaderPage.getByRole('alert').waitFor();
   assert(await login(leaderPage,username,nextPassword)===200,'newly provisioned Leader logs in');await leaderPage.waitForURL('**/leader');
   const before=await ownTeam(leaderPage);assert(before.status===200&&before.teamId===team.teamId&&before.credentialSent,'real authenticated own-team contract after assignment');
   await row.getByRole('button',{name:`Vô hiệu hóa: ${username}`,exact:true}).click();await page.getByRole('group',{name:`Xác nhận vô hiệu hóa: ${username}`,exact:true}).waitFor();
   assert(await page.getByRole('button',{name:'Hủy vô hiệu hóa',exact:true}).evaluate(element=>document.activeElement===element),'confirmation focuses safe cancel action');
   await page.getByRole('button',{name:'Xác nhận vô hiệu hóa',exact:true}).click();await page.getByText('Đã vô hiệu hóa tài khoản và gỡ phân công. Hồ sơ và bài đăng được giữ nguyên.',{exact:true}).waitFor();
   row=page.getByRole('row',{name:`Tài khoản ${username}`,exact:true});await row.getByText('Đã vô hiệu hóa',{exact:true}).waitFor();
   assert(await row.getByText(updatedName,{exact:true}).count()===1,'profile retained after deactivation');
   await page.screenshot({path:`output/playwright/r08/account-inactive-${label}.png`,fullPage:true});
   const after=await ownTeam(leaderPage);assert(after.status===401&&after.credentialSent,'same logged-in session credential is denied after deactivation');await leaderPage.waitForURL('**/login');
   assert(await login(leaderPage,username,nextPassword)===401,'disabled account cannot obtain a new session');
   if(height===667)await leaderPage.screenshot({path:'output/playwright/r08/disabled-login-375x667.png',fullPage:true});
   results.push({width,height,passed:true,accId:created.accId,userId:created.profile.userId,teamId:team.teamId,ownTeamBefore:before.status,ownTeamAfter:after.status,check:'real provision/profile edit/password reset -> User-ID assignment -> isolated Leader login -> deactivate/release -> old session 401 and login denied; retained profile and reachable controls'});
  } finally {await leaderContext.close();}
  await page.goto(`${origin}/campaign/503/team/${team.teamId}`);await page.getByText('Chưa có thông tin ban chỉ huy.',{exact:true}).waitFor();
  await page.goto(origin+'/admin/teams?campaignId=503');await page.getByRole('button',{name:`Xóa đội hình: ${teamName}`,exact:true}).click();await page.getByRole('button',{name:'Xác nhận xóa đội hình',exact:true}).click();await page.getByText('Đã xóa đội hình; hồ sơ và tài khoản được giữ nguyên.',{exact:true}).waitFor();
 }
 await page.goto(origin+'/admin/accounts');await page.getByLabel('Tìm kiếm chỉ huy',{exact:true}).fill('r08-orphan');await page.getByRole('button',{name:'Bổ sung hồ sơ: r08-orphan',exact:true}).click();
 await page.getByLabel('Họ và tên',{exact:true}).fill('Hồ sơ được bổ sung');await page.getByLabel('Email',{exact:true}).fill('fixture-r08-repaired@gm.uit.edu.vn');await page.getByLabel('MSSV',{exact:true}).fill('99000002');await page.getByLabel('Lớp',{exact:true}).fill('SE.02');await page.getByLabel('Số điện thoại',{exact:true}).fill('0900000001');
 await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await page.getByText('Đã cập nhật tài khoản và hồ sơ.',{exact:true}).waitFor();await page.getByRole('row',{name:'Tài khoản r08-orphan',exact:true}).getByText('Hồ sơ được bổ sung',{exact:true}).waitFor();
 await page.screenshot({path:'output/playwright/r08/repaired-profile-375x667.png',fullPage:true});
 assert(pageErrors.length===0,'no uncaught app errors: '+JSON.stringify(pageErrors));assert(apiFailures.every(item=>[401,409].includes(item.status)),'only intentional login/session and duplicate-name failures');
 results.push({passed:true,check:'legacy missing profile repaired without assigning a team or resetting password; inactive history remains listed'});
 return {results,expectedFailures:apiFailures,uncaughtAppErrors:pageErrors,requests};
}
