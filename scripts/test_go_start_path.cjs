/* Beginner setup links, module recovery, keyboard focus and saved progress. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),BASE=process.env.SITE_TEST_URL||'http://127.0.0.1:8743/';
const output=path.join(root,'.qa','go-module-path-peer');fs.mkdirSync(output,{recursive:true});
const checks=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
function learningProgress(page){
 return page.evaluate(()=>{
  const state=JSON.parse(localStorage.getItem('web-kaifa-study-v1'));
  return Object.fromEntries(['completed','checks','quiz','notes','drafts'].map(key=>[key,state[key]]));
 });
}
async function focusedHeading(page,fragment){
 await page.waitForFunction(part=>document.activeElement.tagName==='H2'&&document.activeElement.textContent.includes(part),fragment);
 await page.waitForLoadState('networkidle');
 const box=await page.evaluate(()=>{const r=document.activeElement.getBoundingClientRect();return{top:r.top,bottom:r.bottom};});
 check('直接定位 '+fragment,box.top>=68&&box.top<900);
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(BASE+'#/lesson/go-01');
  await page.evaluate(()=>{
   const key='web-kaifa-study-v1',state=JSON.parse(localStorage.getItem(key));
   state.notes['go-01']='独立审核保留笔记';state.drafts['go-01']='package main\n// 草稿只保存，不执行';
   localStorage.setItem(key,JSON.stringify(state));
  });
  await page.reload();const baseline=await learningProgress(page);
  // Keep prerequisite actions visible before the lesson tabs and code editor.
  for(const width of [320,360,390,768,1024,1440,1920]){
   await page.setViewportSize({width,height:1000});
   await page.goto(BASE+'#/lesson/go-01');
   const card=page.locator('.go-first-run');
   await card.waitFor();
   const box=await card.boundingBox();
   check('Go01首屏入口宽度'+width,box.y<1000&&box.width<=width);
   check('Go01顺序含模块→运行→F5宽度'+width,await card.evaluate(el=>/go\.mod/.test(el.textContent)&&/go run/.test(el.textContent)&&/F5/.test(el.textContent)));
   check('Go01宽度'+width+'无页面横向溢出',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   check('首屏长按钮完整落在视口内宽度'+width,await card.locator('button,a').evaluateAll(elements=>elements.every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})));
   const copy=card.locator('[data-knowledge-copy="go-first-init-command"]');await copy.click();
   await page.waitForFunction(async()=>/go mod init/.test(await navigator.clipboard.readText()));
   const command=await page.evaluate(()=>navigator.clipboard.readText());
   check('init复制为纯命令宽度'+width,/^go mod init [^\r\n]+\n?$/.test(command)&&!command.includes('PS '));
   const initialize=card.getByRole('link',{name:'从创建文件夹到运行，逐步跟做 →',exact:true});
   await initialize.click();
   check('模块链接带精确step宽度'+width,page.url().includes('step='));
   await focusedHeading(page,'初始化');
   await page.reload();await focusedHeading(page,'初始化');
   check('模块深链刷新仍保留步骤宽度'+width,page.url().includes('step=module'));
   await page.goBack();await page.locator('.go-first-run').waitFor();
   check('浏览器返回恢复Go01入口宽度'+width,page.url().includes('/lesson/go-01'));
   await page.goto(BASE+'#/lesson/go-01');
   await page.locator('.go-first-run').getByRole('link',{name:'遇到 go.mod file not found？直接修复 →',exact:true}).click();
   await focusedHeading(page,'go.mod file not found');
   check('修复正文含所属模块/工作区/终端证据宽度'+width,await page.locator('.setup-article').evaluate(el=>/所属模块|上级目录/.test(el.textContent)&&/go env GOMOD/.test(el.textContent)&&/cmd/.test(el.textContent)));
   check('修复页宽度'+width+'无页面横向溢出',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.goto(BASE+'#/lesson/go-01');
   await page.locator('.go-first-run').getByRole('link',{name:'运行成功后，配置 VS Code →',exact:true}).click();
   await focusedHeading(page,'打开正确项目');
   check('先配置项目再F5宽度'+width,page.url().includes('step=module'));
   await page.goto(BASE+'#/setup?topic=editor&step=debug');
   await focusedHeading(page,'F5');
   check('F5明确两份代码断点与变量不同宽度'+width,await page.locator('.setup-article').evaluate(el=>el.textContent.includes('A. 保留 Go 第1课的源码')&&el.textContent.includes('B. 使用第9节的变量示例')&&el.textContent.includes('不代表变量和断点位置相同')&&el.textContent.includes('main 还没有 name/message')));
   await page.goto(BASE+'#/search?q='+encodeURIComponent('go.mod file not found'));
   const found=page.locator('.setup-search-result a[href*="topic=go"]');await found.waitFor();
   check('错误搜索给直达步骤宽度'+width,(await found.getAttribute('href')).includes('step=missing-module'));
   await found.click();await focusedHeading(page,'go.mod file not found');
   check('读复制没有写学习记录宽度'+width,JSON.stringify(await learningProgress(page))===JSON.stringify(baseline));
  }
  await page.goto(BASE+'#/search?q='+encodeURIComponent('cannot find main module'));
  const alternative=page.locator('.setup-search-result a[href*="topic=go"]');await alternative.waitFor();
  check('cannot find main module同样直达模块修复',(await alternative.getAttribute('href')).includes('step=missing-module'));
  await alternative.click();await focusedHeading(page,'go.mod file not found');
  check('全部阅读操作后学习记录仍保留',JSON.stringify(await learningProgress(page))===JSON.stringify(baseline));
  await page.goto(BASE+'#/setup?topic=go&step=unknown-example');
  await page.waitForFunction(()=>document.activeElement.id==='main');
  check('未知step安全回到普通教程',await page.locator('.setup-article').evaluate(el=>el.textContent.includes('go env GOMOD')));
  check('未知step没有写学习记录',JSON.stringify(await learningProgress(page))===JSON.stringify(baseline));
  const cleanContext=await browser.newContext();
  const cleanPage=await cleanContext.newPage();
  await cleanPage.goto(BASE+'#/lesson/go-01');
  const source=await cleanPage.locator('#lesson-code').inputValue();
  check('无草稿Go01实际编辑器源码匹配调试A',source.includes('fmt.Println(greeting("Go"))')&&!/message\s*:=/.test(source));
  const cleanProgress=await learningProgress(cleanPage);
  check('打开默认源码没有自动完成课时',cleanProgress.completed.length===0);
  await cleanContext.close();
  check('无脚本异常',errors.length===0);
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed:checks.length,checks,errors},null,2));
  console.log(JSON.stringify({passed:checks.length,errors,evidence:output}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
