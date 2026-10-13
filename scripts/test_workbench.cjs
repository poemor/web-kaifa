/* Browser checks for the production workbench. Use the same server/dependencies as test_site.cjs. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const BASE = process.env.SITE_TEST_URL || 'http://127.0.0.1:8743/';
const qa = path.resolve(__dirname, '../.qa');
const KEY = 'web-kaifa-study-v1';
fs.mkdirSync(qa, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (!request.url().startsWith(BASE) && /^https?:/.test(request.url())) external.push(request.url()); });
    await page.goto(BASE + '#/lesson/web-01');
    await page.locator('[data-lesson-tab="task"]').waitFor();
    const go = async hash => {
      await page.evaluate(value => { location.hash = value; }, hash);
      await page.waitForFunction(value => location.hash === value && document.body.classList.contains('lesson-view') === value.startsWith('#/lesson/'), hash);
      if (hash.startsWith('#/lesson/')) await page.waitForFunction(id => document.querySelector('#course-outline [aria-current="page"]')?.getAttribute('href') === id, hash);
      else await page.waitForFunction(() => document.querySelector('#course-outline').hidden);
    };
    assert.equal(await page.locator('#assistant-toggle').getAttribute('aria-expanded'), 'false', 'assistant starts collapsed');
    assert.equal(await page.locator('#site-navigation').evaluate(el => el.open), false);
    assert(await page.locator('#course-outline').evaluate(el => el.getBoundingClientRect().top < 200), 'course outline has priority');
    await page.locator('#assistant-toggle').click();
    assert.equal(await page.locator('#course-outline a').count(), 14);
    await page.screenshot({ path: path.join(qa, 'workbench-lesson-desktop.png'), fullPage: true });
    await page.locator('[data-lesson-tab="task"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-lesson-tab="code"]').getAttribute('aria-selected'), 'true');
    const code = '<h1 id="local-proof">我的代码</h1>';
    await page.locator('#lesson-code').fill(code);
    assert.equal(await page.locator('#code-preview').isVisible(), false);
    await page.locator('[data-action="run-preview"]').click();
    await page.frameLocator('#code-preview').locator('#local-proof').waitFor();
    await page.locator('[data-assist-code]').click();
    assert(await page.locator('#assistant-code').isChecked());
    await page.locator('#assistant-question').fill('Web 专属问题');
    await page.locator('#assistant-form button').click();
    let prompt = await page.locator('#assistant-output').textContent();
    assert(prompt.includes(code) && prompt.includes('Web 专属问题'));
    await page.locator('#assistant-code').uncheck();
    assert.equal(await page.locator('#assistant-result').isVisible(), false, 'changed context invalidates prompt');
    await page.locator('#assistant-form button').click();
    assert(!(await page.locator('#assistant-output').textContent()).includes(code));
    await go('#/lesson/go-01');
    assert.equal(await page.locator('#assistant-question').inputValue(), '');
    assert(!(await page.locator('#assistant-context-preview').textContent()).includes('Web 专属问题'));
    assert.equal(await page.locator('#assistant-result').isVisible(), false);
    assert.equal(await page.locator('#course-outline a').count(), 28);
    await page.locator('#assistant-question').fill('Go 专属问题');
    await page.locator('#assistant-form button').click();
    assert((await page.locator('#assistant-output').textContent()).includes('Go 第 1 课'));
    await go('#/lesson/web-01');
    assert.equal(await page.locator('#assistant-question').inputValue(), 'Web 专属问题');
    assert.equal(await page.locator('#assistant-code').isChecked(), false);
    assert.equal(await page.frameLocator('#code-preview').locator('#local-proof').count(), 0);
    await page.locator('#assistant-provider').click();
    await page.locator('[data-provider="DeepSeek"]').click();
    await page.locator('#connection-info').click();
    assert(await page.locator('#connection-dialog').evaluate(dialog => dialog.open));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#assistant-provider-name').textContent(), 'DeepSeek');
    assert((await page.locator('#assistant-provider').textContent()).includes('本地提问'));
    await go('#/ai-method');
    assert.equal(await page.locator('main h1').textContent(), '怎样用 AI 开发');
    assert.equal(await page.locator('#assistant-task').isDisabled(), true);
    assert.equal(await page.locator('#assistant-context-preview').textContent(), '本次只包含你在输入框中填写的问题。');
    await page.locator('[data-assist-preset="review"]').click();
    assert((await page.locator('#assistant-question').inputValue()).includes('实际运行'));
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).completed.length, KEY), 0);
    for (const width of [320, 375, 414, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BASE + '#/lesson/web-05');
      await page.locator('[data-lesson-tab="task"]').waitFor();
      const opened = await page.locator('#assistant-toggle').getAttribute('aria-expanded');
      if (opened === 'true') await page.locator('#assistant-close').click();
      for (const name of ['task', 'code', 'review']) {
        await page.locator(`[data-lesson-tab="${name}"]`).click();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'overflow: ' + width + ' ' + name);
      }
      await page.locator('#assistant-toggle').click();
      assert(await page.evaluate(() => {
        const rect = document.querySelector('#assistant-panel').getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth + 1;
      }), 'drawer outside viewport: ' + width);
      assert.equal(await page.locator('.page-shell').evaluate(el => el.inert), false);
      assert(await page.evaluate(() => {
        const a=document.querySelector('#assistant-panel').getBoundingClientRect();
        const b=document.querySelector('main').getBoundingClientRect();
        const footer=document.querySelector('.site-footer').getBoundingClientRect();
        return innerWidth>=1200 ? b.right<=a.left+1 : a.top>=b.bottom-1 && a.bottom<=footer.top+1;
      }), 'assistant must reserve space: '+width);
      if (width < 1200) {
        assert(await page.locator('#assistant-title').evaluate(el => { const r=el.getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight; }), 'help heading is visible after opening: '+width);
        await page.locator('#assistant-return').click();
        assert.equal(await page.locator('#assistant-toggle').evaluate(el => el===document.activeElement), true);
        await page.locator('#assistant-toggle').click();
      }
      await page.locator('[data-lesson-tab="code"]').click();
      assert.equal(await page.locator('[data-lesson-tab="code"]').getAttribute('aria-selected'),'true');
      await page.locator('#assistant-provider').click();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#assistant-panel').isVisible(), true, 'Escape closes only modal first');
      if (width === 375) await page.screenshot({ path: path.join(qa, 'workbench-assistant-mobile.png'), fullPage: false });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#assistant-panel').isVisible(), false);
      assert.equal(await page.locator('.page-shell').evaluate(el => el.inert), false);
      if (width === 375) {
        await page.locator('[data-lesson-tab="task"]').click();
        await page.screenshot({ path: path.join(qa, 'workbench-lesson-mobile.png'), fullPage: true });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(BASE);
    await page.locator('main h1').waitFor();
    await page.screenshot({ path: path.join(qa, 'workbench-home.png'), fullPage: true });
    assert.deepEqual(external, [], 'workbench must not call external model services');
    assert.deepEqual(errors, [], 'browser errors');
    console.log('PASS: workbench tabs, per-lesson context/drafts, explicit preview, provider state, method page, keyboard/dialog/drawer, 7 widths, no external requests.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
