async page => {
 const prefix = new URL(page.url()).searchParams.get('capture') || 'before';
 const out='output/playwright/ux-campaign-team-responsive';
 const results=[];
 for(const [width,height] of [[375,900],[768,900],[1024,900],[1440,900],[375,667]]) {
  await page.setViewportSize({width,height});
  for(const [name,url] of [['campaign','/campaign/xtn'],['team','/campaign/xtn/team/1'],['leader','/leader']]) {
   await page.evaluate(name=>{localStorage.clear();if(name==='leader'){localStorage.setItem('auth_token','invalid-ui-token');localStorage.setItem('auth_user',JSON.stringify({id:'ui',role:'leader',username:'UI test'}));}},name);
   await page.goto('http://127.0.0.1:3015'+url); await page.waitForTimeout(name==='campaign'?5500:1000);
   if(name==='campaign') {
    const team=page.locator('#teams .timeline-item').first(); await team.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
    await page.screenshot({path:`${out}/${prefix}-timeline-${width}x${height}.png`});
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);
   }
   await page.screenshot({path:`${out}/${prefix}-${name}-${width}x${height}.png`,fullPage:true});
   results.push({prefix,name,width,height,documentWidth:await page.evaluate(()=>document.documentElement.scrollWidth)});
  }
 }
 return results;
}