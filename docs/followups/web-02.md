# 协作、调试与发布：把能运行的页面变成能交接的作品

本阶段会让你亲手检查终端目录、建立Git历史、审查差异、在练习分支做回退、写README、运行真实测试，再把自己的静态站发布到GitHub Pages。命令是教学步骤，应在你新建的独立练习项目执行；本站不会替你创建远程仓库、推送或发布。

## 安装与路径：先知道程序在哪里运行

本课配套是独立文件夹club-release，不要在整份学习资料仓库根目录执行git init或npm init。可以下载配套包，也可以新建空文件夹并复制本章完整文件。VS Code选择“打开文件夹 → club-release”，菜单“终端 → 新建终端”。终端提示的路径应该指向club-release；左侧应能见到index.html。

先执行检查命令：

```powershell
pwd
ls
git --version
node --version
npm --version
```

macOS/Linux也可以使用同样五条命令。PowerShell的pwd显示Path，ls显示目录内容；cmd.exe使用`cd`显示当前位置、`dir`列文件。`cd ..`返回父目录，`cd "文件夹名"`进入含空格的路径。相对路径从当前目录算，不从命令文件所在位置猜；绝对路径从磁盘/根目录定位。ENOENT常说明当前目录没有package.json，要先pwd/ls核对，不能随便npm init制造另一个项目掩盖错误。

git不是内部或外部命令时，访问[Git官方下载](https://git-scm.com/downloads/)，Windows选对应安装程序，安装后重开VS Code；已有Git不要重复安装。macOS官方页面可选择Apple提供的开发工具或其列出的安装方案；Linux按发行版包管理方式安装。先让git --version实际显示版本再继续，而不是看到安装界面就算配置成功。

node不存在时，访问[Node官方下载安装](https://nodejs.org/en/download)，选LTS以及你的Windows/macOS/Linux和CPU架构。Windows一般选Windows Installer，macOS选Installer，按安装器完成Node和npm，重开VS Code终端。此练习要求22或更新且仍受支持的LTS；应以下载页当前LTS标签为准，不追Current。Linux选择官方页针对系统的安装方案，不复制不明网站的curl脚本。安装完成运行node --version和npm --version，看到v22/v24等受支持版本与npm数字版本才通过。

如果PowerShell报“npm.ps1不能运行，因为禁止执行脚本”，使用npm.cmd，不需要修改系统执行策略。下文所有npm命令都可替换成npm.cmd；Mac/Linux保持npm。

```powershell
npm.cmd ci
npm.cmd test
npm.cmd start
```

`npm ci`完成本课锁定环境；本课没有第三方依赖，不需要npm登录、API Key或框架。`npm test`显示pass1/fail0；`npm start`启动本机8762端口，打开 `http://127.0.0.1:8762/`。页面默认3项，输入算法 → Enter只剩1项。终端持续等待是服务器在运行，不是死机；Ctrl+C结束。若EADDRINUSE，先找到自己已经启动的同一服务器并Ctrl+C，不盲目杀掉其他服务；也可在server.cjs中改本机练习端口再按README更新地址。

## package.json、脚本与锁文件：命令究竟执行了什么

package.json是项目元数据与命令表，scripts.start是node server.cjs，scripts.test是node --test server.test.cjs。npm start/npm test只是选择并运行这些实际命令，并不凭空生成服务器或测试。依赖通常在dependencies记录运行需要的包，devDependencies记录开发工具；本课两者都没有，所有模块来自Node标准库。

新建空练习可运行`npm init -y`生成package.json，但对已提供完整文件的本课不要再覆盖；先打开现有文件阅读字段。`private:true`表示不要作为npm包发布，它不把GitHub仓库变私密；仓库可见性仍由GitHub设置决定。name不能随便用中文和空格，本课用club-release-practice。

package-lock.json记录依赖图与具体版本。本课没有第三方包，所以锁文件短；以后安装库时会记录版本、来源与完整性校验。首次维护者可以`npm install --package-lock-only`生成锁文件；使用者拿到匹配的package.json与lock后运行npm ci。两者不匹配时ci失败，是提示修正提交的依赖状态，不是提示删锁文件碰运气。node_modules是安装产物，不提交；package.json和package-lock.json应该一起审查和提交。[package.json官方字段](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)与[npm ci的锁文件要求](https://docs.npmjs.com/cli/v11/commands/npm-ci/)。

本课npm test不是“--if-present”：脚本不存在会失败，用例真的访问临时HTTP服务器，断言200/400/404/405、返回字段、搜索结果和未开放静态文件。测试内部使用随机空闲端口，所以不需先启动8762服务器。绿色只证明这些断言，不能证明真实手机、网络断开或Pages资源路径都正确，后面仍要做浏览器验收。

## 完整文件：复制即可安装、运行和验证

所有文件放在club-release根目录。package-lock.json与package.json一起保留。你也可以用上阶段的搜索收藏作品替换静态页面，但需同步更改README与测试，不能宣称只存在于计划中的功能已经实现。

### 完整文件：index.html

```html
<!doctype html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>社团活动 · 发布练习</title><link rel="stylesheet" href="./style.css"><script src="./app.js" defer></script></head>
<body><main>
<h1>社团活动展示站</h1><p>活动数据来自同目录JSON；本页可以发布到GitHub Pages。没有真实报名、账号或数据库。</p>
<nav aria-label="页内导航"><a href="#search">搜索</a> · <a href="#about">说明</a></nav>
<section id="search"><h2>搜索活动</h2><form id="search-form"><label for="keyword">关键词（留空显示全部）</label><input id="keyword" maxlength="40"><button type="submit">搜索</button></form><button id="reload" type="button">重新读取</button><p id="status" role="status">尚未读取</p><ul id="events"></ul></section>
<section id="about"><h2>已实现与边界</h2><p>已实现加载、搜索、空结果、失败重试和键盘操作。Node服务器仅用于本机学习；Pages只分发静态文件，不运行server.cjs。</p></section>
</main></body></html>
```

### 完整文件：style.css

```css
* { box-sizing: border-box; }
body { margin: 0; color: #263b33; background: #f6f4ee; font: 1rem/1.7 system-ui, sans-serif; }
main { max-width: 65ch; margin: auto; padding: 1rem; }
a { color: #17624b; }
input, button { font: inherit; padding: .5rem; max-width: 100%; }
label { display: block; }
form { margin-block: 1rem; }
button { cursor: pointer; background: #17624b; color: white; border: 1px solid #17624b; }
button:disabled { color: #4b5b52; background: #e4e9e5; }
:focus-visible { outline: 3px solid #873600; outline-offset: 4px; }
li { overflow-wrap: anywhere; margin-block: .75rem; }
```

### 完整文件：app.js

```js
'use strict';
const form = document.querySelector('#search-form');
const keyword = document.querySelector('#keyword');
const status = document.querySelector('#status');
const list = document.querySelector('#events');
const reload = document.querySelector('#reload');
let events = [];
let ready = false;
function render() {
  list.replaceChildren();
  if (!ready) return;
  const found = events.filter(item => item.title.includes(keyword.value.trim()));
  status.textContent = found.length ? `找到 ${found.length} 项活动` : '没有匹配活动，请清空关键词重试';
  for (const item of found) {
    const li = document.createElement('li');
    li.textContent = `${item.id} · ${item.title}`;
    list.append(li);
  }
}
async function load() {
  ready = false;
  list.replaceChildren();
  reload.disabled = true;
  status.textContent = '正在读取……';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('./events.json', { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || !data.every(item => item && Number.isSafeInteger(item.id) && typeof item.title === 'string')) throw new Error('活动数据结构错误');
    events = data;
    ready = true;
    render();
  } catch (error) {
    status.textContent = `读取失败：${error.name === 'AbortError' ? '8秒内未完成' : error.message}。检查Network后点击重新读取。`;
  } finally {
    clearTimeout(timeout);
    reload.disabled = false;
  }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (keyword.value && !keyword.value.trim()) { status.textContent = '不能只填空格；清空可查看全部'; return; }
  render();
});
reload.addEventListener('click', load);
load();
```

### 完整文件：events.json

```json
[{"id":1,"title":"算法入门"},{"id":2,"title":"Web 布局工作坊"},{"id":3,"title":"摄影观察"}]
```

### 完整文件：package.json

```json
{
  "name": "club-release-practice",
  "version": "1.0.0",
  "private": true,
  "description": "Zero-dependency static website and local HTTP learning server",
  "scripts": { "start": "node server.cjs", "test": "node --test server.test.cjs" },
  "engines": { "node": ">=22" }
}
```

### 完整文件：package-lock.json

```json
{
  "name": "club-release-practice",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "club-release-practice",
      "version": "1.0.0",
      "engines": {
        "node": ">=22"
      }
    }
  }
}
```

### 完整文件：server.cjs

```js
// Teaching server: local only, static allow-list, no database or accounts.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = __dirname;
const files = new Map([
  ['/', ['index.html', 'text/html;charset=utf-8']],
  ['/index.html', ['index.html', 'text/html;charset=utf-8']],
  ['/style.css', ['style.css', 'text/css;charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript;charset=utf-8']],
  ['/events.json', ['events.json', 'application/json;charset=utf-8']]
]);
function json(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(data));
}
function createServer() {
  return http.createServer((request, response) => {
    try {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD');
      return json(response, 405, { error: '本机教学服务器只支持读取' });
    }
    if (url.pathname === '/api/events') {
      const keyword = url.searchParams.get('keyword') || '';
      if (keyword.length > 40) return json(response, 400, { error: '关键词超过40字' });
      const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'events.json'), 'utf8'));
      const found = items.filter(item => item.title.includes(keyword.trim()));
      return json(response, 200, { items: found, count: found.length });
    }
    const selected = files.get(url.pathname);
    if (!selected) return json(response, 404, { error: '没有这个资源，请核对文件路径' });
    const body = fs.readFileSync(path.join(ROOT, selected[0]));
    response.writeHead(200, { 'Content-Type': selected[1], 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      // Invalid local files must give an HTTP error, not crash the process.
      console.error('本地资源读取失败：', error.message);
      if (!response.headersSent) json(response, 500, { error: '本地资源读取失败，请检查服务器终端与文件内容' });
      else response.end();
    }
  });
}
module.exports = { createServer };
if (require.main === module) {
  createServer().listen(8762, '127.0.0.1', () => console.log('打开 http://127.0.0.1:8762/ ，Ctrl+C 停止'));
}
```

### 完整文件：server.test.cjs

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('./server.cjs');
test('静态文件、搜索和失败响应遵守约定', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base + '/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /社团活动展示站/);
  const response = await fetch(base + '/api/events?keyword=' + encodeURIComponent('算法'));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  const data = await response.json();
  assert.equal(data.count, 1);
  assert.equal(data.items[0].title, '算法入门');
  const empty = await fetch(base + '/api/events?keyword=nothing');
  assert.equal((await empty.json()).count, 0);
  const bad = await fetch(base + '/api/events?keyword=' + 'x'.repeat(41));
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error, '关键词超过40字');
  assert.equal((await fetch(base + '/missing.json')).status, 404);
  assert.equal((await fetch(base + '/api/events', { method: 'POST' })).status, 405);
  assert.equal((await fetch(base + '/package.json')).status, 404);
});
```

### 完整文件：.gitignore

```text
node_modules/
.env
.env.*
!.env.example
*.log
coverage/
```

### 完整文件：README.md

```markdown
# 社团活动展示站：本机到发布的练习

已实现：静态JSON读取、关键词筛选、加载/空结果/失败重试、键盘操作；另有本机GET API用于查看HTTP合同。无账号、报名、数据库。Node服务仅监听127.0.0.1，不用于公网生产。

环境：Node.js 22或更新的受支持LTS，使用Node自带npm；`node --version`、`npm --version`应显示版本。VS Code打开本目录，终端运行`npm ci`（无第三方依赖），`npm test`，`npm start`，访问 http://127.0.0.1:8762/ 。Ctrl+C停止。若PowerShell拦截npm.ps1，使用`npm.cmd ci`、`npm.cmd test`、`npm.cmd start`，不要为此关闭系统执行策略。

验证：初次3条；搜索算法1条；搜索不存在0条；全空格给错误；离线后重新读取给失败，恢复网络后能重试。360/768/1440px检查布局，Tab/Enter操作。`npm test`断言200/400/404/405、筛选与静态资源限制。它不替代真实浏览器/手机验收。

API（本机）：GET /api/events?keyword=算法 返回`{"items":[{"id":1,"title":"算法入门"}],"count":1}`；关键词41字返回400；POST返回405。GitHub Pages不运行此API，所以网页读取`./events.json`。

静态发布：把index.html、style.css、app.js、events.json、README.md、.gitignore、package.json与package-lock.json放到自己独立练习仓库的根目录（Node文件只用于本机验证），按[完整Git/Pages讲义](../../../docs/followups/web-02.md)操作。网址通常含仓库名，所有资源用`./`相对路径。不要把真实密钥提交；不要推送node_modules。课堂代码不会替用户建立远程仓库或创建PR。

调试记录例：模拟events.json 404 → Network确认GET地址和404 → 核对大小写与发布目录 → 恢复正确路径 → 刷新后3条且无请求错误。截图请自己测试后保存，未附伪造运行截图。
```


## 用Network理解请求，而不是只说“API坏了”

正常网页fetch的是`./events.json`。在127.0.0.1:8762页面F12 → Network，勾Preserve log和Disable cache，刷新，选events.json。Headers查看Request URL、Request Method=GET、Status=200、Content-Type=application/json；Response是JSON数组。JSON是文本数据格式，HTTP才负责方法、路径、头、状态和传输。浏览器请求静态JSON也属于HTTP读取，但它没有数据库计算。

本地Node服务器另外提供只读`/api/events?keyword=算法`。直接打开 `http://127.0.0.1:8762/api/events?keyword=%E7%AE%97%E6%B3%95`，应见：

```output
{"items":[{"id":1,"title":"算法入门"}],"count":1}
```

URL由协议http、主机127.0.0.1、端口8762、路径/api/events、查询参数keyword组成。中文被percent编码不是乱码，服务器URLSearchParams解码再筛选。浏览器地址栏打开是GET；它没有JSON请求体。响应头描述返回格式，响应体是带items/count的对象，与events.json的数组形状不同。不能把两者当同一合同直接替换。

在本页Console运行完整实验，Network会留下POST：

```js
fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: '新活动' })
}).then(async response => console.log(response.status, await response.json()));
```

```output
405 {error: '本机教学服务器只支持读取'}
```

这是刻意的失败：POST表达创建意图、请求头说明body的JSON格式，但本机服务器没有实现创建，不能把405改成前端“创建成功”。GET正常200；超过40字关键词400（请求不符合规则）；不存在文件404；服务器内部故障一般500。404收到Response不一定触发fetch reject，应检查response.ok。

练习超过长度：把地址栏keyword值改成41个x，Status必须400，响应error明确说明长度。这个API只有本机服务器提供，GitHub Pages不能执行server.cjs；Pages网页继续读取相对events.json，不把/api/events写进生产页面。[Network各视图的官方说明](https://developer.chrome.com/docs/devtools/network/)。

## 断点与故障记录：用证据指出失败的那一层

F12 → Sources → app.js，在`const found=events.filter...`行点行号。输入算法、点搜索，断点暂停；Scope看events.length与keyword.value；F10下一步、F8继续。若没有暂停，先确认浏览器正在加载你编辑的文件、断点已启用、脚本文件非缓存旧版。VS Code也可“运行和调试”打开浏览器调试配置，但本阶段用浏览器内置工具已足够，无须安装陌生扩展。[VS Code断点与调试基础](https://code.visualstudio.com/docs/debugtest/debugging)。

故障A：把fetch路径改`./Events.json`，保存后在区分大小写的环境/服务器看到404。Network确认请求发出了、URL不对、响应没有JSON；这是资源路径错误。修复大小写再刷新，确认3项与200。不要在catch里直接换成假数据掩盖线上404。

故障B：把events.json改为`[]`，刷新，页面应是“没有匹配活动”，不是不断loading。换成150字长标题并保存，在360px确认文字完整换行，没有超出屏幕。完成后恢复正常教学数据。若空数组读取成功却显示“错误”，说明渲染把业务空状态误当网络错误。

故障C：Network选择Offline，然后点重新读取，出现失败，旧列表已移除，重读按钮恢复可点击。恢复Online并再读，出现3项。真实断网与DevTools模拟不同，设备上也要做一次；若请求被本机缓存命中，确认Disable cache在DevTools打开时生效。不要只“我刷新过”就判断完成。

一条可复查的Bug记录要写：环境与版本、操作步骤、预期/实际、Network/Console/Computed证据、根因与最小改动、正常及失败回归结果。例如“仓库Pages含/club-demo/，CSS用了/style.css请求到域名根404，改./style.css；重新打开实际URL后200、样式恢复；手机和空数据仍通过”。把记录存README或notes，不保存令牌、Cookie、真实隐私。

## Git：工作区、暂存区、提交各保存什么

Git工作区是你正在编辑的文件；暂存区是你挑选准备提交的快照；commit把暂存快照写进可追溯历史，留下唯一提交id。保存Ctrl+S不等于git commit，commit也不等于上传GitHub。你可以只提交某些文件，或先add后继续编辑，此时工作区与暂存区可能不同，所以每次提交前都看差异。

在club-release这个全新的独立目录运行：

```powershell
git init -b main
git config user.name "你的显示姓名"
git config user.email "你的提交邮箱"
git status
```

请把引号内换成你自己的姓名与提交邮箱；这里只在当前仓库设置，不改变系统所有仓库。想隐藏真实邮箱，在GitHub Settings → Emails使用账号给出的noreply地址。第一次status应看到未跟踪文件；如果已经是别人仓库，不运行init，应先确认git remote -v和当前路径。

使用明确文件列表，避免不看内容就add整个电脑目录：

```powershell
git add index.html style.css app.js events.json README.md .gitignore package.json package-lock.json server.cjs server.test.cjs
git diff --cached
git status
git commit -m "feat: add runnable club website"
git log --oneline -3
```

`git diff`比较工作区与暂存内容；`git diff --cached`比较暂存内容与上次提交。新文件被add前通常不会出现在普通diff，要结合status。第一次commit后status应工作区干净，log有一行你的消息与随机提交id。若出现user identity unknown，配置上述当前仓库身份后重试；不要在错误消息里填密码。

实验暂存快照：把h1末尾加“v2”，保存；git diff看到变化；git add index.html后再把v2改v3保存。现在普通diff是v2→v3，而cached是原始→v2。说明提交只包含add时的版本。如果想提交v3，重新git add index.html，再检查cached。不想纳入某项，可git restore --staged index.html移出暂存，工作区改动仍在。

## 分支、PR与合并：让别人能审核一个具体改动

在GitHub登录自己的账号，右上“+ → New repository”，命名club-demo。选择你理解的公开/私密设置；课堂Pages通常用公开仓库，无需放私人材料。空仓库不要勾初始化README，因为本地已存在历史。创建后复制HTTPS地址，先把下面地址中的YOUR-ACCOUNT改成你的真实账号，仓库名保持你刚建的名称。

```powershell
git remote add origin https://github.com/YOUR-ACCOUNT/club-demo.git
git remote -v
git push -u origin main
```

origin只是约定的远程名称，不是自动发现的账号。remote -v核对目标确实属于自己再push；HTTPS推送可能打开浏览器登录或凭据管理器，不使用GitHub账号密码当Git凭据，不把访问令牌写进命令/源码/截图。如果已有origin不要重复add，应先核对是否就是目标，不随便覆盖别人地址。

新功能分支做一件可审核的事，比如给说明区加“本地收藏不跨设备”：

```powershell
git switch -c feature/activity-help
git status
git diff
git add index.html README.md
git diff --cached
npm test
git commit -m "docs: clarify local-only data"
git push -u origin feature/activity-help
```

GitHub打开仓库 → Pull requests → New pull request，base main、compare feature/activity-help。Files changed审查实际差异。标题写具体改变，描述写“问题与新行为、如何验证、已知边界”，附自己实际运行的截图/测试结果，不能声称未来计划已完成。你自己练习可以先自行审查再合并；团队仓库应按协作规则等审核，不直接强推共享分支。[GitHub创建PR官方步骤](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request)。

网页合并后回本机：

```powershell
git switch main
git pull --ff-only
git log --oneline -5
```

如果pull提示本地未提交改动，先status判断与保存，别直接reset --hard丢掉工作。`--ff-only`遇到分叉会拒绝，提醒你理解分支差异；这是停止并核对的信号，不是需要force的信号。若仓库有冲突，文件中可能出现<<<<<<<等标记，需要选择最终逻辑并重新测试，不能把标记留在HTML里。

## revert回退：共享历史中的撤销也有记录

先在自己的练习分支做实验，不用公共主分支。确保status干净：

```powershell
git switch -c practice/revert
```

在index.html把标题加“故意坏改动”，保存并提交，再回退最近这一次：

```powershell
git add index.html
git commit -m "test: make a temporary bad change"
git log --oneline -3
git revert --no-edit HEAD
git diff HEAD~1 HEAD
git log --oneline -3
npm test
```

revert会产生新的反向提交，坏改动及撤销都留在历史；页面标题应恢复，log新增Revert消息。HEAD代表当前最新提交，不是固定id；请只在你刚创建坏提交的该练习分支执行，避免撤销了另一件事。

reset移动分支指向，带--hard还改写工作区，可能丢未保存的改动；在已共享的分支重写历史会影响同事，所以默认用revert表达撤销。不要因推送拒绝就force。如果回退涉及数据库迁移，代码回退不代表数据能回退，本课静态站没有数据库。[git revert官方说明](https://git-scm.com/docs/git-revert)。

## GitHub Pages：把路径与静态边界一起发布

本课index.html放在独立练习仓库根目录；若它在多层exercise子目录，选择根发布后首页未必是你的练习，不要直接照抄设置到整份学习仓库。先确保main已合并、npm test通过，且静态四文件在main根。

1. GitHub打开你的club-demo仓库，Settings → Pages。
2. Build and deployment的Source选Deploy from a branch，Branch选main，文件夹选/(root)，点Save。若组织限制或套餐不提供该选项，根据页面权限提示处理，不反复改源码。
3. 打开Actions观察pages build and deployment。等待状态完成；构建失败点开日志，不把等待当成功。完成后回Pages查看它给出的真实URL，一般为 `https://你的账号.github.io/club-demo/`，以页面显示为准。
4. 打开真实URL，刷新，F12 Network核对index/CSS/JS/JSON成功；搜索算法得到1项，不存在得到空提示，键盘Tab可操作。用手机也打开这个实际链接，不只看本机桌面。
5. 第二次改动通过分支PR合并到main后，等新部署完成，再在线上核对你的具体改变；不能凭git push成功就说已上线。

项目Pages地址含仓库名，`./style.css`从当前目录找，结果是/club-demo/style.css；`/style.css`从域名根找，结果是/style.css，通常404。fetch用`./events.json`同理。HTML文件名、资源大小写严格匹配；本机Windows容错不能代表线上Linux。纯静态练习无需构建输出，也没有build命令；不要要求Pages运行npm start。[Pages发布源配置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)与[建立站点步骤](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)。

Pages是静态托管：分发HTML/CSS/JS/JSON，不执行Node进程，不托管PostgreSQL，不把藏在JS里的密钥变秘密。server.cjs只是本机练习服务；服务器密钥不得提交到前端仓库。以后接API需单独后端服务、本身的权限与HTTPS配置，不用静态JSON冒充真实报名系统。

## 性能、手测、README与交接

性能先看证据。本课没引入远程字体、框架或大图片，Network可以记录Transferred、Size和Duration。带图作品先找到最大资源，看原始像素尺寸、传输字节和是否重复下载；同样展示300px宽的照片，600px宽压缩WebP常比3000px原图更合理，但画质与格式支持要实际比较。并不是把CSS width调小就减少流量。避免每次按键都重读同一JSON；本课读取一次，在内存筛选。禁用缓存只用于诊断，实际浏览器可能缓存资源，不要把调试设置当生产优化。

手测不是“点击一下”而是可复查输入与预期。记录下列结果，手机还要真实触摸测试：

| 场景 | 预期 |
| --- | --- |
| 打开，读取3项 | 页面有内容、无未捕获错误 |
| Tab/Enter到搜索 | 焦点可见、不会导航或重复发送 |
| 算法/不存在/全空格 | 1项/空结果/明确输入提示 |
| 刷新与重新读取 | 重新获得真实数据，无旧失败文案 |
| 360/768/1440及150字标题 | 可阅读，无水平溢出 |
| 空JSON数组 | 空状态，按钮可以再操作 |
| 404、Offline、恢复Online | 失败可理解、重试可恢复 |
| Pages真实地址 | 四资源成功、相对路径正确 |

README至少包含用途、环境版本、启动命令、验证方式、已实现功能、截图说明、已知限制、真实上线地址、一次故障记录。下面配套README描述的功能可以实际运行；若你加了收藏，就补存储范围与清空规则，不把它写成账户同步。让另一位未参与开发的人只按README运行，记录他卡在哪一步，再修文档。无法找同学时，用全新复制的文件夹逐条重走，不依赖当前终端里偷偷已启动的服务。

## 独立练习与参考答案

### 练习1：证明你理解目录与npm

在父目录运行npm test看到缺package.json，写下原因，再cd进club-release运行；解释package.json与lock哪些该提交。不要给父目录生成新package.json。

### 参考答案1

命令默认以当前目录为项目根；pwd/ls找到原文件后进入正确目录。提交package与lock保证安装约定，node_modules忽略。ci失败先核对两文件与版本；本课无第三方依赖也仍有真实npm scripts。

### 练习2：一份改动两种diff

先保存v2并add，再保存v3；写下普通diff和cached的差异，最后只提交你真正想交付的版本。

### 参考答案2

普通diff看到v2→v3，cached看到已提交版本→v2；重新add才让v3进入暂存。检查cached、跑测试再commit，不依靠“我已经保存”。

### 练习3：PR与回退闭环

在自己仓库用功能分支改一项真实帮助文案，提出PR、检查Files changed、记录手测，合并；在practice分支制造坏标题再revert，比较log。不要替别人合并未授权仓库。

### 参考答案3

PR对比base/compare把改动交给审核，合并后主分支部署；revert留下反向提交，可追溯谁撤销了什么。reset主要调整本地历史，强推共享分支可能破坏协作。验证要检查实际页面，不只看commit消息。

### 练习4：HTTP状态与路径

分别请求合法API、41字关键词、不存在JSON与POST，记录方法、URL、状态码、响应；解释哪种错误不会由fetch自动reject。把./style.css故意改/style.css，对比项目Pages请求地址。

### 参考答案4

GET合法200，关键词超长400，不存在404，未支持POST405；所有HTTP错误都可能正常获得Response，需要ok检查。项目Pages相对资源要带仓库目录；根路径不会自动加仓库名。

### 练习5：发布后再验收

写README里的真实网址与一次404故障记录，手机打开验证，随后通过PR修一项文案并确认新部署。列出本站做不了的后台功能。

### 参考答案5

检查发布任务完成、实际URL内容与Network资源，再做操作与失败恢复；Pages不能运行Node/API数据库。上线地址可访问不等于输入/边界/键盘/安全都通过。README记录的是你实际证明的功能，不是下一阶段待办。

## 阶段作品该留下什么

留下自己的代码仓库、一份可审核的PR、线上链接、桌面与手机验收、一次可复现Bug及修复证据、一次revert实验记录。本章中的远程命令只用于教学，未替你执行。随后可选[前端框架阶段](#/followup/web/3)或继续你选择的全栈路线；这些共同基础要能独立操作，再引入更多工具。
