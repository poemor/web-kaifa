/* Regression checks found by following the published lessons as a beginner. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const BASE=process.env.SITE_TEST_URL||'http://127.0.0.1:8743/';
(async()=>{
  const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
  let server;
  try {
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(BASE+'#/lesson/go-02');
    await page.locator('.lesson-header').waitFor();
    const before={url:page.url(),title:await page.locator('main h1').first().textContent()};
    await page.locator('.skip-link').focus();
    await page.locator('.skip-link').press('Enter');
    await page.waitForTimeout(150);
    assert.equal(page.url(),before.url,'keyboard skip link must preserve the course route');
    assert.equal(await page.locator('main h1').first().textContent(),before.title);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'main');
    await page.locator('[data-lesson-tab="code"]').click();
    const beginnerCode=await page.locator('#lesson-code').inputValue();
    await page.locator('#lesson-code').fill('// 我的草稿');
    await page.locator('[data-action="reset-code"]').click();
    assert.equal(await page.locator('#lesson-code').inputValue(),beginnerCode,'restore uses the beginner adaptation');
    await page.locator('[data-action="undo"]').click();
    assert.equal(await page.locator('#lesson-code').inputValue(),'// 我的草稿','restore remains undoable');
    for(const id of ['go-01','go-06']){
      await page.goto(BASE+'#/lesson/'+id);
      await page.locator('#lesson-source').waitFor({state:'attached'});
      const lecture=await page.locator('#lesson-source').textContent();
      assert(lecture.includes(id==='go-01'?'git add .gitignore main.go go.mod':'go.mod'),'supplemental lecture is available');
      const starter=await page.locator('#lesson-code').inputValue();
      const fullProgram=await page.evaluate(id=>window.LEARNING_LESSON_GUIDES[id].starterCode,id);
      assert.equal(starter,fullProgram,'course starter matches the complete lecture file');
      if(id==='go-06')assert(!lecture.includes('"example/go-lab/calc"'),'lecture must not use a different module path');
    }
    await page.goto(BASE+'#/lesson/web-12');
    await page.locator('#lesson-code').waitFor({state:'attached'});
    const html=await page.locator('#lesson-code').inputValue();
    await page.locator('[data-lesson-tab="code"]').click();
    await page.locator('#lesson-code').fill('<p>我的草稿</p>');
    await page.locator('[data-action="reset-code"]').click();
    assert.equal(await page.locator('#lesson-code').inputValue(),html,'restore uses the honest form, even with a saved draft');
    const requests=[];
    server=http.createServer((req,res)=>{
      requests.push(req.url);
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
      res.end(html);
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const url='http://127.0.0.1:'+server.address().port+'/';
    const demo=await browser.newPage();
    demo.on('pageerror',error=>errors.push(error.message));
    await demo.goto(url);
    await demo.locator('#student-name').fill('教学测试姓名');
    await demo.locator('#message').fill('教学测试留言');
    await demo.locator('button[type=submit]').click();
    await demo.waitForTimeout(150);
    assert.equal(demo.url(),url,'local check does not navigate or submit fields');
    assert((await demo.locator('[role=status]').textContent()).includes('尚未提交或保存'));
    await demo.locator('#message').fill('新的留言');
    assert((await demo.locator('[role=status]').textContent()).includes('重新检查'));
    await demo.locator('#student-name').fill('   ');
    await demo.locator('button[type=submit]').click();
    assert.equal(await demo.evaluate(()=>document.activeElement.id),'student-name');
    assert((await demo.locator('[role=status]').textContent()).includes('空格'));
    await demo.locator('button[type=button]').click();
    assert.equal(await demo.locator('#student-name').inputValue(),'');
    assert.equal(await demo.locator('#message').inputValue(),'');
    assert.equal(await demo.evaluate(()=>document.activeElement.id),'student-name');
    assert(!requests.some(url=>url.includes('?')),'no query request sends the fields');
    assert.deepEqual(errors,[]);
    console.log('PASS: keyboard skip navigation, Go lecture module/source safety and standalone Web12 local form checks.');
  } finally {
    if(server)await new Promise(resolve=>server.close(resolve));
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
