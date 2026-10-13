/* Checks that advanced lessons actually teach, copy, download and navigate. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'.qa');
const BASE=process.env.SITE_TEST_URL||'http://127.0.0.1:8743/';
const KEY='web-kaifa-study-v1';
(async()=>{
  fs.mkdirSync(qa,{recursive:true});
  const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(BASE+'#/followup/web/0');
    await page.locator('main > .page-heading').waitFor();
    assert.equal(await page.locator('.followup-guide').count(),1,'stage must contain an expanded teaching guide, not just the original checklist');
    const baseline=await page.evaluate(key=>localStorage.getItem(key),KEY);
    const stages=await page.evaluate(()=>window.LEARNING_CURRICULUM.web.followups);
    const navigate=async index=>{
      await page.evaluate(index=>location.hash='/followup/web/'+index,index);
      await page.locator(`[data-followup-guide="web-${String(index).padStart(2,'0')}"]`).waitFor();
    };
    for(const width of [320,375,414,768,1024,1280,1440]){
      await page.setViewportSize({width,height:1000});
      for(let index=0;index<stages.length;index++){
        await navigate(index);
        assert.equal(await page.locator('main > .page-heading h1').textContent(),stages[index].title);
        assert(await page.locator('.followup-guide').isVisible());
        assert.equal(await page.locator('.followup-guide').evaluate(element=>Boolean(element.closest('details'))),false,'teaching is expanded by default');
        assert.equal(await page.locator('#course-outline a').count(),12);
        assert.equal(await page.locator('#course-outline [aria-current="page"]').getAttribute('href'),'#/followup/web/'+index);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'stage '+index+' overflow at '+width);
        const jump=page.locator('.followup-guide [data-knowledge-jump]').last();
        await jump.click();
        const id=await jump.getAttribute('data-knowledge-jump');
        assert.equal(await page.evaluate(()=>document.activeElement.id),id);
        const box=await page.locator('#'+id).boundingBox();assert(box.y>=68&&box.y<850,'visible heading after chapter navigation');
      }
    }
    await page.setViewportSize({width:1440,height:1000});
    for(let index=0;index<stages.length;index++){
      await navigate(index);
      const copy=page.locator('.followup-guide [data-knowledge-copy]').first();
      const snippet=await copy.getAttribute('data-knowledge-copy');
      const expected=await page.locator('#'+snippet).textContent();
      await copy.click();
      assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n'),expected);
      assert.equal(await page.locator('.followup-guide .knowledge-code:has(code.language-output) button').count(),0,'output is not a command to copy');
      const event=page.waitForEvent('download');
      await page.locator('[data-followup-download]').click();
      const download=await event;
      const target=path.join(qa,'stage-download-'+index+'.zip');await download.saveAs(target);
      const guide=await page.evaluate(index=>window.LEARNING_FOLLOWUP_GUIDES['web-'+String(index).padStart(2,'0')],index);
      assert.equal(crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'),guide.sha256,'download is the current complete source');
    }
    await navigate(2);
    assert.equal(await page.locator('.followup-next [href="#/followup/web/3"]').count(),1);
    assert.equal(await page.locator('.followup-next [href="#/followup/web/7"]').count(),1);
    await navigate(7);
    assert.equal(await page.locator('.followup-next a').first().getAttribute('href'),'#/followup/web/2','fullstack returns to shared foundations');
    await page.locator('.followup-next [data-assist-preset]').click();
    assert((await page.locator('#assistant-context-preview').textContent()).includes(stages[7].title),'AI context contains current stage');
    await page.locator('#assistant-question').fill('我按讲义运行后，列表没有出现。');
    await page.locator('#assistant-form [type=submit]').click();
    assert((await page.locator('#assistant-output').textContent()).includes(stages[7].task));
    await page.evaluate(()=>location.hash='/search?q=TypeScript');
    await page.locator('.followup-search-results').waitFor();
    assert.equal(await page.locator('.followup-search-results [href="#/followup/web/3"]').count(),1);
    assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),baseline,'reading/copy/download/questions do not complete or change records');
    const filePage=await browser.newPage();
    await filePage.goto(pathToFileURL(path.join(root,'index.html')).href+'#/followup/web/0');
    await filePage.locator('.followup-guide').waitFor();
    assert.equal(await filePage.locator('main > .page-heading h1').textContent(),stages[0].title);
    assert.deepEqual(errors,[]);
    console.log('PASS: 12 complete stage lessons × 7 widths; expanded teaching, chapters, copy, current source downloads, branch navigation, stage AI context, search, offline and unchanged progress.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
