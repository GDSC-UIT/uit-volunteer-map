async page => {
 const results=[];
 for(const [width,height] of [[375,667],[1440,900]]) {
  await page.setViewportSize({width,height});
  for(const [name,path,title] of [
   ['campaign','/campaign/501','Chiến dịch kiểm thử A'],
   ['team','/campaign/501/team/510','Đội hình SQLite A'],
  ]) {
   await page.goto('http://127.0.0.1:3017'+path);
   await page.getByRole('heading',{name:title,exact:true}).waitFor();
   await page.getByRole('link',{name:'Xem bài đăng: Bài SQLite A thứ hai',exact:true}).waitFor();
   await page.getByRole('link',{name:'Xem bài đăng: Bài SQLite A thứ hai',exact:true}).scrollIntoViewIfNeeded();
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:`output/playwright/r05/${name}-live-${width}x${height}.png`,fullPage:true});
   results.push({name,width,height,documentWidth:await page.evaluate(()=>document.documentElement.scrollWidth)});
  }
 }
 return results;
}
