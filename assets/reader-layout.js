/* Reading presentation only: one sidebar, original content and interaction owners. */
(() => {
  'use strict';
  const readingRoutes = new Set(['setup', 'learn', 'go', 'web', 'topic', 'followup', 'lesson', 'exercise', 'ai-method']);
  let sectionsObserver, tablesObserver, sectionResizeFrame, sectionScrollFrame, selectedSection, updateCurrentSection;

  function closeMobileDirectory() {
    if (matchMedia('(max-width: 960px)').matches && document.querySelector('#sidebar').dataset.open === 'true') document.querySelector('#menu-toggle').click();
  }
  function foldPreparation(block, label) {
    if (!block || block.closest('.reader-preparation')) return;
    const details = document.createElement('details'), summary = document.createElement('summary');
    details.className = 'reader-preparation'; summary.textContent = label;
    block.replaceWith(details); details.append(summary, block);
  }
  function sectionLinks(headings, route) {
    const nav = document.createElement('nav'); nav.className = 'reader-section-links'; nav.setAttribute('aria-label','本页内容');
    const title = document.createElement('p'); title.className='reader-directory-label'; title.textContent='本页目录'; nav.append(title);
    headings.forEach((heading,index) => {
      if (!heading.id) heading.id=`reader-${route}-${index}`;
      heading.tabIndex=-1;
      const button=document.createElement('button'); button.type='button'; button.dataset.readerJump=heading.id;
      button.textContent=heading.textContent; nav.append(button);
    });
    return nav;
  }
  function watchSections(outline) {
    const buttons=[...outline.querySelectorAll('[data-setup-jump],[data-knowledge-jump],[data-book-jump],[data-reader-jump]')];
    const targets=buttons.map(button=>({button,target:document.getElementById(button.dataset.setupJump||button.dataset.knowledgeJump||button.dataset.bookJump||button.dataset.readerJump)})).filter(item=>item.target);
    if (!targets.length) return;
    updateCurrentSection=()=>{
      // A jump near the page bottom cannot always reach the observer band.
      // Keep the chosen section highlighted until the learner scrolls manually.
      if(selectedSection)return;
      const shown=targets.filter(({target})=>target.getClientRects().length);
      if(!shown.length)return;
      const passed=shown.filter(({target})=>target.getBoundingClientRect().top<=128);
      const atEnd=scrollY+innerHeight>=document.documentElement.scrollHeight-2;
      const current=atEnd?shown.at(-1):(passed.at(-1)||shown[0]);
      targets.forEach(({button,target})=>{if(target===current.target)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');});
    };
    sectionsObserver=new IntersectionObserver(updateCurrentSection,{rootMargin:`-88px 0px -${Math.round(innerHeight*0.55)}px 0px`});
    targets.forEach(({target})=>sectionsObserver.observe(target));
  }
  function prepareTables(main) {
    [...main.querySelectorAll('.table-scroll')].forEach(wrapper=>{
      const table=wrapper.querySelector('table'); if(!table)return;
      const columns=Math.max(...[...table.rows].map(row=>[...row.cells].reduce((count,cell)=>count+cell.colSpan,0)),1);
      table.style.setProperty('--reader-columns',String(columns));
      const hint=document.createElement('p');hint.className='reader-table-hint';hint.textContent='左右滑动查看全部列，也可以聚焦表格后使用方向键。';hint.hidden=true;wrapper.before(hint);
      const update=()=>{
        const overflow=wrapper.scrollWidth>wrapper.clientWidth+1;hint.hidden=!overflow;
        if(overflow){wrapper.tabIndex=0;wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','表格，可左右滚动查看全部列');}
        else{wrapper.removeAttribute('tabindex');wrapper.removeAttribute('role');wrapper.removeAttribute('aria-label');}
      };
      if(!tablesObserver)tablesObserver=new ResizeObserver(entries=>entries.forEach(entry=>entry.target.__readerTableUpdate?.()));
      wrapper.__readerTableUpdate=update;tablesObserver.observe(wrapper);update();
    });
  }
  function prepareCode(main) {
    main.querySelectorAll('pre:has(code),.book-prose pre,.setup-article pre,.knowledge-prose pre,.lab-code pre').forEach(pre=>{
      // Preserve authored line breaks, while allowing long commands to scroll locally.
      const hint=document.createElement('p');hint.className='reader-code-hint';hint.textContent='长行可左右滑动；聚焦代码框后也可用方向键。';hint.hidden=true;pre.before(hint);
      const update=()=>{
        const overflow=pre.clientWidth>0&&pre.scrollWidth>pre.clientWidth+1;hint.hidden=!overflow;
        if(overflow){pre.tabIndex=0;pre.setAttribute('role','region');pre.setAttribute('aria-label','代码或输出，可左右滚动查看完整行');}
        else{pre.removeAttribute('tabindex');pre.removeAttribute('role');pre.removeAttribute('aria-label');}
      };
      if(!tablesObserver)tablesObserver=new ResizeObserver(entries=>entries.forEach(entry=>entry.target.__readerTableUpdate?.()));
      pre.__readerTableUpdate=update;tablesObserver.observe(pre);update();
    });
  }
  function refresh(route) {
    sectionsObserver?.disconnect();tablesObserver?.disconnect();sectionsObserver=tablesObserver=null;
    selectedSection=null;
    updateCurrentSection=null;
    const main=document.querySelector('#main'),outline=document.querySelector('#reader-outline');
    outline.replaceChildren();outline.hidden=true;
    const reading=readingRoutes.has(route)&&!main.querySelector('.empty-state');document.body.classList.toggle('reading-view',reading);
    if(!reading)return;
    document.querySelector('#site-navigation').open=false;
    const menu=document.querySelector('#menu-toggle');menu.textContent='目录';menu.setAttribute('aria-label','展开阅读目录');
    if(route==='setup'){
      const label=document.createElement('p');label.className='reader-directory-label';label.textContent='起步教程';outline.append(label);
      const topics=main.querySelector('.setup-nav'),steps=main.querySelector('.setup-toc');
      if(topics)outline.append(topics);if(steps)outline.append(steps);
      foldPreparation(main.querySelector('.setup-route-hint'),'准备顺序与使用说明');
    }else if(route==='learn'){
      const local=main.querySelector('.book-page-toc');if(local)outline.append(local);
      foldPreparation(main.querySelector('.book-prerequisites'),'用到前面学过的知识');
    }else if(route==='topic'||route==='followup'){
      const back=main.querySelector('.lab-back');if(back)outline.append(back);
      // Closed supplementary guides stay with their content; only the primary guide moves.
      const local=main.querySelector(route==='followup'?'.followup-guide > .knowledge-toc':'#main > .knowledge-guide > .knowledge-toc');
      if(local)outline.append(local);
      if(route==='followup'){
        foldPreparation(main.querySelector('.task-box'),'本阶段任务');
        foldPreparation(main.querySelector('.book-prerequisites'),'开始前，确认这些知识');
        const preparation=main.querySelector('.followup-start'),actions=preparation?.querySelector('.button-row');
        if(actions){actions.classList.add('reader-project-tools');preparation.after(actions);}
        foldPreparation(preparation,'下载后怎样准备与启动');
      }
    }else if(route==='exercise'||route==='ai-method'){
      const back=main.querySelector('.lab-back');if(back)outline.append(back);
      const headings=[...main.querySelectorAll('h2')].filter(heading=>!heading.closest('details,[hidden],.exercise-plan'));
      outline.append(sectionLinks(headings,route));
    }
    outline.hidden=!outline.children.length;watchSections(outline);prepareTables(main);prepareCode(main);
  }
  // Close before the existing delegated jump handlers measure or focus the target.
  document.addEventListener('click',event=>{
    const selected=event.target.closest('#sidebar a, #reader-outline [data-setup-jump], #reader-outline [data-knowledge-jump], #reader-outline [data-book-jump], #reader-outline [data-reader-jump]');
    if(selected)closeMobileDirectory();
    if(selected?.closest('#reader-outline')&&selected.matches('[data-setup-jump],[data-knowledge-jump],[data-book-jump],[data-reader-jump]')){
      document.querySelectorAll('#reader-outline [aria-current="location"]').forEach(button=>button.removeAttribute('aria-current'));
      selected.setAttribute('aria-current','location');
      selectedSection=selected.dataset.setupJump||selected.dataset.knowledgeJump||selected.dataset.bookJump||selected.dataset.readerJump;
    }
    const jump=event.target.closest('[data-reader-jump]');if(!jump)return;
    const target=document.getElementById(jump.dataset.readerJump);
    if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});}
  },true);
  ['wheel','touchmove'].forEach(type=>window.addEventListener(type,()=>{selectedSection=null;},{passive:true}));
  window.addEventListener('pointerdown',event=>{if(!event.target.closest('#reader-outline'))selectedSection=null;});
  window.addEventListener('keydown',event=>{
    if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)&&!event.target.closest('input,textarea,select,[contenteditable="true"]'))selectedSection=null;
  });
  window.addEventListener('scroll',()=>{
    cancelAnimationFrame(sectionScrollFrame);
    sectionScrollFrame=requestAnimationFrame(()=>updateCurrentSection?.());
  },{passive:true});
  window.addEventListener('resize',()=>{
    cancelAnimationFrame(sectionResizeFrame);
    sectionResizeFrame=requestAnimationFrame(()=>{
      sectionsObserver?.disconnect();sectionsObserver=null;
      if(document.body.classList.contains('reading-view'))watchSections(document.querySelector('#reader-outline'));
    });
  });
  window.ReaderLayout={refresh};
})();
