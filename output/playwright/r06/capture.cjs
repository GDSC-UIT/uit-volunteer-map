async page => {
 await page.unroute('**/data/index.json');
 for(const [width,height] of [[375,667],[1440,900]]) {
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:3017/campaign/501');
  await page.getByRole('button',{name:'Mở bài đăng: Bài SQLite A thứ hai',exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===1);
  await page.getByRole('group',{name:'Thống kê chiến dịch'}).getByText('3',{exact:true}).waitFor();
  await page.screenshot({path:`output/playwright/r06/map-viewport-${width}x${height}.png`});
 }
 return {passed:true,check:'mobile and desktop map viewport captures after final source checks'};
}
