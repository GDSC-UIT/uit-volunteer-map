async (page) => {
  const output = 'output/playwright/ux-shared-accessibility';
  const results = [];
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  for (const [width,height] of [[375,667],[768,900],[1024,900],[1440,900]]) {
    await page.setViewportSize({width,height});
    await page.goto('http://127.0.0.1:3014/leader');
    // Simulate the existing upload transport, leaving the actual batch/retry UI intact.
    await page.evaluate(async () => {
      const { cloudinaryApi } = await import('/src/api/cloudinary.ts');
      window.testUploadCalls = [];
      cloudinaryApi.uploadImage = async (file) => {
        window.testUploadCalls.push(file.name);
        if (window.testUploadCalls.length === 2) throw new Error('Simulated recoverable upload failure');
        return {secure_url: '/src/assets/icons/xtn.png',public_id: file.name,width:160,height:120};
      };
    });
    await page.getByRole('button',{name:'+ Tạo bài đăng',exact:true}).click();
    await page.locator('input[type=file]').setInputFiles([1,2].map(i=>`${output}/fixture-${i}.svg`));
    for(let i=1;i<=2;i++) await page.getByRole('button',{name:`fixture-${i}.svg`,exact:true}).click();
    await page.getByRole('button',{name:'Chọn 2 ảnh',exact:true}).click();
    await page.getByRole('alert').waitFor();
    assert((await page.getByRole('alert').textContent()).includes('được giữ lại'),'error recovery instruction');
    await page.screenshot({path:`${output}/upload-failure-simulated-${width}x${height}.png`});
    await page.getByRole('button',{name:'Chọn 2 ảnh',exact:true}).click();
    const editor=page.getByRole('dialog',{name:'Nội dung bài viết',exact:true}); await editor.waitFor();
    assert(JSON.stringify(await page.evaluate(()=>window.testUploadCalls))===JSON.stringify(['fixture-1.svg','fixture-2.svg','fixture-2.svg']),'retry skips successful upload');
    await page.getByRole('textbox',{name:'Tiêu đề',exact:true}).fill('Bản nháp kiểm thử');
    await page.getByRole('textbox',{name:'Nội dung bài viết',exact:true}).fill('Nội dung được giữ lại khi quay lại chọn ảnh.');
    await page.getByRole('button',{name:'Quay lại',exact:true}).click();
    assert(await page.getByRole('button',{name:'fixture-1.svg, thứ tự 1',exact:true}).getAttribute('aria-pressed')==='true','image retained from editor');
    await page.getByRole('button',{name:'Chọn 2 ảnh',exact:true}).click();
    await editor.waitFor();
    assert(await page.getByRole('textbox',{name:'Tiêu đề',exact:true}).inputValue()==='Bản nháp kiểm thử','title retained');
    assert((await page.getByRole('textbox',{name:'Nội dung bài viết',exact:true}).inputValue()).includes('được giữ lại'),'body retained');
    assert(await page.evaluate(()=>window.testUploadCalls.length)===3,'no duplicate upload on Back');
    const geometry=await editor.evaluate(el=>{const r=el.getBoundingClientRect();return {fits:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,overflow:el.scrollWidth>el.clientWidth+1};});
    assert(geometry.fits&&!geometry.overflow,'editor bounds');
    for(let i=0;i<14;i++){await page.keyboard.press('Tab');assert(await editor.evaluate(el=>el.contains(document.activeElement)),'editor tab trap');}
    await editor.evaluate(el=>el.scrollTop=0);
    await page.screenshot({path:`${output}/editor-draft-simulated-${width}x${height}.png`});
    await page.keyboard.press('Escape');
    assert(await page.getByRole('button',{name:'+ Tạo bài đăng',exact:true}).evaluate(el=>el===document.activeElement),'editor restores original create trigger');
    results.push({width,height,check:'simulated partial upload/retry, cached success, retained draft and editor keyboard/bounds',passed:true});
  }
  return results;
}
