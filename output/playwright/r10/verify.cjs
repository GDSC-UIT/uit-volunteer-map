async page => {
 const origin='http://127.0.0.1:3017', results=[], requests=[], apiFailures=[], pageErrors=[];
 const assert=(value,message)=>{if(!value)throw Error(message)};
 page.on('request',request=>{if(request.url().includes(':5017/api/'))requests.push({method:request.method(),url:request.url()})});
 page.on('response',response=>{if(response.url().includes(':5017/api/')&&response.status()>=400)apiFailures.push({status:response.status(),url:response.url()})});
 page.on('pageerror',error=>pageErrors.push(error.message));
 async function login(username='r07-leader-101'){
  await page.goto(origin+'/login');await page.getByLabel('Tên đăng nhập',{exact:true}).fill(username);await page.getByLabel('Mật khẩu',{exact:true}).fill('r07-local-only');
  await page.getByRole('button',{name:'ĐĂNG NHẬP',exact:true}).click();await page.waitForURL('**/leader');await page.getByRole('button',{name:'Chỉnh sửa đội hình',exact:true}).waitFor();
 }
 async function layout(dialog=false) {
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'document has no horizontal overflow');
  if(dialog) {
   assert(await page.getByRole('dialog').evaluate(element=>{const r=element.getBoundingClientRect();return element.scrollWidth<=element.clientWidth+1&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}),'dialog fits viewport without horizontal clipping');
  }
 }
 async function trap() {
  for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await page.getByRole('dialog').evaluate(element=>element.contains(document.activeElement)),'Tab stays inside native dialog');}
 }
 const image={mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l90AAAAASUVORK5CYII=','base64')};
 await login();
 for(const [width,height] of [[375,667],[1440,900]]) {
  const label=width+'x'+height,title='Hoạt động tình nguyện gắn kết cộng đồng và sẻ chia yêu thương tại địa phương '+label,updated=title+' đã cập nhật',teamName='Đội hình tình nguyện kết nối cộng đồng và đồng hành cùng địa phương '+label;
  await page.setViewportSize({width,height});await page.goto(origin+'/leader');
  const trigger=page.getByRole('button',{name:'Chỉnh sửa đội hình',exact:true});await trigger.click();await layout(true);await trap();await page.keyboard.press('Escape');
  assert(await trigger.evaluate(element=>document.activeElement===element),'Escape restores trigger focus');
  await trigger.click();await page.getByLabel('Tên đội hình',{exact:true}).fill('Đội hình SQLite B');await page.getByRole('textbox',{name:'Mô tả',exact:true}).fill('Mô tả thật được lưu từ Leader '+label);
  await page.getByRole('button',{name:'Lưu đội hình',exact:true}).click();await page.getByRole('alert').waitFor();assert(await page.getByLabel('Tên đội hình',{exact:true}).inputValue()==='Đội hình SQLite B','409 preserves team draft');
  await page.getByLabel('Tên đội hình',{exact:true}).fill(teamName);await page.getByRole('button',{name:'Lưu đội hình',exact:true}).click();await page.getByRole('heading',{name:teamName,exact:true}).waitFor();
  await page.reload();await page.getByRole('heading',{name:teamName,exact:true}).waitFor();await layout();
  await page.screenshot({path:'output/playwright/r10/after-leader-'+label+'.png',fullPage:true});
  await page.getByRole('link',{name:'Tạo bài đăng',exact:true}).click();await page.getByRole('dialog',{name:'Ảnh bài đăng',exact:true}).waitFor();await layout(true);
  await page.getByLabel('Thêm ảnh',{exact:true}).setInputFiles({name:'empty.png',mimeType:'image/png',buffer:Buffer.alloc(0)});
  await page.getByRole('alert').filter({hasText:'5 MiB'}).waitFor();
  assert(await page.getByRole('img',{name:'Ảnh đã chọn 1',exact:true}).count()===0,'empty file rejected before preview/provider');
  await page.getByLabel('Thêm ảnh',{exact:true}).setInputFiles([{...image,name:'first.png'},{...image,name:'second.png'}]);
  await page.getByRole('button',{name:'Đưa lên trước',exact:true}).nth(1).press('Enter');
  let uploads=0;
  await page.route('https://api.cloudinary.com/**/image/upload',async route=>{
   uploads++;
   if(uploads===2){await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{message:'Synthetic provider failure'}})});return;}
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({secure_url:origin+'/src/assets/icons/'+(uploads===1?'bnd':'xtn')+'.png?r10='+label+'-'+uploads,public_id:'r09-'+label+'-'+uploads,width:100,height:100})});
  });
  await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();await page.getByRole('alert').filter({hasText:'Chưa thể tải ảnh'}).waitFor();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await page.getByLabel('Tiêu đề',{exact:true}).fill(title);await page.getByRole('textbox',{name:'Nội dung',exact:true}).fill('Nội dung lưu bằng API thật — '+label);await page.getByLabel('Vĩ độ',{exact:true}).fill('0');await page.getByLabel('Kinh độ',{exact:true}).fill('0');
  await page.getByRole('button',{name:'Quay lại ảnh',exact:true}).click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  assert(await page.getByLabel('Tiêu đề',{exact:true}).inputValue()===title&&uploads===3,'back preserves text and successful upload results');
  await layout(true);await trap();
  await page.getByRole('button',{name:'Đăng bài',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/r10/post-editor-'+label+'.png',fullPage:true});
  const createdResponse=page.waitForResponse(response=>response.url().endsWith('/api/posts')&&response.request().method()==='POST');
  await page.getByRole('button',{name:'Đăng bài',exact:true}).click();const response=await createdResponse;
  assert(response.status()===200,'post persisted via actual API');const created=(await response.json()).data,postId=created.postId;
  await page.waitForURL('**/leader/posts/'+postId);await page.getByRole('heading',{name:title,exact:true}).waitFor();
  await page.getByRole('button',{name:'Ảnh tiếp theo',exact:true}).click();await page.getByRole('img',{name:title+' — ảnh 2',exact:true}).waitFor();
  assert(await page.getByRole('img',{name:title+' — ảnh 2',exact:true}).evaluate(element=>element.complete&&element.naturalWidth>0),'persisted second photo is visible');
  await page.reload();await page.getByRole('heading',{name:title,exact:true}).waitFor();await layout();
  const stored=await page.evaluate(async id=>{const {postApi}=await import('/src/api/post.ts');const post=await postApi.getById(id);return {positions:post.photos.map(p=>p.position),first:post.photos.map(p=>p.isFirstImage),thumbnail:post.thumbnail?.photoId,firstId:post.photos[0]?.photoId}},postId);
  assert(JSON.stringify(stored.positions)==='[0,1]'&&JSON.stringify(stored.first)==='[true,false]'&&stored.thumbnail===stored.firstId,'persisted photo order and matching thumbnail after reload');
  await page.screenshot({path:'output/playwright/r10/post-detail-'+label+'.png',fullPage:true});
  await page.getByRole('link',{name:'Chỉnh sửa bài đăng',exact:true}).click();await page.getByLabel('Tiêu đề',{exact:true}).fill(updated);await page.getByLabel('Vĩ độ',{exact:true}).fill('10.8231');await page.getByLabel('Kinh độ',{exact:true}).fill('106.6296');
  await page.getByRole('button',{name:'Lưu bài đăng',exact:true}).click();await page.getByRole('heading',{name:updated,exact:true}).waitFor();
  await page.getByRole('button',{name:'Quay lại danh sách',exact:true}).click();await page.getByRole('link',{name:'Xem bài đăng: '+updated,exact:true}).waitFor();await layout();
  const editAction=page.getByRole('link',{name:'Sửa bài đăng: '+updated,exact:true});await editAction.scrollIntoViewIfNeeded();assert(await editAction.isVisible(),'edit action visible without hover');
  await page.screenshot({path:'output/playwright/r10/leader-actions-'+label+'.png',fullPage:true});
  await page.getByRole('button',{name:'Xin chào!',exact:true}).click();await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();await page.getByRole('button',{name:'Có',exact:true}).click();await page.waitForURL('**/login');await login();
  await page.getByRole('link',{name:'Xem bài đăng: '+updated,exact:true}).waitFor();await page.getByRole('heading',{name:teamName,exact:true}).waitFor();
  await page.getByRole('button',{name:'Xóa bài đăng: '+updated,exact:true}).click();await layout(true);
  assert(await page.getByRole('dialog').getByText('Bạn có chắc muốn xóa bài đăng “'+updated+'”?',{exact:true}).count()===1,'delete identifies actual post');
  await page.screenshot({path:'output/playwright/r10/post-delete-'+label+'.png',fullPage:true});
  await page.getByRole('button',{name:'Có, xóa bài đăng',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'});
  assert(await page.getByRole('link',{name:'Xem bài đăng: '+updated,exact:true}).count()===0,'deleted post removed from scoped list');
  await page.goto(origin+'/leader/posts/'+postId);await page.getByRole('alert').filter({hasText:'Không tìm thấy bài đăng'}).waitFor();
  await page.goto(origin+'/campaign/501/post/'+postId);await page.getByRole('alert').filter({hasText:'Không tìm thấy bài đăng'}).waitFor();
  await page.unroute('https://api.cloudinary.com/**/image/upload');
  results.push({width,height,passed:true,postId,teamId:510,providerStubUploads:uploads,check:'real own-team metadata conflict/save/reload; two-photo create/detail/edit; zero coordinates; back preserves draft; keyboard modal/focus; sign-out/in persistence; confirmed delete and public 404'});
 }
 await page.goto(origin+'/leader/posts/5201/edit');await page.getByRole('alert').filter({hasText:'Bài đăng không thuộc đội hình'}).waitFor();assert(await page.getByLabel('Tiêu đề',{exact:true}).count()===0,'foreign-team editor unavailable');
 const denied=await page.evaluate(async()=>{const {default:client}=await import('/src/api/client.ts');try{await client.put('/posts/5201',{title:'forbidden'});return 200}catch(error){return error.response?.status||0}});
 assert(denied===403,'backend independently denies cross-team update');
 await page.goto(origin+'/leader');
 assert(pageErrors.length===0,'no uncaught app errors: '+JSON.stringify(pageErrors));
 assert(apiFailures.every(item=>[403,404,409].includes(item.status)),'only intentional own-team/duplicate/deleted failures');
 return {results,uncaughtAppErrors:pageErrors,expectedApiFailures:apiFailures,requests,provider:'Cloudinary network stub only; real application API, auth, migrated SQLite and photo metadata persistence'};
}
