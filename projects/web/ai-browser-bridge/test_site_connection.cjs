/* Website discovery and extension lifecycle in isolated fixtures; no personal profile. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),qa=path.join(root,'.qa/site-connection');
fs.mkdirSync(qa,{recursive:true});
const files=['manifest.json','providers.js','background.js','bridge.js','panel.html','panel.js','panel.css','theme.css','workbook-sites.js','site-bridge.js','panel-mode.js'];
const extension=fs.mkdtempSync(path.join(qa,'extension-'));
for(const file of files)fs.copyFileSync(path.join(__dirname,file),path.join(extension,file));
// Invoke the registered production toolbar handler without accessing any user browser.
const workerFile=path.join(extension,'background.js');
fs.writeFileSync(workerFile,fs.readFileSync(workerFile,'utf8')
 .replace('chrome.action.onClicked.addListener(async tab=>{','chrome.action.onClicked.addListener(globalThis.__testClick=async tab=>{')
 .replace('chrome.runtime.onInstalled?.addListener(async details=>{','((fn)=>{globalThis.__testInstall=fn;})(async details=>{'));
// Deliberately omit automatic document-start injection: reproduce a previously open tab.
const manifest=JSON.parse(fs.readFileSync(path.join(extension,'manifest.json')));
delete manifest.content_scripts;fs.writeFileSync(path.join(extension,'manifest.json'),JSON.stringify(manifest));
(async()=>{
 const context=await chromium.launchPersistentContext(fs.mkdtempSync(path.join(qa,'profile-')),{channel:'msedge',headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
 try{
  await context.setOffline(true);
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());if(url.protocol==='chrome-extension:')return route.continue();
   if(url.hostname!=='zhouwu97.github.io')return route.abort();
   let file=path.resolve(root,'.'+decodeURIComponent(url.pathname.replace(/^\/web-kaifa\//,'/')));
   if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'missing'});
   return route.fulfill({contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[path.extname(file)]||'text/plain',body:fs.readFileSync(file)});
  });
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');
  const page=await context.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.setDefaultTimeout(12000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://zhouwu97.github.io/web-kaifa/#/lesson/go-01');
  if(process.env.BRIDGE_CONNECTION_PROBE){
   console.log(await worker.evaluate(async()=>{
    const tab=(await chrome.tabs.query({})).find(t=>t.url?.startsWith('https://zhouwu97.github.io/web-kaifa/'));
    try{await chrome.scripting.executeScript({target:{tabId:tab.id,frameIds:[0]},files:['workbook-sites.js','site-bridge.js']});return 'late injection succeeded';}
    catch(e){return 'late injection rejected: '+e.message;}
   }));return;
  }
  if(await page.locator('#assistant-toggle').getAttribute('aria-expanded')==='false')await page.locator('#assistant-toggle').click();
  await page.locator('#assistant-install').click();
  await page.locator('#connection-state[data-phase=unavailable]').waitFor({timeout:7000});
  assert.equal(await page.getByRole('button',{name:'连接已安装扩展',exact:true}).count(),1,'help must offer a real connection action');
  await page.locator('#connection-retry').click();
  await page.locator('#connection-state[data-phase=unavailable]').waitFor({timeout:7000});
  assert.match(await page.locator('#connection-detail').textContent(),/不能据此判断/,'no response must not be treated as proof of no installation');
  await page.screenshot({path:path.join(qa,'connection-unavailable.png')});
  await page.getByRole('button',{name:'稍后连接',exact:true}).click();
  await page.locator('#assistant-question').fill('保留我的问题');
  await page.locator('#assistant-install').click();
  // A detected address alone is not a live panel. It must complete the frame handshake.
  await page.evaluate(()=>{
   const marker=document.createElement('meta');marker.name='workbook-extension';marker.content='chrome-extension://'+'a'.repeat(32)+'/panel.html';marker.dataset.version='fixture';document.head.append(marker);
   postMessage({type:'workbook:extension-available'},location.origin);
  });
  await page.locator('#connection-state[data-phase=connecting]').waitFor();
  const seconds=await page.locator('#connection-state-title').textContent();
  await page.waitForFunction(first=>document.querySelector('#connection-state-title').textContent!==first,seconds);
  await page.locator('#connection-state[data-phase=failed]').waitFor();
  assert.match(await page.locator('#connection-state-title').textContent(),/已检测到.*fixture/);
  assert.equal(await page.locator('#connection-install-guide').isVisible(),false);
  assert.equal(await page.locator('#assistant-bridge-frame').count(),0);
  await page.screenshot({path:path.join(qa,'connection-failed.png')});
  await page.locator('#connection-retry').click();
  await page.locator('#connection-state[data-phase=connecting]').waitFor();
  // Exercise the toolbar's actual listener, including its late-injection fallback.
  await worker.evaluate(async()=>{
   const tab=(await chrome.tabs.query({})).find(t=>t.url?.startsWith('https://zhouwu97.github.io/web-kaifa/'));
   await globalThis.__testClick(tab);
  });
  await page.locator('body.assistant-connected').waitFor({timeout:12000});
  assert.equal(await page.locator('#connection-dialog').evaluate(d=>d.open),false);
  assert.equal(await page.frameLocator('#assistant-bridge-frame').locator('#question').inputValue(),'保留我的问题');
  assert.equal(await page.locator('#assistant-bridge-frame').count(),1);
  const diagnostics=await page.evaluate(()=>WorkbookExtensionConnection.getState());
  assert.equal(diagnostics.phase,'connected');assert.equal(diagnostics.version,JSON.parse(require('node:fs').readFileSync(path.join(__dirname,'manifest.json'))).version);
  const oldFrame=await page.locator('#assistant-bridge-frame').getAttribute('src');
  await page.evaluate(()=>{
   document.querySelector('meta[name="workbook-extension"]').dataset.version='update-fixture';
   postMessage({type:'workbook:extension-available'},location.origin);
  });
  await page.waitForFunction(previous=>document.body.classList.contains('assistant-connected') && document.querySelector('#assistant-bridge-frame').src!==previous,oldFrame);
  assert.equal(await page.frameLocator('#assistant-bridge-frame').locator('#question').inputValue(),'保留我的问题','version change restores extension draft');
  // Updating the extension also repairs another already-open site, without a page refresh.
  const second=await context.newPage();await second.goto('https://zhouwu97.github.io/web-kaifa/#/lesson/web-01');
  assert.equal(await second.locator('#assistant-bridge-frame').count(),0);
  await worker.evaluate(()=>globalThis.__testInstall({reason:'update'}));
  await second.locator('body.assistant-connected').waitFor();
  assert.equal(await page.locator('#assistant-bridge-frame').count(),1,'re-injection must not duplicate the panel');
  await page.locator('body.assistant-connected').waitFor();
  const beforeReload=await page.locator('#assistant-bridge-frame').getAttribute('src');
  await worker.evaluate(()=>globalThis.__testInstall({reason:'update'}));
  await page.waitForFunction(previous=>document.body.classList.contains('assistant-connected') && document.querySelector('#assistant-bridge-frame').src!==previous,beforeReload);
  assert.equal(await page.frameLocator('#assistant-bridge-frame').locator('#question').inputValue(),'保留我的问题','same-version reload preserves draft too');
  assert.deepEqual(errors,[]);
  console.log('PASS: no response differs from panel failure; countdown advances; toolbar and update inject into already-open pages; one panel, draft retained, no refresh. Isolated MV3, no vendor requests.');
 }finally{await context.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
