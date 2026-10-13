/* Run with Playwright + Edge and a root static server on 8743. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.SITE_TEST_URL || 'http://127.0.0.1:8743/';
const url = base + 'projects/web/workbook-design-review/';
const qa = path.resolve(__dirname, '../../../.qa');
(async () => {
  fs.mkdirSync(qa, {recursive:true});
  const browser = await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge',headless:true});
  try {
    const page = await browser.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    const initialStorage=await page.evaluate(()=>JSON.stringify({...localStorage}));
    const measurements=[];
    for(const width of [320,375,414,768,1024,1440]) {
      await page.setViewportSize({width,height:900});
      for(const view of ['home','lesson','catalogue']) {
        await page.goto(url+'#'+view);await page.locator('main h1').waitFor();
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${view} overflow at ${width}`);
        const badButtons=await page.locator('main button').evaluateAll(nodes=>nodes.filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.right>innerWidth+1;}).map(n=>n.textContent));
        assert.deepEqual(badButtons,[],`${view} buttons clipped at ${width}`);
        if(width===1440&&view==='home')measurements.push({width,routeTop:await page.locator('.routes').evaluate(n=>n.getBoundingClientRect().top)});
        if([375,1440].includes(width))await page.screenshot({path:path.join(qa,`design-${view}-${width}.png`),fullPage:true});
        if(view==='lesson') {
          await page.locator('#tab-task').click();await page.locator('#tab-task').focus();await page.keyboard.press('ArrowRight');
          assert.equal(await page.locator('#tab-code').getAttribute('aria-selected'),'true');
          await page.locator('#open-help').click();
          assert(await page.locator('#help').isVisible());
          if(width<1200)assert(await page.locator('#help-title').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.top<innerHeight;}),'help heading visible');
          await page.locator('#return-lesson').click();
          assert.equal(await page.locator('#open-help').evaluate(n=>n===document.activeElement),true);
        }
      }
    }
    await page.goto(url+'#lesson');await page.locator('#tab-code').click();
    await page.locator('#editor').fill('<h1 id="proof">手动运行</h1>');
    assert.equal(await page.locator('#code-preview').isVisible(),false);
    await page.locator('#run').click();await page.frameLocator('#code-preview').locator('#proof').waitFor();
    assert.equal(await page.locator('#code-preview').getAttribute('sandbox'),'allow-scripts');
    await page.locator('#tab-task').click();await page.locator('#tab-code').click();
    assert.equal(await page.locator('#editor').inputValue(),'<h1 id="proof">手动运行</h1>');
    assert.equal(await page.locator('#code-preview').isVisible(),false,'returning must not execute draft');
    await page.locator('#open-help').click();await page.locator('#help-form button').click();
    assert.equal(await page.locator('#question').getAttribute('aria-invalid'),'true');
    await page.locator('#question').fill('如何确认标题更新？');await page.locator('#help-form button').click();
    assert((await page.locator('#prompt').textContent()).includes('本课任务：'));
    await page.locator('#question').fill('新的问题');assert.equal(await page.locator('#prompt-result').isVisible(),false);
    await page.keyboard.press('Escape');
    await page.locator('#outline [data-lesson="web-02"]').click();await page.locator('#tab-code').click();
    assert(!(await page.locator('#editor').inputValue()).includes('id="proof"'),'drafts must stay with lesson');
    await page.locator('#outline [data-lesson="web-01"]').click();await page.locator('#tab-code').click();
    assert((await page.locator('#editor').inputValue()).includes('id="proof"'));
    await page.goto(url+'#catalogue');await page.locator('#query').fill('no-such-topic-987');
    assert.equal(await page.locator('.topic').count(),0);await page.locator('#reset-search').click();
    assert.equal(await page.locator('.topic').count(),24);
    await page.locator('#filter-track').selectOption('go');assert(await page.locator('.topic').count()>0);
    assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),initialStorage,'preview must not change stored learning records');
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(qa,'design-preview-verification.json'),JSON.stringify({widths:[320,375,414,768,1024,1440],measurements,errors,storageUnchanged:true},null,2));
    console.log('PASS: 3 views × 6 widths, keyboard tabs, help focus/return, prompt error/staleness, manual isolated preview, per-lesson drafts, empty search and unchanged storage.');
    console.log(JSON.stringify(measurements));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
