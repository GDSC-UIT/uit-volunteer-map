async page=>{
 for(const width of [375,1440]){
  await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:3015/campaign/xtn');await page.waitForTimeout(2500);
  await page.locator('#mapSection').screenshot({path:`output/playwright/ux-campaign-team-responsive/after-map-${width}.png`});
 }
 await page.setViewportSize({width:375,height:667});await page.goto('http://127.0.0.1:3015/campaign/xtn/team/1');await page.waitForTimeout(5500);
 await page.locator('main section').last().screenshot({path:'output/playwright/ux-campaign-team-responsive/after-team-activities-375.png'});
 return 'Map desktop/mobile and populated team activity captures saved';
}