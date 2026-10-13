# 让页面回应操作：从 JavaScript 到可靠的活动搜索

这一阶段不用框架，完成读取JSON、关键词搜索、类别筛选、展开详情、收藏与刷新恢复。每一项都要能解释数据怎样变成页面、按钮怎样改变数据、失败时用户会看到什么。即使没有C++基础，也可以从本章开始学变量和函数。

## 先运行完整作品，再拆开看数据流

创建 `club-search` 文件夹，在VS Code“打开文件夹”。新建 `index.html`、`style.css`、`app.js`、`events.json`、`empty.json`、`broken.json`、`wrong.json`，逐一复制下面对应完整代码并保存。broken.json故意写坏，用来训练失败分支；VS Code提示JSON错误符合预期。不要建立missing.json，因为我们要用它制造404。

本阶段fetch要通过HTTP读取相邻文件。双击file:可能因浏览器安全限制失败，这不代表语法错；没有本地服务器时先按“安装与起步教程 → Web环境 → Python本地服务器”安装和检查。VS Code终端当前目录必须是club-search，Windows使用：

```powershell
py -m http.server 8761 --bind 127.0.0.1
```

macOS/Linux使用：

```sh
python3 -m http.server 8761 --bind 127.0.0.1
```

访问 `http://127.0.0.1:8761/`，先看到“尚未读取”；点读取，出现3条活动，第一条“算法入门：图论练习”，第三条的尖括号按原样显示。服务器终端保持打开，Ctrl+C停止。改文件 → Ctrl+S / Cmd+S → 浏览器刷新，是本课重新运行的方法，不需要编译。JavaScript由浏览器解释执行；console.log输出在F12的Console，HTML更新显示在页面，不是VS Code的“输出”面板。

数据流是：JSON文件 → fetch的Response → response.json解析成JS数组 → validateEvents检查结构 → events保存数据 → filterEvents计算结果 → render创建DOM。用户点击收藏 → 更新Set → 尝试写localStorage → render刷新按钮。本地检查、计算、存储和页面渲染各有职责，分开后更容易确定哪一步出错。

## 变量、类型与比较：输入并不会自动成为数字

`let`允许重新赋值，`const`禁止把变量改指向另一值；const数组仍能push，const对象仍能改属性，所以它不是深度冻结。变量的类型来自当前值，JavaScript不要求先写int/string。本例`let events=[]`后来被请求结果替换，必须let；`const filters={...}`只修改字段，不替换对象，可以const。

`undefined`常表示未赋值、缺少属性或函数没return；`null`是主动表达“这里没有值”。`if(value)`判断真值，false、0、空字符串、null、undefined、NaN是假值；空数组和空对象是真值，因此不能用if([])判断有没有活动，要看length。strict比较`===`不隐式转换类型；`==`可能先转换。表单input.value和dataset.id都是字符串，需要Number显式转换且验证，不能因为id看起来是1就直接与数字1比较。

在本页Console粘贴以下完整块；花括号创建单独作用域，重复执行不冲突。先猜结果再回车。这里不读取隐私、不发请求。

```js
{
  const inputText = '12';
  console.log(0 == false, 0 === false);
  console.log(inputText + 1, Number(inputText) + 1);
  console.log(Boolean([]), Boolean(''), Boolean('0'));
  const record = { title: '摄影' };
  console.log(record.place, null);
}
```

```output
true false
121 13
true false true
undefined null
```

`Number('')`和`Number('   ')`都得到0，所以先trim判断是否为空。NaN用Number.isNaN识别；本课编号采用Number.isSafeInteger，并检查大于0。不要把`if(id)`当完整的编号验证，它没有排除小数、负数或字符串。

## 对象、数组与纯函数：筛选不等于改原数据

一个对象记录一项活动的id/title/category/description；数组记录多项。`filter`返回满足条件的新数组，`map`把每一项转换成另一值，`find`返回第一项或undefined。`sort`会改变调用它的数组；若不能改变原数组，用`[...items].sort(...)`。本例先filter得到新数组再sort，所以原始events顺序不会被sort破坏。

Console中的独立实验：

```js
{
  const items = [{ id: 2, title: 'Web', category: 'Web' }, { id: 1, title: '图论', category: '算法' }];
  console.log(items.filter(item => item.category === '算法').map(item => item.title));
  console.log(items.find(item => item.id === 9));
  console.log([...items].sort((a, b) => a.id - b.id).map(item => item.id));
  console.log(items.map(item => item.id));
}
```

```output
['图论']
undefined
[1, 2]
[2, 1]
```

箭头函数`item => item.category === '算法'`是传给filter的回调：filter逐项调用它，把当前item作为参数，返回true才保留。不是网页点击后才调用。`(a,b)=>a.id-b.id`给sort一个比较结果：负数表示a排前，正数排后；不传比较函数时数字可能按字符串顺序排列，例如1、10、2。

`filterEvents(items,options,saved)`是纯计算：输入活动、条件、收藏编号，返回结果，不查询DOM，不改localStorage。`includes('')`对所有字符串都成立，所以清空关键词显示全部；全空格则给出明确提示，避免用户以为自己搜索了空白字符。筛选条件用AND连接，所以“Web分类 + 算法关键词”会没有结果，这不是错误。

## 函数、作用域与闭包：回调怎么记住信息

函数的参数和内部let/const有局部作用域，外面不能直接用。函数要return才把结果交给调用者；console.log只是显示，不等于返回。事件监听的回调会在以后触发，仍可访问其定义位置的外部变量，这种保留访问能力叫闭包。本例收藏回调能读取events/favorites，读取回调能使用source/list，不需要把整个页面塞进每个函数参数。

这个完整Console例子有两个互不干扰的计数器：

```js
{
  function makeCounter() {
    let total = 0;
    return () => ++total;
  }
  const first = makeCounter();
  const second = makeCounter();
  console.log(first(), first(), second());
}
```

```output
1 2 1
```

makeCounter运行后返回内层函数，total仍被该函数引用，所以第一次调用后不会丢失；第二次makeCounter产生独立的total。闭包不是“自动缓存所有数据”，引用的状态如果被改了，下次读取会看到新值。理解这一点才能读懂异步回调中的旧请求编号与最新全局编号。

## DOM与事件：显示文本，保留键盘行为

DOM是浏览器根据HTML建立的对象树。`document.querySelector('#results')`取得页面中id为results的元素；匹配不到返回null，下一步调用append就会报错。本例script使用defer，HTML解析完成后才执行，因此列表已存在。若把script提到head又移除defer，可能在列表尚未建立时查询失败。

render先`replaceChildren()`移除旧结果，再createElement建立li、h3、button、details。`textContent=item.title`把标题作为文字，不会把`<b>算法</b>`变成加粗标签。DOM结构由可信代码创建，外部值只进入文本与经过验证的编号。第三活动刻意有尖括号，页面应该显示它们而不是创建b节点。不要把标题拼进innerHTML；“我只显示活动标题”不是允许解释任意HTML的理由。

addEventListener注册处理器。点击按钮时event.target是实际点击的最深元素，可能是按钮内的span；事件从内向外冒泡到列表，所以在列表上只注册一次监听器，再用`closest('button[data-action="favorite"]')`找到按钮。这是事件委托。render换掉所有按钮，父列表本身仍在，因此监听器仍工作，新增活动也不用逐个绑定。

dataset.id是字符串，Number后先验证对应活动存在，再修改Set。Set保存唯一编号，has检测、add添加、delete删除。按钮的aria-pressed与文字都反映收藏状态；重复的“收藏”按钮给独立aria-label带标题，让辅助阅读知道操作哪项。render替换了正在聚焦的按钮，因此最后显式找新按钮恢复焦点；“只看收藏”下取消后按钮消失，就把焦点放回该复选框。

表单submit默认会发送/导航，preventDefault取消；用户按Enter与点击应用执行同一处理器。字段value只读为字符串，trim剔除首尾空格，maxlength限制40字；前端验证是本地体验，真实API仍要服务端验证。这里改变字段只提示“尚未应用”，点击应用才更新筛选，避免把旧结果误当新条件结果。状态文案会说明这种操作约定。

## JSON与存储：读得出来不代表结构正确

JS对象可以有函数、undefined；JSON文本用双引号，不能写注释、尾逗号或函数。JSON.stringify把可序列化值变成字符串，JSON.parse把字符串解析成值。解析只检查JSON语法；`{"message":"hello"}`是有效JSON，却不是活动数组，因此还要validateEvents检查类型、长度、允许分类与重复id。wrong.json与broken.json分别训练这两个不同失败。

localStorage只能保存字符串，所以存储形如`{"version":1,"favorites":[1,3]}`；读回parse，再验证version和favorites是正整数数组，转换成Set。key不是变量名，是存储区的记录名称。HTTP协议、主机与端口共同决定origin；127.0.0.1:8761与127.0.0.1:8762的收藏不同，localhost与127.0.0.1也不同。它不是服务器数据库，另一设备看不到，清理浏览器数据可能丢失，私密模式的保留期限也不同；不要存密码或私密会话。[localStorage的同源与异常行为](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)。

真实损坏流程不是`catch { setItem('[]') }`：那会销毁唯一的旧记录。本例读取失败时停止自动写入，原字符串仍留原key；当前收藏可在内存使用，并明确说明刷新会丢失。导出原文下载txt，可以保留无法解析的内容；重建需要明确确认，保存重建前快照，撤销会逐字恢复原文，包括坏数据。撤销不是“修好了坏JSON”，它恢复操作前状态，页面会再次提示损坏。这是正确反馈。

Application → Local Storage选当前origin，找到`club-followup-favorites-v1`，把值手工改成`{"broken":`，刷新。读取正常活动、收藏一个：存储值仍必须是坏字符串，不能被自动覆盖。先导出，确认下载文件实际存在，再点重建与撤销。存储被浏览器禁止或空间不足时，try/catch提示无法持久化；页面仍能阅读，不把失败说成保存成功。

## Promise、async和请求五状态

同步代码在当前调用中按顺序执行；Promise代表以后得到结果或错误。async函数返回Promise，await让该函数等待某个Promise，但不冻结整个浏览器。try/catch可以捕获被await的拒绝；忘记await可能使异步错误跑到catch之外。Console实验：

```js
{
  async function showOrder() {
    console.log('A');
    const answer = await Promise.resolve(42);
    console.log('C', answer);
  }
  showOrder();
  console.log('B');
}
```

```output
A
B
C 42
```

await后面的C稍后执行，外面的B先完成；写了async并不意味着所有行都按等待顺序执行。Promise.resolve例子只演示调度，本例fetch才会有真实网络等待。[Promise串联与错误传播](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)。

本作品phase是明确的五种状态：idle未请求；loading正在等待；success收到合法非空数组；empty收到合法空数组；error连接、状态码、解析或结构检查失败。筛选后没有匹配属于成功数据中的空结果，和“服务器没有任何活动”区别表达。loading设置真实disabled防止重复点击，同时aria-busy说明列表更新中；finally无论成功失败都恢复按钮。

fetch在收到404/500时通常仍正常给Response，必须先检查response.ok；只写catch抓不住全部HTTP失败。response.json也是异步，而且坏JSON会抛SyntaxError。8秒AbortController超时用于提供重试路径，这不是保证8秒内一定完成的接口。requestNumber区分请求顺序，旧请求不覆盖新结果；这对以后加实时切换或多次刷新很重要。请求失败会清掉旧列表，避免用户看到旧内容却误认为新请求成功。[fetch的Response与错误处理](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)。

## 完整文件：七个文件全部给出

正常数据有3条；empty.json只含空数组；missing.json刻意不存在。手工敲代码时先让正常数据成功，再逐一造错，不要一次改五处。

### 完整文件：index.html

```html
<!doctype html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>活动搜索 · JavaScript 练习</title><link rel="stylesheet" href="./style.css"><script src="./app.js" defer></script></head>
<body>
<main>
  <h1>活动搜索与本地收藏</h1>
  <p>从 JSON 文件读取活动；收藏只存本浏览器，不能当作真实报名。</p>
  <section aria-labelledby="request-heading">
    <h2 id="request-heading">1. 读取数据</h2>
    <label for="source">测试数据</label>
    <select id="source"><option value="./events.json">正常数据</option><option value="./empty.json">空数组</option><option value="./missing.json">不存在：404</option><option value="./broken.json">JSON 语法错误</option><option value="./wrong.json">JSON 结构错误</option></select>
    <button id="load" type="button">读取数据</button>
    <p id="request-status" role="status">尚未读取，请点击“读取数据”。</p>
  </section>
  <section aria-labelledby="filter-heading">
    <h2 id="filter-heading">2. 搜索与筛选</h2>
    <form id="filter-form"><div class="field"><label for="keyword">关键词（最多40字，留空显示全部）</label><input id="keyword" maxlength="40" placeholder="例如：算法"></div><div class="field"><label for="category">类别</label><select id="category"><option value="all">全部</option><option value="算法">算法</option><option value="Web">Web</option></select></div><label class="check"><input id="favorites-only" type="checkbox">只看收藏</label><button type="submit">应用条件</button></form>
    <p id="filter-message" role="status">读取后可筛选；只填空格会要求重新输入。</p>
    <p id="count" role="status"></p>
    <ul id="results" aria-busy="false"></ul>
  </section>
  <section aria-labelledby="storage-heading">
    <h2 id="storage-heading">3. 检查本地保存</h2>
    <p id="storage-status" role="status"></p>
    <button id="export-storage" type="button">导出当前原始记录</button>
    <button id="reset-storage" type="button">重新建立空收藏</button>
    <button id="undo-storage" type="button" disabled>撤销重建</button>
    <p>发现损坏数据时停止自动写入，原文保留；先导出备份，再决定是否重建。撤销按钮只在本次打开页面有效。</p>
  </section>
</main>
</body></html>
```

### 完整文件：style.css

```css
* { box-sizing: border-box; }
body { margin: 0; color: #273c34; background: #f6f4ee; font: 1rem/1.7 system-ui, sans-serif; }
main { max-width: 68rem; padding: 1rem; margin: auto; }
section { margin-block: 1.5rem; padding: 1rem; background: #fff; border: 1px solid #ccd5cf; }
label { display: block; }
button, input, select { font: inherit; max-width: 100%; }
button, select { padding: .5rem .75rem; }
input:not([type="checkbox"]) { padding: .5rem; width: 100%; }
button { background: #17624b; color: #fff; border: 1px solid #17624b; cursor: pointer; }
button:hover:not(:disabled) { background: #0e4937; }
button:disabled { color: #4b5c52; background: #e1e6e3; cursor: not-allowed; }
:focus-visible { outline: 3px solid #873600; outline-offset: 4px; }
form { display: flex; flex-wrap: wrap; align-items: end; gap: 1rem; }
.field { flex: 1 1 12rem; min-width: 0; }
.check { display: flex; align-items: center; gap: .5rem; }
#results { list-style: none; padding: 0; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit,minmax(min(100%,18rem),1fr)); }
#results li { padding: 1rem; border: 1px solid #bbc9c0; overflow-wrap: anywhere; }
#results h3 { margin-top: 0; }
summary { cursor: pointer; }
#storage-heading ~ button { margin: .3rem; }
```

### 完整文件：app.js

```js
'use strict';
const KEY = 'club-followup-favorites-v1';
const source = document.querySelector('#source');
const loadButton = document.querySelector('#load');
const requestStatus = document.querySelector('#request-status');
const form = document.querySelector('#filter-form');
const keyword = document.querySelector('#keyword');
const category = document.querySelector('#category');
const onlyFavorites = document.querySelector('#favorites-only');
const message = document.querySelector('#filter-message');
const count = document.querySelector('#count');
const list = document.querySelector('#results');
const storageStatus = document.querySelector('#storage-status');
const exportButton = document.querySelector('#export-storage');
const resetButton = document.querySelector('#reset-storage');
const undoButton = document.querySelector('#undo-storage');
let events = [];
let phase = 'idle';
let favorites = new Set();
let storageMode = 'ok';
let requestNumber = 0;
let previousRaw;
let canUndo = false;
const filters = { keyword: '', category: 'all', onlyFavorites: false };

// Pure logic: the same input gives the same result; no DOM or storage here.
function filterEvents(items, options, saved) {
  const text = options.keyword.trim().toLocaleLowerCase();
  return items.filter(item =>
    item.title.toLocaleLowerCase().includes(text) &&
    (options.category === 'all' || item.category === options.category) &&
    (!options.onlyFavorites || saved.has(item.id))
  ).sort((a, b) => a.id - b.id);
}

function validateEvents(data) {
  if (!Array.isArray(data)) throw new Error('数据格式错误：需要活动数组');
  const seen = new Set();
  for (const item of data) {
    if (!item || !Number.isSafeInteger(item.id) || item.id < 1 ||
        typeof item.title !== 'string' || !item.title.trim() || item.title.length > 200 ||
        !['算法', 'Web'].includes(item.category) || typeof item.description !== 'string' ||
        item.description.length > 500 || seen.has(item.id)) {
      throw new Error('数据格式错误：编号、标题、分类、描述或重复编号不合法');
    }
    seen.add(item.id);
  }
  return data;
}

function readFavorites() {
  favorites = new Set();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== null) {
      const data = JSON.parse(raw);
      if (data?.version !== 1 || !Array.isArray(data.favorites) ||
          !data.favorites.every(id => Number.isSafeInteger(id) && id > 0)) {
        throw new Error('Invalid saved favorites');
      }
      favorites = new Set(data.favorites);
    }
    storageMode = 'ok';
    storageStatus.textContent = `本浏览器已保存 ${favorites.size} 个收藏编号；当前空记录不会自动写入。`;
  } catch (error) {
    storageMode = error instanceof SyntaxError || error.message === 'Invalid saved favorites' ? 'damaged' : 'unavailable';
    storageStatus.textContent = storageMode === 'damaged'
      ? '收藏记录损坏，原文已保留；本次收藏仅在内存变化。请先导出原文再选择重建。'
      : '浏览器禁止访问本地存储；本次收藏只保存在内存，刷新会丢失。';
  }
}

function saveFavorites() {
  if (storageMode !== 'ok') return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, favorites: [...favorites] }));
    storageStatus.textContent = `已保存 ${favorites.size} 个收藏编号；刷新本页面可验证。`;
  } catch {
    storageMode = 'unavailable';
    storageStatus.textContent = '写入失败（可能空间不足或访问被禁止）；旧记录没有被主动清空，本次变更只在内存。';
  }
}

function render() {
  list.replaceChildren();
  if (phase !== 'success') { count.textContent = ''; return; }
  const found = filterEvents(events, filters, favorites);
  count.textContent = found.length ? `找到 ${found.length} 项活动。` : '没有匹配活动，请清空关键词或切换分类。';
  for (const item of found) {
    const li = document.createElement('li');
    const heading = document.createElement('h3');
    heading.textContent = item.title;
    const label = document.createElement('p');
    label.textContent = `类别：${item.category} · 编号：${item.id}`;
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = '查看介绍';
    const description = document.createElement('p');
    description.textContent = item.description;
    details.append(summary, description);
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.id = String(item.id);
    button.dataset.action = 'favorite';
    button.setAttribute('aria-pressed', String(favorites.has(item.id)));
    button.textContent = favorites.has(item.id) ? '取消收藏' : '收藏';
    // The accessible name distinguishes repeated buttons.
    button.setAttribute('aria-label', `${button.textContent}：${item.title}`);
    li.append(heading, label, details, button);
    list.append(li);
  }
}

async function loadEvents() {
  const thisRequest = ++requestNumber;
  const url = source.value;
  phase = 'loading';
  loadButton.disabled = true;
  list.setAttribute('aria-busy', 'true');
  requestStatus.textContent = '正在读取活动，请稍候……';
  render();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}：无法读取 ${url}`);
    const data = validateEvents(await response.json());
    if (thisRequest !== requestNumber) return;
    events = data;
    phase = data.length ? 'success' : 'empty';
    requestStatus.textContent = data.length ? `读取成功：${data.length} 项活动。` : '读取成功，但数据源没有活动。';
  } catch (error) {
    if (thisRequest !== requestNumber) return;
    events = [];
    phase = 'error';
    const detail = error.name === 'AbortError' ? '8秒内未完成，可检查连接后重试' : error.message;
    requestStatus.textContent = `读取失败：${detail}。旧列表已移除；切回正常数据后可重试。`;
  } finally {
    clearTimeout(timeout);
    if (thisRequest === requestNumber) {
      loadButton.disabled = false;
      list.setAttribute('aria-busy', 'false');
      render();
    }
  }
}

loadButton.addEventListener('click', loadEvents);
form.addEventListener('submit', event => {
  event.preventDefault();
  if (keyword.value && !keyword.value.trim()) {
    message.textContent = '不能只输入空格；清空关键词可查看全部。';
    keyword.focus();
    return;
  }
  filters.keyword = keyword.value.trim();
  filters.category = category.value;
  filters.onlyFavorites = onlyFavorites.checked;
  message.textContent = '已应用当前条件；改变字段后需要重新点击“应用条件”。';
  render();
});
form.addEventListener('input', () => {
  message.textContent = '条件已修改，尚未应用；请点击“应用条件”。';
});

// One parent listener handles all current and future favorite buttons.
list.addEventListener('click', event => {
  const button = event.target.closest('button[data-action="favorite"]');
  if (!button || !list.contains(button)) return;
  const id = Number(button.dataset.id);
  if (!events.some(item => item.id === id)) return;
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  saveFavorites();
  render();
  // Re-render replaced the focused button; restore focus deliberately.
  const replacement = list.querySelector(`button[data-id="${id}"]`);
  (replacement || onlyFavorites).focus();
});

exportButton.addEventListener('click', () => {
  try {
    const raw = localStorage.getItem(KEY);
    const blob = new Blob([raw ?? '当前没有原始记录'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'favorites-original.txt';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    storageStatus.textContent += ' 已请求下载原文，请确认下载文件已保存。';
  } catch {
    storageStatus.textContent = '无法读取原记录，导出失败；没有改写收藏。';
  }
});
resetButton.addEventListener('click', () => {
  if (!confirm('重建会把当前存储换成空收藏。建议先导出；本次页面保留一份原文可撤销。继续吗？')) return;
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.setItem(KEY, JSON.stringify({ version: 1, favorites: [] }));
    previousRaw = raw;
    canUndo = true;
    undoButton.disabled = false;
    readFavorites();
    storageStatus.textContent = '已重建空收藏；可点击“撤销重建”恢复重建前原文。';
    render();
  } catch {
    storageStatus.textContent = '重建失败，没有主动删除旧记录。';
  }
});
undoButton.addEventListener('click', () => {
  if (!canUndo) return;
  try {
    previousRaw === null ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, previousRaw);
    canUndo = false;
    undoButton.disabled = true;
    readFavorites();
    storageStatus.textContent += ' 已恢复重建前原始记录。';
    render();
  } catch {
    storageStatus.textContent = '撤销写入失败，原文快照仍在本次页面内存；恢复访问后再试。';
  }
});
readFavorites();
render();
```

### 完整文件：events.json

```json
[
  {"id":1,"title":"算法入门：图论练习","category":"算法","description":"用纸笔画出节点和边，再解释遍历。"},
  {"id":2,"title":"Web 布局工作坊","category":"Web","description":"用 Flex 与 Grid 制作活动首页。"},
  {"id":3,"title":"<b>算法</b>：把标题当文字","category":"算法","description":"尖括号不应变成页面标签。"}
]
```

### 完整文件：empty.json

```json
[]
```

### 完整文件：broken.json

```json
[{"id":1,"title":"这里故意缺少结尾"
```

### 完整文件：wrong.json

```json
{"message":"这是对象，不是活动数组"}
```


## 验收矩阵：每项都说明输入与结果

| 操作 | 精确预期 | 如何确认 |
| --- | --- | --- |
| 首次打开，不点击 | 尚未读取；没有活动 | request-status与列表 |
| 正常数据，点读取 | 读取成功：3项；列表3项 | count为找到3项 |
| 关键词算法，应用 | 2项，包括尖括号标题 | 不出现b标签 |
| 类别Web，关键词清空，应用 | 1项Web工作坊 | 看类别和编号2 |
| 关键词不存在，应用 | 没有匹配活动 | 请求状态仍是成功 |
| 关键词只有空格，应用 | 要求重新输入；保留原已应用结果 | 焦点回到关键词 |
| 收藏编号1，刷新并读取 | 编号1按钮取消收藏 | Application值favorites含1 |
| 只看收藏，取消最后一个 | 无匹配；焦点回复选框 | Tab操作继续可用 |
| 数据源空数组，读取 | 成功但没有活动 | Network为200、响应[] |
| 不存在，读取 | HTTP404失败；旧列表清空 | Network为404 |
| 坏JSON/错误结构 | 读取失败；按钮恢复 | Console/Response定位原因 |
| Network Offline后读取 | 连接失败，或超时后提示重试 | 没有伪造成功/旧列表 |
| 切回Online与正常数据 | 再次读取3项 | 验证恢复而非只验失败 |
| 存储损坏、收藏、刷新 | 原文保留、未自动写入 | raw字符串逐字一致 |
| 重建后撤销 | 原坏数据恢复并再次提示损坏 | 不声称坏JSON已修好 |

### 亲手用DevTools找出三个不同错误

先正常读取，F12 → Sources打开app.js，在filterEvents的filter行设断点。输入算法并应用，执行暂停；查看options.keyword、items.length与saved。在Scope/Watch中确认值，F10逐行，F8继续。不要在断点暂停时误以为页面卡死；暂停图标亮起意味着你要求程序等待。

错误1：将render中的events拼成eventz，保存、刷新并读取。Console会报ReferenceError并给app.js行号；点击行号返回真实出错处，修正拼写后再跑同一操作。Console最后一行信息不一定是最早根因，按触发时间找第一个错误。

错误2：选择不存在文件。Network选missing.json，Headers看完整URL、GET与404，Response看服务器错误内容；这不是CSS问题也不是JSON语法问题。切回正常数据后重试。若URL缺club-search这段，检查当前服务器根目录和相对路径。

错误3：打开broken.json。Network可能200，因为文件存在，但Response内容少了结尾；在VS Code补齐括号，刷新并再读后错误应消失。然后恢复故意坏的教学夹具，或另存正常练习文件，不要让未来验收误把故障场景当正常数据。

## 独立练习与答案解释

### 练习1：不触碰DOM写纯函数

新增`findEvent(items,id)`，查到返回对象，查不到返回null；用数字1、字符串'1'、不存在9验证。设计是否接受字符串，不靠==混过去。

### 参考答案1

`return items.find(item=>item.id===id) ?? null;`只接受数字编号，字符串'1'返回null；调用处先Number并检查正整数。null明确表达未找到，不能直接读取null.title。正常、未找到和错误类型分别验证。

### 练习2：按标题排序但不改原数组

写`titles(items)`返回按标题排序的文字数组，再打印原数组id确认顺序没改。不要在events上直接sort。

### 参考答案2

先`items.map(item=>item.title)`得到新字符串数组，再`.sort((a,b)=>a.localeCompare(b,'zh-CN'))`。排序结果可因地区语言规则而不同，验证目的是原数组顺序不变和结果包含全部标题，不武断要求跨平台字词顺序相同。

### 练习3：回调、冒泡与展开

给收藏按钮内新增span图标，用委托监听器点击图标；随后点击details中的summary，不能触发收藏。解释closest与contains各防哪种情况。

### 参考答案3

closest从实际target往上找匹配按钮，因此span点击仍识别按钮；summary没有匹配按钮，直接return。contains确保目标属于这个列表，避免将无关祖先匹配视为本列表操作。图标若仅装饰应aria-hidden，不替代按钮文字。新增后Tab与空格操作仍应正常。

### 练习4：真正识别坏数据

新增一个数据文件，JSON完全合法但两项id相同，再新增标题是数字的情况。程序应显示结构失败。用JSON.parse成功证明“语法合法”不能证明“业务合法”。

### 参考答案4

validateEvents的seen识别重复，typeof识别标题非字符串。编号用于收藏与DOM定位，重复会使一个点击影响不明确；拒绝整个非法输入并给出错误，比随机忽略一项更容易排错。不要为了让测试绿色移除校验。

### 练习5：存储异常不丢原文

保存正常收藏，记录原文；改成坏JSON，刷新后操作收藏，检查未改写；下载原文、重建、撤销，再核对原文。随后在独立测试浏览器禁止存储，页面应只失去持久化，不失去列表阅读。

### 参考答案5

读取、解析、结构验证和写入分别可能失败；catch中不removeItem，不默认覆盖。明确降级到内存，用户确认重建才写新记录，并保存快照可恢复。重新载入页面不能自动恢复内存快照，因此先导出才可跨刷新保留证据。

### 练习6：读请求失败而不是猜

在Network限速Slow 3G后读取，观察loading、disabled与aria-busy；切Offline再读取；恢复Online重试。写下request URL、状态/错误、响应片段和页面反馈。不要把第一次成功作为全流程验收。

### 参考答案6

等待中必须给状态和防重复操作；HTTP404与连接失败不同，200也可能解析失败，五态要按真实结果转换。finally恢复按钮才能重试，成功后空列表与筛选无匹配也要分别描述。开启Disable cache排除旧文件，但这不是修复代码。

## 学会向AI提交证据与保存学习结果

示例提问：“我在127.0.0.1:8761使用原生JS读取events.json，预期3项；Network显示200，但页面读取失败。Response是下列JSON，Console是SyntaxError及app.js行号。我已确认HTML/CSS路径。请先指出语法与结构验证分别在哪里失败，给最小修改和重跑正常/坏数据的方法。”附你自己的相关代码与完整报错，不要附密码、本地隐私或整台电脑截图。

请在notes/web记录一次正常搜索、一次无匹配、一次请求失败恢复、一次坏存储保留与撤销。运行参考代码不是你的独立成果。完成后进入[协作、调试与发布](#/followup/web/2)，把这个网站放进自己新建的练习仓库；本教程不会替你执行远程操作。
