async (page) => {
  const results=[];
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  for (const [width,height] of [[375,667],[768,900],[1024,900],[1440,900]]) {
    await page.setViewportSize({width,height});
    await page.goto('http://127.0.0.1:3014/campaign/xtn');
    assert(await page.locator('main').count()===1,'one campaign main');
    assert(await page.getByRole('heading',{level:1}).count()===1,'campaign h1');
    // Component harness: map data is unavailable, so mount the real guest popup with a synthetic post.
    await page.evaluate(async()=>{
      const {default:React}=await import('/node_modules/.vite/deps/react.js');
      const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js');
      const {default:Guest}=await import('/src/components/ui/popups/post/GuestPostOverPlay.tsx');
      const host=document.createElement('div'); document.body.append(host);
      const root=ReactDOM.createRoot(host);
      root.render(React.createElement(Guest,{post:{postId:'test',title:'Bài viết mô phỏng',content:'Nội dung dài để kiểm tra cuộn. '.repeat(80),photos:['/src/assets/icons/xtn.png','/src/assets/icons/mhx.png'],location:'Thành phố Hồ Chí Minh',teamId:'Đội kiểm thử',createdAt:'2026-11-14'},onClose:()=>{root.unmount();host.remove();}}));
    });
    const dialog=page.getByRole('dialog',{name:'Bài viết mô phỏng'}); await dialog.waitFor();
    const bounds=await dialog.evaluate(el=>{const r=el.getBoundingClientRect();return {fits:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,overflow:el.scrollWidth>el.clientWidth+1};});
    assert(bounds.fits&&!bounds.overflow,'guest bounds');
    for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await dialog.evaluate(el=>el.contains(document.activeElement)),'guest tab containment');}
    await page.getByRole('button',{name:'Ảnh tiếp theo',exact:true}).click();
    assert(await page.getByRole('img',{name:'Bài viết mô phỏng — ảnh 2'}).count()===1,'named guest image/next');
    await dialog.evaluate(el=>el.scrollTop=0);
    await page.screenshot({path:`output/playwright/ux-shared-accessibility/guest-component-simulated-${width}x${height}.png`});
    await page.keyboard.press('Escape'); assert(await page.locator('dialog[open]').count()===0,'guest Escape');
    results.push({width,height,check:'guest real component with synthetic post: semantics, slider, focus, Escape, scrolling; campaign landmarks',passed:true});
  }
  return results;
}
