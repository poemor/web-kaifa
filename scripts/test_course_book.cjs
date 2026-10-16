/* Real examples and learner routes; project/environment checks are reported separately. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'docs/courses/catalog.json'),'utf8'));
const BASE=process.env.SITE_TEST_URL||'http://127.0.0.1:8743/';
const normal=s=>String(s).replace(/\r\n/g,'\n').trim();
const qa=path.join(root,'.qa','course-book');fs.mkdirSync(qa,{recursive:true});
const sampleRoot=fs.mkdtempSync(path.join(qa,'samples-'));
const report={chapters:data.lessons.length,go:[],browser:[],node:[],environmentDependent:[],routes:0};
for(const item of data.lessons){
 const spec=item.example,base=path.join(sampleRoot,item.id);fs.mkdirSync(base,{recursive:true});
 for(const [name,content] of Object.entries(spec.files||{})){
  const file=path.resolve(base,name);assert(file.startsWith(base+path.sep));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);
 }
 if(['go','go-test'].includes(spec.kind)){
  fs.writeFileSync(path.join(base,'go.mod'),`module ${spec.module||'example.com/book/'+item.id}\n\ngo 1.22\n`);
  const args=spec.kind==='go'?['run','.']:['test','./...'];
  const output=execFileSync('go',args,{cwd:base,encoding:'utf8',input:spec.input||'',timeout:60000,stdio:'pipe',env:{...process.env,BOOK_PORT:undefined}});
  if(spec.output!==undefined)assert.equal(normal(output),normal(spec.output),item.id+' actual output');
  if(spec.mutation){
   const file=path.join(base,spec.mutation.file),original=fs.readFileSync(file,'utf8');
   fs.writeFileSync(file,original.replace(spec.mutation.from,spec.mutation.to));
   let failed=false;try{execFileSync('go',['test','./...'],{cwd:base,stdio:'pipe',timeout:60000});}catch{failed=true;}
   assert(failed,item.id+' intentional bug must fail');fs.writeFileSync(file,original);
  }
  report.go.push(item.id);
 }else if(spec.kind==='node-test'){
  execFileSync(process.execPath,['--test','filter.test.mjs'],{cwd:base,stdio:'pipe'});
  if(spec.mutation){
   const file=path.join(base,spec.mutation.file),original=fs.readFileSync(file,'utf8');
   assert(original.includes(spec.mutation.from),item.id+' intentional bug target exists');
   fs.writeFileSync(file,original.replace(spec.mutation.from,spec.mutation.to));
   let failed=false;try{execFileSync(process.execPath,['--test','filter.test.mjs'],{cwd:base,stdio:'pipe'});}catch{failed=true;}
   assert(failed,item.id+' intentional bug must fail');fs.writeFileSync(file,original);
  }
  report.node.push(item.id);
 }else if(spec.kind!=='browser'){
  if(spec.directory)assert(fs.existsSync(path.join(root,spec.directory,'README.md')),item.id+' complete project');
  report.environmentDependent.push(item.id);
 }
}
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.resolve(sampleRoot,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(sampleRoot+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('not found');return;}
  res.setHeader('Content-Type',{'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml'}[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
 try{
  const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'#/lesson/go-01');
  await page.evaluate(()=>{const key='web-kaifa-study-v1',state=JSON.parse(localStorage.getItem(key));state.notes['go-01']='必须保留的原笔记';state.drafts['go-01']='package main\n// 自己的草稿';localStorage.setItem(key,JSON.stringify(state));});
  const state=await page.evaluate(()=>localStorage.getItem('web-kaifa-study-v1'));
  for(const width of [320,768,1440]){
   await page.setViewportSize({width,height:1000});
   for(const item of data.lessons){
    await page.goto(BASE+'#/learn/'+item.track+'/'+item.id);await page.locator(`[data-book-prose="${item.id}"]`).waitFor();
    assert.equal(await page.locator('main h1').count(),1,item.id+' one page heading');
    assert.equal(await page.locator('main h1').textContent(),item.title);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),item.id+' overflow '+width);
    assert(await page.locator('.book-prose pre').count()>0,item.id+' actual example');
    assert.equal(await page.locator('.book-answer[open]').count(),0,item.id+' independent practice before answer');
    report.routes++;
   }
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem('web-kaifa-study-v1')),state,'reading never writes records');
  await page.goto(BASE+'#/learn/go/go-program');
  await page.locator('[data-book-copy]').first().click();
  assert.equal(normal(await page.evaluate(()=>navigator.clipboard.readText())),normal(data.lessons.find(x=>x.id==='go-program').example.files['main.go']));
  await page.reload();assert.equal(await page.locator('main h1').textContent(),'Go 程序结构');
  await page.screenshot({path:path.join(qa,'go-program-desktop.png'),fullPage:true});
  for(const track of ['go','web']){
   await page.goto(BASE+'#/'+track);assert.equal(await page.locator('.book-overview dl dt').count(),4);
   assert.equal(await page.locator('#book-stage option').count(),4);
   assert.equal(await page.locator('#main .book-level li').count(),0);
  }
  for(const old of Object.keys(data.legacyLessons)){
   await page.goto(BASE+'#/lesson/'+old);await page.locator('.book-lesson').waitFor();
   assert.equal(await page.locator('.lab-concept[open]').count(),0,'broad references closed '+old);
  }
  await page.goto(BASE+'#/lesson/go-01');
  assert.equal(await page.locator('#lesson-code').inputValue(),'package main\n// 自己的草稿','new teaching preserves edited code');
  assert.equal(await page.locator('#lesson-note').inputValue(),'必须保留的原笔记');
  const standalone=await browser.newPage({viewport:{width:800,height:900}});
  for(const item of data.lessons.filter(x=>x.example.kind==='browser')){
   const spec=item.example,logs=[],sampleErrors=[];
   const onConsole=m=>{if(m.type()==='log')logs.push(m.text());},onError=e=>sampleErrors.push(e.message);
   standalone.on('console',onConsole);standalone.on('pageerror',onError);
   await standalone.goto(`http://127.0.0.1:${server.address().port}/${item.id}/index.html`);
   for(const fill of spec.fills||[])await standalone.locator(fill.selector).fill(fill.value);
   for(const click of spec.clicks||[])for(let i=0;i<click.times;i++)await standalone.locator(click.selector).click();
   if(spec.settleMs)await standalone.waitForTimeout(spec.settleMs);
   if(spec.reload)await standalone.reload();
   for(const [selector,text] of Object.entries(spec.text||{}))await standalone.locator(selector).filter({hasText:text}).waitFor();
   for(const [selector,text] of Object.entries(spec.text||{}))assert.equal(await standalone.locator(selector).textContent(),text,item.id+' real DOM');
   for(const [selector,count] of Object.entries(spec.count||{}))assert.equal(await standalone.locator(selector).count(),count,item.id+' element count');
   for(const [selector,values] of Object.entries(spec.attributes||{}))for(const [name,value] of Object.entries(values))assert.equal(await standalone.locator(selector).getAttribute(name),value);
   for(const [selector,values] of Object.entries(spec.style||{}))for(const [name,value] of Object.entries(values))assert.equal(await standalone.locator(selector).evaluate((el,key)=>getComputedStyle(el)[key],name),value,item.id+' computed style');
   for(const [selector,values] of Object.entries(spec.box||{}))for(const [name,value] of Object.entries(values))assert.equal((await standalone.locator(selector).boundingBox())[name],value,item.id+' measured size');
   if(spec.console)assert.deepEqual(logs,spec.console,item.id+' console order');
   if(item.id==='web-images'){const img=standalone.locator('img');await img.evaluate(el=>el.decode());assert(await img.evaluate(el=>el.naturalWidth>0));}
   if(spec.noOverflow)for(const width of [320,768,1440]){await standalone.setViewportSize({width,height:900});assert(await standalone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),item.id+' sample overflow');}
   assert.deepEqual(sampleErrors,[],item.id+' browser errors');
   standalone.removeListener('console',onConsole);standalone.removeListener('pageerror',onError);report.browser.push(item.id);
  }
  if(process.env.COURSE_HTTP_ONLY==='1'){
   report.skipped=['file:// offline opening (environment policy)'];
  }else{
   const filePage=await browser.newPage();await filePage.goto(pathToFileURL(path.join(root,'index.html')).href+'#/learn/go/go-program');await filePage.locator('.book-prose').waitFor();
   assert((await filePage.locator('.book-prose').textContent()).includes('fmt.Println'));
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(qa,'results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({...report,go:report.go.length,browser:report.browser.length,node:report.node.length,environmentDependent:report.environmentDependent.length}));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
