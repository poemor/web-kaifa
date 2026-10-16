/* Execute the exact HTML answers published in the chapters, without learner state. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const checks=JSON.parse(fs.readFileSync(path.join(root,'docs/courses/answer-checks.json'),'utf8')).filter(x=>x.language==='html');
function code(check){
 const text=fs.readFileSync(path.join(root,'docs/courses',check.chapter.split('-')[0],check.chapter+'.md'),'utf8');
 const sections=[...text.matchAll(/### 参考答案[^\n]*\n([\s\S]*?)(?=\n#{1,3} |\n参考：|$)/g)];
 const block=check.section?text.split('## '+check.section+'\n')[1]?.split(/\n## /)[0]:sections[check.answer]?.[1];
 assert(block,JSON.stringify(check));
 const blocks=[...block.matchAll(/```html\n([\s\S]*?)\n```/g)];
 assert.equal(blocks.length,1,check.chapter+' must publish one complete HTML answer');
 return blocks[0][1];
}
(async()=>{
 const pages=checks.map(code);
 const server=http.createServer((req,res)=>{
  const match=req.url.match(/^\/(\d+)\/index\.html(?:\?|$)/);
  if(!match||!pages[Number(match[1])]){res.writeHead(404);res.end('not found');return;}
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end(pages[Number(match[1])]);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch(process.env.COURSE_BROWSER_EXECUTABLE?{executablePath:process.env.COURSE_BROWSER_EXECUTABLE,headless:true}:{channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
 let count=0;
 try{
  for(let index=0;index<checks.length;index++){
   const check=checks[index],page=await browser.newPage({viewport:{width:768,height:900}}),logs=[],errors=[];
   page.on('console',m=>{if(m.type()==='log')logs.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`http://127.0.0.1:${server.address().port}/${index}/index.html`);
   for(const [selector,value] of Object.entries(check.fills||{}))await page.locator(selector).fill(value);
   for(const selector of check.clicks||[])await page.locator(selector).click();
   if(check.title)assert.equal(await page.title(),check.title,check.chapter);
   for(const [selector,value] of Object.entries(check.text||{}))await page.locator(selector).filter({hasText:value}).waitFor();
   for(const [selector,value] of Object.entries(check.text||{}))assert.equal(await page.locator(selector).first().textContent(),value,check.chapter+' '+selector);
   for(const [selector,value] of Object.entries(check.count||{}))assert.equal(await page.locator(selector).count(),value,check.chapter+' '+selector);
   for(const [selector,values] of Object.entries(check.style||{}))for(const [key,value] of Object.entries(values))assert.equal(await page.locator(selector).first().evaluate((el,key)=>getComputedStyle(el)[key],key),value,check.chapter+' '+key);
   for(const [selector,values] of Object.entries(check.attributes||{}))for(const [key,value] of Object.entries(values))assert.equal(await page.locator(selector).getAttribute(key),value,check.chapter+' '+key);
   for(const [selector,values] of Object.entries(check.box||{}))for(const [key,value] of Object.entries(values))assert.equal((await page.locator(selector).boundingBox())[key],value,check.chapter+' '+key);
   for(const [selector,id] of Object.entries(check.labels||{})){await page.locator(selector).click();assert.equal(await page.evaluate(()=>document.activeElement.id),id,check.chapter+' label');}
   for(const selector of check.invalidForms||[])assert.equal(await page.locator(selector).evaluate(el=>el.checkValidity()),false,check.chapter+' validation');
   for(const [selector,widths] of Object.entries(check.grid||{}))for(const [width,columns] of Object.entries(widths)){
    await page.setViewportSize({width:Number(width),height:900});assert.equal(await page.locator(selector).evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),columns,check.chapter+' columns '+width);
   }
   if(check.noOverflow)for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),check.chapter+' overflow '+width);}
   if(check.console)assert.deepEqual(logs,check.console,check.chapter+' output');
   assert.deepEqual(errors,[],check.chapter+' runtime error');await page.close();count++;
  }
  console.log(`PASS: ${count} authored HTML answers checked in a real browser.`);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
