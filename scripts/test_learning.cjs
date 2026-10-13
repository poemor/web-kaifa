/* New learning views and runnable Web exercises. Requires Playwright and the local static server. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const BASE = process.env.SITE_TEST_URL || 'http://127.0.0.1:8743/';
const KEY = 'web-kaifa-study-v1';
const qa = path.resolve(__dirname, '../.qa');
fs.mkdirSync(qa, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(BASE);
    await page.waitForSelector('main h1');
    const lab = await page.evaluate(() => window.LEARNING_LAB);
    const before = await page.evaluate(key => localStorage.getItem(key), KEY);
    const navigate = async (hash, title) => {
      await page.evaluate(value => { location.hash = value; }, hash);
      await page.waitForFunction(value => document.querySelector('main h1')?.textContent === value, title);
    };
    await navigate('/knowledge', '把知识连成一张地图');
    assert.equal(await page.locator('.knowledge-item').count(), lab.topics.length);
    await page.locator('#lab-track').selectOption('go');
    await page.locator('#lab-level').selectOption('foundation');
    assert.equal(await page.locator('.knowledge-item').count(), lab.topics.filter(item => item.track === 'go' && item.level === 'foundation').length);
    await page.locator('#lab-query').fill('slice');
    assert(await page.locator('.knowledge-item').count()>=1);
    assert.equal(await page.locator('.knowledge-item h2 a[href="#/topic/go-collections"]').count(),1);
    assert.equal(await page.locator('#lab-query').evaluate(element => document.activeElement === element), true, 'filtering keeps input focus');
    assert(page.url().includes('track=go') && page.url().includes('q=slice'));
    await page.reload(); await page.waitForSelector('#lab-query');
    assert.equal(await page.locator('#lab-query').inputValue(), 'slice');
    assert.equal(await page.locator('#lab-track').inputValue(), 'go');
    assert(await page.locator('.knowledge-item').count()>=1);
    await page.locator('.knowledge-item h2 a[href="#/topic/go-collections"]').click();
    await page.waitForFunction(() => document.querySelector('main h1')?.textContent === 'slice、map 与 Unicode');
    await page.goBack(); await page.waitForSelector('#lab-query');
    assert.equal(await page.locator('#lab-query').inputValue(), 'slice', 'Back restores the filter route');
    await page.locator('#lab-query').fill('没有这个词');
    assert.equal(await page.locator('.knowledge-item').count(), 0);
    await page.locator('#lab-results [data-lab-clear]').click();
    assert.equal(await page.locator('.knowledge-item').count(), 24);
    assert.equal(await page.locator('#lab-query').evaluate(element => document.activeElement === element), true, 'removed clear button returns focus');
    await page.locator('#lab-query').fill('"><img src=x onerror="window.attack=true">');
    assert.equal(await page.locator('main img').count(), 0);
    assert.equal(await page.evaluate(() => window.attack), undefined);
    await navigate('/knowledge?track=web', '把知识连成一张地图');
    await page.screenshot({ path: path.join(qa, 'knowledge-desktop.png'), fullPage: true });
    for (const topic of lab.topics) {
      await navigate('/topic/' + topic.id, topic.title);
      assert.equal(await page.locator('.lab-points dt').count(), topic.points.length);
      assert.equal(await page.locator('.lab-recall').count(), 2);
      assert.equal(await page.locator('#complete-lesson').count(), 0);
      for (const a of await page.locator('main a').all()) {
        const href = await a.getAttribute('href');
        if (href?.startsWith('#/lesson/')) assert(href.slice(9).startsWith(topic.track + '-'));
      }
    }
    for (const exercise of lab.exercises) {
      await navigate('/exercise/' + exercise.id, exercise.title);
      assert.equal(await page.locator('.lab-cases tbody tr').count(), exercise.cases.length);
      assert.equal(await page.locator('[data-lab-demo]').count(), exercise.preview ? 1 : 0);
      if (exercise.preview) assert.equal(await page.locator('#lab-demo-frame').getAttribute('srcdoc'), null, 'demos wait for explicit Run');
    }
    assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), before, 'supplementary reading never changes records');
    await navigate('/practice?track=go&level=applied', '挑一个任务，留下实际结果');
    assert.equal(await page.locator('.exercise-item').count(), lab.exercises.filter(item => item.track === 'go' && item.level === 'applied').length);
    await page.locator('#lab-query').fill('JSON');
    assert((await page.locator('.exercise-item').count()) > 0);
    await page.locator('#lab-query').press('Enter');
    assert.equal(await page.locator('#lab-query').evaluate(element => document.activeElement === element), true);
    await navigate('/exercise/go-health', '用测试读懂 /health 与 /add');
    await page.locator('[data-lab-copy="checklist"]').click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert(copied.includes('我的实际结果') && copied.includes('- [ ]') && copied.includes('待填写'));
    assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), before, 'copying does not complete a lesson');
    await page.screenshot({ path: path.join(qa, 'exercise-go-desktop.png'), fullPage: true });
    await navigate('/exercise/web-data', '先写纯函数，再接页面');
    assert.equal(await page.locator('#lab-demo-frame').getAttribute('sandbox'), 'allow-scripts');
    await page.locator('[data-lab-demo]').click();
    await page.frameLocator('#lab-demo-frame').locator('#result').waitFor();
    assert((await page.frameLocator('#lab-demo-frame').locator('#result').textContent()).includes('HTML'));
    const isolated = await page.frameLocator('#lab-demo-frame').locator('body').evaluate(() => {
      try { void parent.document.body; return false; } catch { return true; }
    });
    assert(isolated, 'demo cannot access the workbook origin');
    await navigate('/topic/web-fetch', '请求、JSON 与四种状态');
    await page.screenshot({ path: path.join(qa, 'topic-desktop.png'), fullPage: true });
    await page.locator('#global-search').fill('404');
    await page.locator('#search-form').evaluate(form => form.requestSubmit());
    await page.waitForFunction(() => document.querySelector('main h1')?.textContent === '查找“404”');
    assert((await page.locator('.knowledge-item').count()) > 0 && (await page.locator('.exercise-item').count()) > 0, 'global search includes both learning types');
    const curriculum = await page.evaluate(() => window.LEARNING_CURRICULUM);
    await navigate('/lesson/go-03', curriculum.go.lessons[2].title);
    assert.equal(await page.locator('.lab-lesson').count(), 1);
    assert((await page.locator('#workbook-panel-task').textContent()).includes('slice、map'));
    await page.screenshot({ path: path.join(qa, 'lesson-enriched-desktop.png'), fullPage: true });
    for (const width of [320, 375, 414, 768]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [hash, title] of [
        ['/knowledge', '把知识连成一张地图'], ['/practice', '挑一个任务，留下实际结果'],
        ['/topic/go-collections', 'slice、map 与 Unicode'], ['/exercise/go-health', '用测试读懂 /health 与 /add'],
        ['/exercise/web-form', '做一个可用键盘填写的表单'], ['/web', 'Web 从网页基础到完整应用'], ['/go', 'Go 从语法入门到后端项目']
      ]) {
        await navigate(hash, title);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert(overflow <= 1, `${width}px ${hash}: overflow ${overflow}`);
        const wrappedButtons = await page.locator('main .button').evaluateAll(buttons => buttons.filter(button => {
          if (!button.checkVisibility()) return false;
          const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
          const tops = new Set();
          while (walker.nextNode()) {
            if (!walker.currentNode.textContent.trim()) continue;
            const range = document.createRange();
            range.selectNode(walker.currentNode);
            for (const rectangle of range.getClientRects()) tops.add(Math.round(rectangle.top));
          }
          return tops.size > 1;
        }).map(button => button.textContent));
        assert.deepEqual(wrappedButtons, [], `${width}px ${hash}: wrapping actions`);
      }
    }
    await page.setViewportSize({ width: 375, height: 900 });
    await navigate('/practice?track=web', '挑一个任务，留下实际结果');
    await page.screenshot({ path: path.join(qa, 'practice-mobile.png'), fullPage: true });
    await navigate('/exercise/web-request', '把 404、空数据与坏 JSON 都跑一遍');
    await page.screenshot({ path: path.join(qa, 'exercise-mobile.png'), fullPage: true });
    await page.goto(new URL('exercises/web/activity-filter/', BASE).href);
    await page.waitForSelector('#keyword');
    assert.equal(await page.locator('#activities li').count(), 3);
    await page.locator('#keyword').fill('  go  ');
    assert.equal(await page.locator('#activities li').count(), 1);
    assert((await page.locator('#activities').textContent()).includes('Go'));
    await page.locator('#keyword').fill('<b>');
    assert.equal(await page.locator('#activities li').count(), 0);
    assert(await page.locator('#empty').isVisible());
    await page.locator('#keyword').fill('');
    assert.equal(await page.locator('#activities li').count(), 3);
    await page.goto(new URL('exercises/web/request-states/', BASE).href);
    for (const [scenario, expected, state] of [['success', '已加载 2 场活动', 'success'], ['empty', '请求成功，但当前没有活动', 'empty'], ['missing', '请求失败：HTTP 404', 'error'], ['invalid', '请求失败：JSON 解析错误', 'error']]) {
      await page.locator('#scenario').selectOption(scenario);
      await page.locator('#load').click();
      await page.waitForFunction(value => document.querySelector('#status').textContent === value, expected);
      assert.equal(await page.locator('#view').getAttribute('data-state'), state);
      assert(!(await page.locator('#load').isDisabled()));
      assert.equal(await page.locator('#items li').count(), state === 'success' ? 2 : 0);
    }
    await page.route('**/items.json', async route => {
      await new Promise(resolve => setTimeout(resolve, 150));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.locator('#scenario').selectOption('success');
    await page.locator('#load').click();
    assert.equal(await page.locator('#view').getAttribute('data-state'), 'loading');
    assert(await page.locator('#load').isDisabled());
    await page.waitForFunction(() => document.querySelector('#view').dataset.state === 'empty');
    await page.unroute('**/items.json');
    await context.setOffline(true);
    await page.locator('#load').click();
    await page.waitForFunction(() => document.querySelector('#view').dataset.state === 'error');
    assert(!(await page.locator('#load').isDisabled()), 'failed requests restore controls');
    await context.setOffline(false);
    const filePage = await context.newPage();
    filePage.on('pageerror', error => errors.push(error.message));
    await filePage.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href + '#/knowledge?track=go');
    await filePage.waitForSelector('#lab-track');
    assert.equal(await filePage.locator('.knowledge-item').count(), 12, 'local file mode loads supplementary content');
    await filePage.locator('#lab-track').selectOption('web');
    assert.equal(await filePage.locator('.knowledge-item').count(), 12, 'URL filtering works in file mode');
    await filePage.close();
    assert.deepEqual(errors, [], 'browser runtime errors');
    console.log('PASS: 44 supplementary routes, filter and Back restoration, global search, safe manual previews, copy without progress, 4 widths, local file mode, and both Web exercise packs including real failures.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
