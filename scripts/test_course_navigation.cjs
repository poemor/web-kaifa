/* Directory browsing must preserve the current reading and learner records. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'docs/courses/catalog.json'),'utf8'));
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:8743/';
const qa=path.join(root,'.qa','course-navigation');fs.mkdirSync(qa,{recursive:true});
const widths=[320,375,414,768,1440];
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'#/home');await page.locator('#main h1').waitFor();
  await page.evaluate(()=>{
   const key='web-kaifa-study-v1',state=JSON.parse(localStorage.getItem(key));
   state.notes['go-01']='目录翻页保留的笔记';state.drafts['go-01']='package main\n// 我写的草稿';
   localStorage.setItem(key,JSON.stringify(state));
  });
  await page.reload();await page.locator('#site-nav [data-nav="go"]').click();
  await page.locator('.book-overview').waitFor();
  assert.equal(await page.locator('#main .book-level li').count(),0,'full chapter list is not body content');
  assert.equal(await page.locator('#course-outline').isVisible(),true,'direction entry exposes chapter directory');
  assert.equal(await page.locator('#site-navigation').getAttribute('open'),null,'site links are secondary');
  const savedRecords=await page.evaluate(()=>{
   const {notes,drafts,completed}=JSON.parse(localStorage.getItem('web-kaifa-study-v1'));
   return {notes,drafts,completed};
  });
  let directoryPages=0;
  for(const width of widths){
   await page.setViewportSize({width,height:1000});
   for(const track of ['go','web']){
    await page.goto(base+'#/'+track);await page.locator('.book-overview').waitFor();
    if(width<=960)await page.locator('#menu-toggle').click();
    assert.equal(await page.locator('#book-stage option').count(),4);
    assert.equal(await page.locator('#main .book-overview dl dt').count(),4);
    const seen=[];
    for(const level of data.levels){
     await page.locator('#book-stage').selectOption(level.id);
     const expected=data.lessons.filter(x=>x.track===track&&x.level===level.id),pages=Math.ceil(expected.length/8);
     assert(await page.locator('[aria-label="目录上一页"]').isDisabled());
     for(let number=1;number<=pages;number++){
      assert.equal(await page.locator('.book-pagination [role="status"]').textContent(),`${number} / ${pages} 页`);
      const ids=await page.locator('.book-outline a').evaluateAll(links=>links.map(link=>link.getAttribute('href').split('/').at(-1)));
      assert.deepEqual(ids,expected.slice((number-1)*8,number*8).map(x=>x.id),'exact stage order and page slice');
      seen.push(...ids);directoryPages++;
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.body.scrollWidth<=innerWidth),'expanded directory overflow '+width);
      if(number<pages)await page.locator('[aria-label="目录下一页"]').click();
     }
     assert(await page.locator('[aria-label="目录下一页"]').isDisabled());
    }
    assert.deepEqual(seen,data.lessons.filter(x=>x.track===track).map(x=>x.id),'every chapter reachable once');
    if(width<=960){
     assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'true','directory controls leave mobile menu open');
     const first=page.locator('.book-outline a').first(),href=await first.getAttribute('href');
     await first.click();await page.locator(`[data-book-prose="${href.split('/').at(-1)}"]`).waitFor();
     assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false','selecting a different chapter closes menu');
     assert.equal(await page.locator('#sidebar').getAttribute('data-open'),'false');
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'reader overflow '+width);
    }
   }
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'#/learn/go/go-program');await page.locator('.book-prose').waitFor();
  await page.locator('.book-answer').first().evaluate(element=>element.open=true);
  await page.locator('#assistant-toggle').click();await page.locator('#assistant-question').fill('翻目录时保留这个问题');
  await page.evaluate(()=>{window.__readingNode=document.querySelector('.book-prose');window.scrollTo({top:400,behavior:'instant'});});
  const scroll=await page.evaluate(()=>scrollY);
  await page.locator('[aria-label="目录下一页"]').click();
  assert.equal(await page.locator('main h1').textContent(),'Go 程序结构');
  assert(await page.evaluate(()=>window.__readingNode===document.querySelector('.book-prose')),'paging keeps the actual reading DOM');
  assert.equal(await page.locator('.book-answer[open]').count(),1,'paging keeps answer expansion');
  assert(Math.abs((await page.evaluate(()=>scrollY))-scroll)<2,'paging keeps reading scroll');
  assert.equal(await page.locator('#assistant-question').inputValue(),'翻目录时保留这个问题');
  await page.locator('#book-stage').selectOption('advanced');
  assert(await page.evaluate(()=>window.__readingNode===document.querySelector('.book-prose')),'stage selection preserves body');
  assert.equal(new URLSearchParams((await page.evaluate(()=>location.hash)).split('?')[1]).get('level'),'advanced');
  await page.reload();await page.locator('.book-prose').waitFor();
  assert.equal(await page.locator('#book-stage').inputValue(),'advanced','refresh restores directory');
  assert.equal(await page.locator('main h1').textContent(),'Go 程序结构');
  await page.evaluate(()=>window.__readingNode=document.querySelector('.book-prose'));
  await page.locator('[data-book-locate]').click();
  assert.equal(await page.locator('#book-stage').inputValue(),'intro');
  assert.equal(await page.locator('.book-outline [aria-current="page"]').getAttribute('href'),'#/learn/go/go-program');
  await page.goBack();await page.waitForFunction(()=>document.querySelector('#book-stage').value==='advanced');
  assert(await page.evaluate(()=>window.__readingNode===document.querySelector('.book-prose')),'browser back updates directory without rebuilding reader');
  await page.goForward();await page.waitForFunction(()=>document.querySelector('#book-stage').value==='intro');
  await page.locator('.book-page-toc summary').click();
  const jump=page.locator('[data-book-jump]').last(),target=await jump.getAttribute('data-book-jump'),hash=await page.evaluate(()=>location.hash);
  await jump.click();assert.equal(await page.evaluate(()=>document.activeElement.id),target);
  assert.equal(await page.evaluate(()=>location.hash),hash,'section jumps do not enter the router');
  await page.goto(base+'#/learn/go/go-recovery');await page.locator('.book-prose').waitFor();
  assert.equal(await page.locator('#book-stage').inputValue(),'advanced');
  assert.equal(await page.locator('.book-outline [aria-current="page"]').getAttribute('href'),'#/learn/go/go-recovery','deep link locates correct page');
  await page.goto(base+'#/learn/go/go-recursion');await page.locator('.book-prose').waitFor();
  assert.equal(await page.locator('.book-prose a').filter({hasText:'函数调用和返回'}).getAttribute('href'),'#/learn/go/go-functions','repository-relative chapter link becomes a portable reader route');
  await page.goto(base+'#/learn/go/go-program?level=bad&page=NaN');await page.locator('.book-prose').waitFor();
  assert.equal(await page.locator('#book-stage').inputValue(),'intro','invalid directory level safely falls back');
  assert.equal(await page.locator('.book-pagination [role="status"]').textContent(),'1 / 2 页');
  assert.deepEqual(await page.evaluate(()=>{
   const {notes,drafts,completed}=JSON.parse(localStorage.getItem('web-kaifa-study-v1'));return {notes,drafts,completed};
  }),savedRecords,'directory interaction never rewrites learner work');
  for(const width of widths){
   await page.setViewportSize({width,height:1000});await page.goto(base+'#/learn/go/go-http-handler');await page.locator('.book-prose').waitFor();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'long HTTP example fits '+width);
   if(width<=960)await page.locator('#menu-toggle').click();
   await page.screenshot({path:path.join(qa,`reader-${width}.png`),fullPage:width===1440});
  }
  assert.deepEqual(errors,[]);
  const report={widths,directoryPages,chapters:data.lessons.length,preserves:['body','scroll','answers','question','notes','code','completion'],history:true};
  fs.writeFileSync(path.join(qa,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
