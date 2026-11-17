async page => {
 await page.setViewportSize({width:375,height:667});
 await page.goto('http://127.0.0.1:3017/campaign/501/post/5102');
 await page.getByRole('heading',{name:'Bài SQLite A thứ hai',exact:true}).waitFor();
 let release;
 const pending=new Promise(resolve=>{release=resolve});
 await page.route('**/api/campaigns/501',async route=>{await pending;await route.continue()});
 await page.getByRole('navigation',{name:'Điều hướng chiến dịch'}).getByRole('link',{name:'Hoạt động',exact:true}).click();
 await page.getByText('Đang tải chiến dịch…',{exact:true}).waitFor();
 release();
 const heading=page.getByRole('heading',{name:'HOẠT ĐỘNG',exact:true});await heading.waitFor();
 await page.waitForFunction(()=>{
  const target=document.getElementById('activities');
  const header=document.querySelector('header');
  if(!target||!header)return false;
  const top=target.getBoundingClientRect().top;
  return top>=header.getBoundingClientRect().bottom && top<innerHeight;
 },null,{timeout:3000});
 await page.unroute('**/api/campaigns/501');
 return {passed:true,check:'cold campaign anchor waits for API content, then scrolls section below sticky header'};
}
