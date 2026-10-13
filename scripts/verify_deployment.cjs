/* Verify the actual published files and every learning destination after Pages deploys. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const BASE=process.env.SITE_TEST_URL||'https://zhouwu97.github.io/web-kaifa/';
const commit=process.env.RELEASE_SHA||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const normalized=value=>value.replace(/\r\n/g,'\n');
(async()=>{
  const response=await fetch(BASE+'?release='+encodeURIComponent(commit));
  assert(response.ok,'published entry responds');
  const html=normalized(await response.text());
  assert.equal(html,normalized(fs.readFileSync(path.join(root,'index.html'),'utf8')),'published entry matches this checkout');
  const assets=[];
  for(const match of html.matchAll(/(?:src|href)="([^"?]+\.(?:js|css))\?v=([a-f0-9]{12})"/g)){
    const response=await fetch(BASE+match[1]+'?v='+match[2]);
    assert(response.ok,match[1]+' is available');
    const content=normalized(await response.text());
    assert.equal(content,normalized(fs.readFileSync(path.join(root,match[1]),'utf8')),match[1]+' matches the source');
    assert.equal(crypto.createHash('sha256').update(content).digest('hex').slice(0,12),match[2],match[1]+' content hash');
    assets.push({path:match[1],version:match[2]});
  }
  const downloads=JSON.parse(fs.readFileSync(path.join(root,'assets/downloads/followup-manifest.json'),'utf8')).examples.map(item=>item.download);
  const binaries=[...downloads,'assets/downloads/vscode-go-starter.zip',...fs.readdirSync(path.join(root,'assets/images/tutorials')).filter(name=>/\.(png|jpe?g|webp)$/.test(name)).map(name=>'assets/images/tutorials/'+name)];
  const payloads=await Promise.all(binaries.map(async file=>{
    const response=await fetch(BASE+file+'?release='+encodeURIComponent(commit));
    assert(response.ok,file+' published payload responds');
    const bytes=Buffer.from(await response.arrayBuffer()),expected=fs.readFileSync(path.join(root,file));
    assert.equal(bytes.compare(expected),0,file+' published bytes match reviewed source');
    return {path:file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
  }));
  const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
  const routes=[],errors=[],failed=[];
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    page.on('pageerror',error=>errors.push(error.message));
    page.on('requestfailed',request=>failed.push(request.url()));
    await page.goto(BASE+'?release='+encodeURIComponent(commit));
    await page.locator('main h1').first().waitFor();
    const data=await page.evaluate(()=>({curriculum:window.LEARNING_CURRICULUM,lab:window.LEARNING_LAB,adaptation:window.LEARNING_ADAPTATIONS,guides:window.GETTING_STARTED}));
    const destinations=[
      ...Object.values(data.curriculum).flatMap(course=>course.lessons.map(lesson=>['/lesson/'+lesson.id,lesson.id==='go-02'?data.adaptation.goBeginner02.title:lesson.title])),
      ...data.curriculum.web.followups.map((lesson,index)=>['/followup/web/'+index,lesson.title]),
      ...data.lab.topics.map(topic=>['/topic/'+topic.id,topic.title]),
      ...data.lab.exercises.map(exercise=>['/exercise/'+exercise.id,exercise.title]),
      ...data.guides.map(guide=>['/setup?topic='+guide.id,guide.title]),
      ['/home','今天，写一点能运行的代码。'],['/web','从第一张网页开始'],['/go','从一个 Go 程序开始'],
      ['/knowledge','把知识连成一张地图'],['/practice','挑一个任务，留下实际结果'],['/ai','学到哪儿，问到哪儿'],
      ['/ai-method','怎样用 AI 开发'],['/resources','要查的时候，有地方查'],['/progress','留下自己做过的事']
    ];
    for(const [hash,title] of destinations){
      await page.evaluate(value=>location.hash=value,hash);
      await page.waitForFunction(value=>document.querySelector('main h1')?.textContent===value,title);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),hash+' desktop overflow');
      routes.push(hash);
    }
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('web-kaifa-study-v1')).completed.length),0,'reading does not complete lessons');
    assert.deepEqual(errors,[],'no runtime errors');
    assert.deepEqual(failed,[],'no failed page requests');
    const evidence={url:BASE,commit,verifiedAt:new Date().toISOString(),assets,payloads,routes,errors,failedRequests:failed};
    fs.mkdirSync(path.join(root,'.qa'),{recursive:true});
    fs.writeFileSync(path.join(root,'.qa/deployment-verification.json'),JSON.stringify(evidence,null,2)+'\n');
    console.log(`PASS: published entry, ${assets.length} scripts/styles and ${payloads.length} downloads/screenshots match ${commit.slice(0,7)}; ${routes.length} learning destinations render without runtime errors or failed requests.`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
