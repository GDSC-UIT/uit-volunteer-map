async page => {
 const results=[]; const assert=(ok,message)=>{if(!ok)throw Error(message)};
 await page.route('**/api/auth/logout',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Simulated offline logout"}'}));
 let status=403;
 await page.route('**/api/r02-probe',route=>route.fulfill({status,contentType:'application/json',body:'{"error":"Simulated session rejection"}'}));
 for(const [role,path] of [['admin','/admin/dashboard'],['leader','/leader']]){
  await page.setViewportSize({width:375,height:667});
  await page.evaluate(role=>{localStorage.setItem('auth_token','r02-synthetic-token');localStorage.setItem('auth_user',JSON.stringify({accId:1,username:'UI test',role}));},role);
  await page.goto('http://127.0.0.1:3016'+path);
  if(role==='leader'){await page.getByRole('button',{name:'Xin chào!'}).click();await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();await page.getByRole('button',{name:'Có',exact:true}).click();}
  else await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();
  await page.waitForURL('**/login',{waitUntil:'domcontentloaded',timeout:5000}).catch(()=>{throw Error(role+' initial logout at '+page.url())});assert(await page.evaluate(()=>!localStorage.getItem('auth_token')&&!localStorage.getItem('auth_user')),role+' storage');
  await page.goBack({waitUntil:'domcontentloaded'});await page.waitForURL('**/login',{waitUntil:'domcontentloaded',timeout:5000}).catch(()=>{throw Error(role+' Back at '+page.url())});await page.reload({waitUntil:'domcontentloaded'});await page.waitForURL('**/login',{waitUntil:'domcontentloaded',timeout:5000}).catch(()=>{throw Error(role+' refresh at '+page.url())});
  await page.screenshot({path:`output/playwright/r02/logout-${role}-simulated-375x667.png`});
  results.push({role,check:'logout with failed API; protected Back/refresh denied; storage cleared',passed:true});
 }
 await page.evaluate(()=>{localStorage.setItem('auth_token','r02-synthetic-token');localStorage.setItem('auth_user',JSON.stringify({accId:1,username:'UI test',role:'admin'}));});
 await page.goto('http://127.0.0.1:3016/admin/dashboard');
 const probe=()=>page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(entry=>entry.name).find(url=>new URL(url).pathname==='/src/api/client.ts');if(!url)throw Error('API module not found');const {default:api}=await import(url);try{await api.get('/r02-probe')}catch(error){return {status:error.response.status,message:error.message}}});
 const denied=await probe();assert(denied.status===403&&denied.message==='Simulated session rejection','403 status preserved');assert(page.url().includes('/admin/'),'403 session retained');
 status=401;const expired=await probe();assert(expired.status===401,'401 status preserved');await page.waitForURL('**/login',{waitUntil:'domcontentloaded',timeout:5000});assert(await page.evaluate(()=>!localStorage.getItem('auth_token')),'expired session cleared');
 results.push({check:'403 retains valid session; protected 401 expires session and preserves HTTP status/message',passed:true});
 return results;
}