/* A prior unversioned app response must not be reused by the updated entry. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const BASE=process.env.SITE_TEST_URL||'http://127.0.0.1:8743/';
(async()=>{
  const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
  try{
    const page=await browser.newPage();let staleRequests=0;
    await page.route('**/assets/app.js',route=>{
      staleRequests++;
      return route.fulfill({contentType:'text/javascript',body:'document.querySelector("#main").innerHTML="<h1>这里还没有这节课</h1>";'});
    });
    await page.goto(BASE+'#/setup');
    await page.locator('main h1').waitFor();
    assert.equal(await page.locator('main h1').textContent(),'安装 VS Code','new navigation must load the new router despite a stale unversioned response');
    assert.equal(staleRequests,0);
    const baseline=await page.evaluate(()=>localStorage.getItem('web-kaifa-study-v1'));
    await page.locator('.setup-nav a[href="#/setup?topic=go"]').click();
    await page.reload();await page.locator('.setup-article').waitFor();
    assert.equal(await page.locator('main h1').textContent(),'Go 环境');
    assert.equal(await page.evaluate(()=>localStorage.getItem('web-kaifa-study-v1')),baseline);
    console.log('PASS: stale unversioned router bypassed, direct tutorial navigation and reload retain progress.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
