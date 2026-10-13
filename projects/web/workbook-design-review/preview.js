/* Standalone design proposal. Does not access storage or call a model. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const courses = window.LEARNING_CURRICULUM;
  let track = 'web', lessonId = 'web-01', tab = 'task', audience = 'new', opener = null;
  const drafts = new Map(), questions = new Map();
  const lesson = () => courses[track].lessons.find(l => l.id === lessonId) || courses[track].lessons[0];
  const trackName = () => track === 'web' ? 'Web 开发' : 'Go 后端';
  function remember() {
    const key = $('#main').dataset.lesson || lessonId;
    if ($('#editor')) drafts.set(key, $('#editor').value);
    const questionKey=$('#main').dataset.view==='lesson'?key:'custom';
    if ($('#question')) questions.set(questionKey, {question:$('#question').value, task:$('#with-task').checked});
  }
  function courseButtons() {
    return courses[track].lessons.map(l => `<button data-lesson="${l.id}" aria-current="${l.id===lessonId}">${String(l.day).padStart(2,'0')}　${esc(l.title)}</button>`).join('');
  }
  function home() {
    const l = lesson();
    return `<header class="welcome"><div><span class="eyebrow">WEB & GO / 你的开发练习册</span><h1>今天，写一点能运行的代码。</h1><p>选一节课，亲手改动，用结果验证理解。</p></div></header>
      <div class="start-options"><div class="choice"><span>学习方向</span><div class="segmented" aria-label="学习方向"><button data-track="web" aria-pressed="${track==='web'}">Web 开发</button><button data-track="go" aria-pressed="${track==='go'}">Go 后端</button></div></div><div class="choice"><label for="audience">我的起点</label><select id="audience"><option value="new" ${audience==='new'?'selected':''}>第一次写代码</option><option value="experienced" ${audience==='experienced'?'selected':''}>写过代码</option></select></div></div>
      <section class="today"><div><span class="eyebrow">从这里开始 · ${trackName()} / 第 ${l.day} 课</span><h2>${esc(l.title)}</h2><p>${esc(l.task)}</p><div class="actions"><button class="primary" data-enter>进入这一课 →</button><small>约 ${l.minutes} 分钟 · 可以分几次做</small></div></div><div class="session-steps"><h3>${audience==='new'?'这一课，你会这样学':'已有基础，可以这样学'}</h3><ol><li><span>01</span><div>${audience==='new'?'先读一个概念':'先看任务与验收'}<small>${audience==='new'?'带着问题看短例子':'确认自己能否独立完成'}</small></div></li><li><span>02</span><div>亲手改一处代码<small>预测结果，再运行</small></div></li><li><span>03</span><div>验收并记下发现<small>用实际结果确认掌握</small></div></li></ol></div></section>
      <div class="section-head"><h2>把小练习，连成一条路线</h2><p>按掌握情况安排，不必赶天数。</p></div><div class="routes">${Object.entries(courses).map(([key,c])=>`<article class="route"><header><h3>${key==='web'?'Web 开发':'Go 后端'}</h3><small>${c.lessons.length} 节起步课</small></header><p>${key==='web'?'页面结构 → 样式布局 → 交互与接口':'Go 语言 → HTTP 与数据库 → 测试与交付'}</p><button data-route="${key}">查看课程目录 →</button></article>`).join('')}</div>
      <nav class="secondary-links" aria-label="补充学习"><a href="#catalogue">查一个知识点 →</a><a href="../../../index.html#/practice">挑一个练习 ↗</a><a href="../../../index.html#/ai-method">怎样用 AI 开发 ↗</a></nav>`;
  }
  function taskPanel(l) {
    return `<section class="task"><span class="eyebrow">本课要留下的成果</span><h2>${esc(l.title)}</h2><p>${esc(l.task)}</p></section><section class="reading"><div class="section-head"><h2>先理解，再动手</h2><small>一次读懂一个概念</small></div><p>${esc(l.summary)}</p><details open><summary>本课需要理解什么</summary><div><ul>${l.concepts.map(c=>`<li>${esc(c)}</li>`).join('')}</ul><p>从其中一个概念开始，预测一次修改会发生什么，再动手验证。</p></div></details><details><summary>本课提示</summary><div>${esc(l.hint)}</div></details><a class="return-link" href="../../../index.html#/lesson/${l.id}">打开现有完整讲义 ↗</a></section><div class="next-action"><button class="primary" data-tab="code">开始动手 →</button><button data-help>卡住了，整理提问</button></div>`;
  }
  function codePanel(l) {
    return `<h2>${track==='web'?'改一点，看看结果':'在本机运行，留下结果'}</h2><p class="muted">${track==='web'?'修改后手动运行。草稿只在这次预览中保留。':'Go 代码需按讲义在本机运行，本预览不会执行 Go。'}</p><label class="code-label" for="editor">${esc(l.language.toUpperCase())} · 参考片段</label><textarea id="editor" class="editor" spellcheck="false">${esc(drafts.get(l.id)??l.starterCode)}</textarea><div class="actions">${track==='web'?'<button class="primary" id="run">运行预览</button>':''}<button data-help>带着问题求助</button></div><p class="status" id="run-status" role="status">${track==='web'?'尚未运行当前代码。':'请在本机保存文件并执行课程中的命令。'}</p>${track==='web'?'<iframe id="code-preview" title="手动运行的网页预览" sandbox="allow-scripts" hidden></iframe>':''}<div class="next-action"><button data-tab="review">去验收与笔记 →</button></div>`;
  }
  function reviewPanel(l) {
    return `<h2>用结果回答：真的做到了吗？</h2><p class="muted">先验证每一项，再完成小测。正式版继续沿用现有完成规则。</p><div class="review-checks">${l.checks.map(c=>`<label class="check"><input type="checkbox"><span>${esc(c)}</span></label>`).join('')}</div><label class="code-label" for="note">写下你的发现或仍没解决的问题</label><textarea id="note" rows="4" placeholder="我改了什么，运行结果怎样，为什么？"></textarea><p class="status">本页仅展示验收布局，勾选和笔记不会保存。</p><button disabled>设计预览不记录完成</button><div class="actions"><a href="../../../index.html#/lesson/${l.id}">到正式课程完成小测与验收 ↗</a></div>`;
  }
  function lessonView() {
    const l=lesson();
    return `<details class="mobile-course"><summary>${trackName()} · 课程目录</summary>${courseButtons()}</details><header class="lesson-intro"><span class="eyebrow">${trackName()} / 第 ${String(l.day).padStart(2,'0')} 课</span><h1>${esc(l.title)}</h1><p>${esc(l.summary)}</p><span class="lesson-meta">约 ${l.minutes} 分钟，可分几次做 · 预览不读取学习状态</span></header><div class="workspace"><div class="lesson-content"><div class="steps" role="tablist" aria-label="本课学习步骤">${[['task','读懂任务'],['code','动手写'],['review','验收记录']].map(([key,label],i)=>`<button id="tab-${key}" role="tab" aria-selected="${tab===key}" tabindex="${tab===key?0:-1}" aria-controls="lesson-panel" data-tab="${key}">${i+1}　${label}</button>`).join('')}</div><div id="lesson-panel" role="tabpanel" aria-labelledby="tab-${tab}">${tab==='task'?taskPanel(l):tab==='code'?codePanel(l):reviewPanel(l)}</div></div><div id="help-slot"></div></div>`;
  }
  function catalogue() {
    return `<header><span class="eyebrow">知识地图 / 按问题回看</span><h1>找到卡住的那个知识点。</h1><p class="muted">解释、例子与常见误区，放在一起查。</p></header><form class="toolbar" role="search"><div><label for="query">关键词</label><input id="query" type="search" placeholder="例如：HTML、请求、函数"></div><div><label for="filter-track">学习方向</label><select id="filter-track"><option value="all">全部方向</option><option value="web">Web 开发</option><option value="go">Go 后端</option></select></div></form><p id="result-count" class="status" role="status"></p><div class="topic-list" id="topics"></div>`;
  }
  function filterTopics() {
    const q=$('#query').value.trim().toLowerCase(), t=$('#filter-track').value;
    const topics=window.LEARNING_LAB.topics.filter(x=>(t==='all'||x.track===t)&&`${x.title} ${x.summary} ${x.group}`.toLowerCase().includes(q));
    $('#result-count').textContent=`找到 ${topics.length} 个知识点 · 点击进入现有完整内容`;
    $('#topics').innerHTML=topics.length?topics.map(x=>`<a class="topic" href="../../../index.html#/topic/${x.id}"><small>${x.track==='web'?'Web':'Go'} / ${esc(x.group)}</small><div><h2>${esc(x.title)}</h2><p>${esc(x.summary)}</p></div><span class="arrow" aria-hidden="true">↗</span></a>`).join(''):'<div class="empty"><h2>没有匹配的知识点</h2><p>试试更短的关键词，或切换学习方向。</p><button id="reset-search">清空筛选</button></div>';
  }
  function render(focus=false) {
    remember();
    const view=location.hash.slice(1)||'home';
    $('#open-help').setAttribute('aria-expanded','false');
    document.querySelectorAll('[data-view]').forEach(a=>{if(a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $('#breadcrumb').textContent=({home:'开始学习',lesson:trackName()+' / 课内工作台',catalogue:'知识地图'})[view]||'开始学习';
    $('#outline').innerHTML=view==='lesson'?`<section class="course-outline"><h2>${trackName()} · 课程目录</h2><div class="course-list">${courseButtons()}</div><small>预览不读取完成记录</small></section>`:'';
    $('#main').innerHTML=view==='lesson'?lessonView():view==='catalogue'?catalogue():home();
    $('#main').dataset.lesson=lessonId;
    $('#main').dataset.view=view;
    if(view==='catalogue')filterTopics();
    if(view==='lesson')$('#help-slot').append($('#help-template').content.cloneNode(true));
    else {const slot=document.createElement('div');slot.id='help-slot';slot.style.marginTop='24px';slot.append($('#help-template').content.cloneNode(true));$('#main').append(slot);}
    const saved=questions.get(view==='lesson'?lessonId:'custom');if(saved){$('#question').value=saved.question;$('#with-task').checked=saved.task;}
    $('#with-task').disabled=view!=='lesson';if(view!=='lesson')$('#with-task').checked=false;
    if(focus)$('#main').focus({preventScroll:true});
  }
  function showHelp(source) {
    opener=source;$('#help').hidden=false;$('.workspace')?.classList.add('help-open');$('#open-help').setAttribute('aria-expanded','true');
    $('#help-title').tabIndex=-1;$('#help-title').focus({preventScroll:true});
    if(innerWidth<1200)$('#help').scrollIntoView({block:'start'});
  }
  function closeHelp() {
    $('#help').hidden=true;$('.workspace')?.classList.remove('help-open');$('#open-help').setAttribute('aria-expanded','false');
    (opener?.isConnected?opener:$('#open-help')).focus();
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.track){remember();track=b.dataset.track;lessonId=courses[track].lessons[0].id;render();}
    if(b.hasAttribute('data-enter'))location.hash='lesson';
    if(b.dataset.route){remember();track=b.dataset.route;lessonId=courses[track].lessons[0].id;location.hash='lesson';}
    if(b.dataset.lesson){remember();lessonId=b.dataset.lesson;tab='task';render(true);window.scrollTo(0,0);}
    if(b.dataset.tab){remember();tab=b.dataset.tab;render();$('#tab-'+tab).focus({preventScroll:true});}
    if(b.id==='open-help'||b.hasAttribute('data-help')){if(b.id==='open-help'&&!$('#help').hidden)closeHelp();else showHelp(b);}
    if(b.id==='close-help'||b.id==='return-lesson')closeHelp();
    if(b.id==='reset-search'){$('#query').value='';$('#filter-track').value='all';filterTopics();$('#query').focus();}
    if(b.id==='run'){
      const frame=$('#code-preview'), l=lesson(), code=$('#editor').value;
      let html=code;if(l.language==='css')html=`<style>${code}</style><h1>我的网页</h1><p>修改样式后检查效果。</p>`;
      if(l.language==='javascript')html=`<p id="result">运行结果</p><script>${code.replace(/<\/script/gi,'<\\/script')}<\/script>`;
      frame.srcdoc=`<meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'">${html}`;
      frame.hidden=false;$('#run-status').textContent='已运行当前片段。请检查实际输出；需要项目环境的代码请在本机运行。';
    }
    if(b.id==='copy-prompt'){
      b.disabled=true;b.textContent='正在复制…';
      try{await navigator.clipboard.writeText($('#prompt').textContent);$('#help-status').textContent='已复制提问。到你使用的 AI 工具中粘贴。';}
      catch{$('#help-status').textContent='浏览器未允许复制，请选中下方文字手动复制。';const s=getSelection(),r=document.createRange();r.selectNodeContents($('#prompt'));s.removeAllRanges();s.addRange(r);}
      finally{b.disabled=false;b.textContent='复制提问';}
    }
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='query')filterTopics();
    if(e.target.id==='editor'){drafts.set(lessonId,e.target.value);const frame=$('#code-preview');if(frame){frame.removeAttribute('srcdoc');frame.hidden=true;}$('#run-status').textContent='内容已修改，需重新运行；本预览仅暂存草稿。';}
    if(e.target.id==='question'){$('#question').removeAttribute('aria-invalid');$('#help-status').classList.remove('error');$('#help-status').textContent='问题已修改，请重新生成提问文字。';$('#prompt-result').hidden=true;}
  });
  document.addEventListener('change',e=>{if(e.target.id==='filter-track')filterTopics();if(e.target.id==='audience'){audience=e.target.value;render();}if(e.target.id==='with-task')$('#prompt-result').hidden=true;});
  document.addEventListener('submit',e=>{
    e.preventDefault();if(e.target.id!=='help-form')return;
    const value=$('#question').value.trim();if(!value){$('#question').setAttribute('aria-invalid','true');$('#help-status').textContent='请写下你卡住的一步，再生成提问。';$('#help-status').classList.add('error');$('#question').focus();return;}
    $('#prompt').textContent=[$('#with-task').checked?`正在学习：${lesson().title}\n本课任务：${lesson().task}`:'',`我的问题：${value}`,'请先给一个检查思路，不直接写完整答案。告诉我怎样验证。'].filter(Boolean).join('\n\n');
    $('#prompt-result').hidden=false;$('#help-status').textContent='提问文字已生成，尚未发送给任何模型。';
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!$('#help').hidden){closeHelp();return;}
    if(e.target.getAttribute('role')!=='tab'||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();const names=['task','code','review'];const i=names.indexOf(tab);const next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:-1)+3)%3;remember();tab=names[next];render();$('#tab-'+tab).focus();
  });
  window.addEventListener('hashchange',()=>{render(true);window.scrollTo(0,0);});
  render();
})();
