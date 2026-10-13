/* Verify the actual published files and every learning destination after Pages deploys. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const BASE=process.env.SITE_TEST_URL||'https://zhouwu97.github.io/web-kaifa/';
const commit=process.env.RELEASE_SHA||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const normalized=value=>value.replace(/\r\n/g,'\n');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'docs/courses/catalog.json'),'utf8'));
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
async function mapLimited(items,operation){
  const results=new Array(items.length);let next=0;
  await Promise.all(Array.from({length:Math.min(6,items.length)},async()=>{
    while(next<items.length){const index=next++;results[index]=await operation(items[index]);}
  }));return results;
}
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
  const downloads=fs.readdirSync(path.join(root,'assets/downloads')).filter(name=>name.endsWith('.zip')).map(name=>'assets/downloads/'+name);
  const binaries=[...downloads,...fs.readdirSync(path.join(root,'assets/images/tutorials')).filter(name=>/\.(png|jpe?g|webp)$/.test(name)).map(name=>'assets/images/tutorials/'+name)];
  const payloads=await mapLimited(binaries,async file=>{
    const response=await fetch(BASE+file+'?release='+encodeURIComponent(commit));
    assert(response.ok,file+' published payload responds');
    const bytes=Buffer.from(await response.arrayBuffer()),expected=fs.readFileSync(path.join(root,file));
    assert.equal(bytes.compare(expected),0,file+' published bytes match reviewed source');
    return {path:file,bytes:bytes.length,sha256:digest(bytes)};
  });
  const documents=await mapLimited(catalog.lessons,async lesson=>{
    const file=`docs/courses/${lesson.track}/${lesson.id}.md`,response=await fetch(BASE+file+'?release='+encodeURIComponent(commit));
    assert(response.ok,file+' chapter document is published');
    const content=normalized(await response.text());
    assert.equal(content,normalized(fs.readFileSync(path.join(root,file),'utf8')),file+' matches the audited chapter');
    return {path:file,sha256:digest(content)};
  });
  const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true});
  const routes=[],errors=[],failed=[];
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    page.on('pageerror',error=>errors.push(error.message));
    page.on('requestfailed',request=>failed.push(request.url()));
    await page.goto(BASE+'?release='+encodeURIComponent(commit));
    await page.locator('main h1').first().waitFor();
    const data=await page.evaluate(()=>({curriculum:window.LEARNING_CURRICULUM,lab:window.LEARNING_LAB,adaptation:window.LEARNING_ADAPTATIONS,guides:window.GETTING_STARTED,book:window.COURSE_BOOK}));
    assert.equal(data.book.lessons.length,125,'all 125 audited chapters are loaded');
    assert.equal(data.book.lessons.filter(item=>item.track==='go').length,65,'65 Go chapters');
    assert.equal(data.book.lessons.filter(item=>item.track==='web').length,60,'60 Web chapters');
    const destinations=[
      ...data.book.lessons.map(lesson=>['/learn/'+lesson.track+'/'+lesson.id,lesson.title]),
      ...Object.values(data.curriculum).flatMap(course=>course.lessons.map(lesson=>['/lesson/'+lesson.id,lesson.id==='go-02'?data.adaptation.goBeginner02.title:lesson.title])),
      ...data.curriculum.web.followups.map((lesson,index)=>['/followup/web/'+index,lesson.title]),
      ...data.lab.topics.map(topic=>['/topic/'+topic.id,topic.title]),
      ...data.lab.exercises.map(exercise=>['/exercise/'+exercise.id,exercise.title]),
      ...data.guides.map(guide=>['/setup?topic='+guide.id,guide.title]),
      ['/home','今天，写一点能运行的代码。'],['/web',data.book.tracks.web.title],['/go',data.book.tracks.go.title],
      ['/knowledge','把知识连成一张地图'],['/practice','挑一个任务，留下实际结果'],['/ai','学到哪儿，问到哪儿'],
      ['/ai-method','怎样用 AI 开发'],['/resources','要查的时候，有地方查'],['/progress','留下自己做过的事']
    ];
    for(const [hash,title] of destinations){
      await page.evaluate(value=>location.hash=value,hash);
      await page.waitForFunction(value=>document.querySelector('main h1')?.textContent===value,title);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),hash+' desktop overflow');
      if(hash.startsWith('/learn/')){
        assert.equal(await page.locator('.book-prose').count(),1,hash+' renders one whole chapter');
        assert.equal(await page.locator('#main .book-page-toc').count(),0,hash+' has no central directory');
        assert.equal(await page.locator('#reader-outline .book-page-toc').count(),1,hash+' has its page directory in the rail');
        assert(await page.locator('.book-prose strong').count()>0,hash+' renders authored emphasis');
        assert.equal(await page.locator('#course-outline .book-outline [aria-current="page"]').count(),1,hash+' directory locates the current chapter');
        assert(await page.locator('.book-prose').evaluate(el=>el.textContent.length>300),hash+' contains substantive teaching text');
      }
      routes.push(hash);
    }
    const directoryPages=[];
    for(const track of ['go','web'])for(const level of data.book.levels){
      const lessons=data.book.lessons.filter(item=>item.track===track&&item.level===level.id);
      for(let number=1;number<=Math.ceil(lessons.length/8);number++){
        const hash=`/${track}?level=${level.id}&page=${number}`;
        await page.evaluate(value=>location.hash=value,hash);
        const expected=lessons.slice((number-1)*8,number*8).map(item=>'#/learn/'+track+'/'+item.id);
        await page.waitForFunction(value=>JSON.stringify([...document.querySelectorAll('#course-outline .book-outline a')].map(el=>el.getAttribute('href')))===JSON.stringify(value),expected);
        assert.equal(await page.locator('#main .book-outline').count(),0,'chapter catalogue stays outside the body');
        assert.equal(await page.locator('#book-stage').inputValue(),level.id,'stage selection reflects URL');
        assert.equal(await page.locator('.book-pagination [role="status"]').textContent(),`${number} / ${Math.ceil(lessons.length/8)} 页`,'page count reflects all chapters');
        directoryPages.push({track,level:level.id,page:number,chapters:expected});
      }
    }
    assert.equal(directoryPages.length,19,'all nineteen actual directory pages render');
    const chapterViewportChecks=[];
    for(const width of [320,768]){
      await page.setViewportSize({width,height:1000});
      for(const lesson of data.book.lessons){
        await page.evaluate(value=>location.hash=`/learn/${value.track}/${value.id}`,lesson);
        await page.waitForFunction(id=>document.querySelector('.book-prose')?.dataset.bookProse===id,lesson.id);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.body.scrollWidth<=innerWidth+1),lesson.id+' narrow viewport overflow '+width);
        assert.equal(await page.locator('#reader-outline .book-page-toc').count(),1,lesson.id+' narrow directory remains in the sidebar');
        assert.equal(await page.locator('#menu-toggle').getAttribute('aria-expanded'),'false',lesson.id+' narrow reading page starts with directory closed');
        chapterViewportChecks.push({chapter:lesson.id,width});
      }
    }
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('web-kaifa-study-v1')).completed.length),0,'reading does not complete lessons');
    assert.deepEqual(errors,[],'no runtime errors');
    assert.deepEqual(failed,[],'no failed page requests');
    const evidence={url:BASE,commit,verifiedAt:new Date().toISOString(),assets,payloads,documents,routes,directoryPages,chapterViewportChecks,errors,failedRequests:failed};
    fs.mkdirSync(path.join(root,'.qa'),{recursive:true});
    fs.writeFileSync(path.join(root,'.qa/deployment-verification.json'),JSON.stringify(evidence,null,2)+'\n');
    console.log(`PASS: published entry, ${assets.length} scripts/styles, ${documents.length} chapters and ${payloads.length} downloads/screenshots match ${commit.slice(0,7)}; ${routes.length} destinations, ${directoryPages.length} directory pages and ${chapterViewportChecks.length} narrow chapter views render without runtime errors or failed requests.`);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
