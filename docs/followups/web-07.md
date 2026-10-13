# 全栈前端：把组件、数据和真实 HTTP 请求接起来

这一阶段制作一个可以查看、切换详情和新增活动的前端。你会运行两个进程：Vite 提供前端页面，Node 提供受控 mock HTTP API。mock 意味着数据由我们刻意安排，方便制造空列表、500、超时、错误 JSON 形状；它仍然有真实 HTTP 请求，不能把它当成自己的完整业务后端。第 08 阶段编写自己的 Go API，第 09 阶段才接 PostgreSQL。浏览器中新增成功不证明已经持久保存，更不证明有权限保护。

完成 JavaScript 函数、数组、DOM、fetch 基础后再来。本阶段预备知识包括：对象 `x.title`、数组 `map`、函数参数、Promise、`async/await`。不熟的先回到 JavaScript 与请求专题做完整例子。先追踪一个“点提交→POST→201→重新GET”的闭环，再理解每个组件。

## 1. 在 VS Code 准备可以运行的项目

从 [Node.js 官方下载](https://nodejs.org/en/download) 安装当前 LTS。Windows 选择与电脑架构相符的安装包，安装完成后关闭并重开 VS Code；macOS 用官网安装包，Linux 按官网对应系统步骤。不要下载不明“绿色工具合集”。打开 VS Code 终端，执行 `node --version` 和 `npm --version`，两者都应输出版本。此完整示例已用 Node 26.7 验证，Vite 8 官方要求 Node 20.19+ 或 22.12+，请优先使用仍受支持的 LTS；版本警告要先处理再装包。[Vite 环境要求](https://vite.dev/guide/)

下载本阶段完整源码并解压到自己有写入权限的目录，例如 `D:/code/followup-07`。VS Code 的“文件→打开文件夹”选择解压后**含 package.json 的那层**，不是外面的 ZIP 目录。在“终端→新建终端”检查当前路径。仓库用户可以直接打开 `exercises/web/followup-07`。不要在整个学习仓库根目录执行 npm install。

```powershell
node --version
npm --version
npm ci
npm test
npm run build
```

源码下载已有 lockfile，`npm ci` 按它安装并校验一致性；若你按本页从空目录逐个创建文件，首次用 `npm install` 生成 lockfile，然后再使用 ci。node_modules 是依赖安装结果，不手工抄，不提交。若 PowerShell 提示 npm.ps1 被策略禁用，使用 `npm.cmd ci`、`npm.cmd run dev`，不要为运行课程全局关闭系统策略。

开两个 VS Code 终端。终端 A 执行 `npm run mock`，终端 B 执行 `npm run dev`，二者都留着运行。浏览器地址栏输入 `http://127.0.0.1:5173/`。不是双击 src/main.tsx，也不是把代码粘进浏览器地址栏。

```output
终端 A：mock: http://127.0.0.1:8777; MOCK_MODE=normal
终端 B：Local: http://127.0.0.1:5173/
网页：服务器返回 1 条，卡片标题“图论训练”，地点“教室 A”
```

端口被占用时先确认是否自己上次课程的进程仍运行；在那个终端 Ctrl+C 停掉。不同源里的 localhost 与 127.0.0.1 也不是同一个主机名，本例前端、mock、CORS 统一使用 127.0.0.1。每次改 VITE_API_BASE 后需要重启 Vite。

## 2. React 与 Vue 选一种：组件为什么这样拆

React 用 JavaScript/TypeScript 函数返回 JSX；Vue 常用单文件组件组织 template、script、style。两者都把“状态改变之后界面应该是什么”写进组件。全栈学习仍然需要前端状态、加载反馈、输入错误；会写服务器不等于浏览器会自动得到界面。本例选择 React，便于与前面函数和数组知识衔接，不要求同时学 Vue。[React 组件思路](https://react.dev/learn/thinking-in-react) / [Vue 官方入门](https://cn.vuejs.org/guide/introduction.html)

若决定 Vue 分支，在另一个空目录使用 `npm create vite@latest club-vue -- --template vue-ts`、`cd club-vue`、`npm install`、`npm run dev` 得到真正入口；先完成自己的 Vue 组件基础课，再按本阶段 API 合同接数据。不要直接把本页 `.tsx` 复制进 `.vue`。本页可完整跑通的主例是 React 分支。

`App` 决定当前列表/详情和服务器加载状态。`EventCard` 显示一条活动，通过 onOpen 回报“用户点了哪张”。`EventDetail` 只显示当前对象并发出返回操作。`EventForm` 管自己的输入、提交中和错误。`Notice` 集中提供 role=status 的反馈。组件边界按职责而不是“每个标签一个文件”；改卡片地点样式只改一处，列表的五张卡片一起更新。

`<EventCard item={item} onOpen={...}/>` 把数据和函数作为 props 传入。props 是父组件给子组件的输入，不直接改 item.title。列表里的 `key={item.id}` 帮 React 识别同一条活动；不要用数组下标掩盖编辑/删除后的身份变化。JSX 中 `{item.title}` 按文本输出，带 HTML 标签的标题不会执行脚本。

跟练：修改 EventCard 的地点前面加“地点：”，刷新后所有卡片一致变化；把第二张活动创建出来，确认没有复制第二套组件代码。

## 3. Vite、模块与构建：从入口走到组件

index.html 的 `<script type="module" src="/src/main.tsx">` 是入口。main.tsx 导入 api、组件和 CSS，Vite 沿 import/export 构建依赖图。`export function EventCard` 允许其他文件 `import {EventCard}`；花括号名称必须一致，文件名大小写也要一致，Windows 上侥幸能找到的错大小写到 Linux 可能失败。

package.json 的 dev 启动开发服务器，build 先类型检查再生成 dist，preview 只是本机查看构建结果。build 成功不启动 API，dist 里没有数据库。执行 `npm run build` 后再 `npm run preview`，打开终端显示的地址；preview 通常是4173，本 mock 仅允许5173，所以跨源请求会被阻止。先停mock，在mock终端Windows设置 `$env:MOCK_ORIGIN='http://127.0.0.1:4173'`，macOS/Linux用 `export MOCK_ORIGIN='http://127.0.0.1:4173'`，再npm run mock；另一个终端npm run preview即可联调。若preview不是4173，按终端真实地址修改变量。恢复开发时清除MOCK_ORIGIN再启动mock。这个CORS差别本身是一次排错练习，不可把构建成功写成上线联调成功。

目录中的 src 是源代码，dist 是输出，node_modules 是依赖。修改 dist 会在下次 build 被覆盖。不要用 `npm run dev` 的地址当公开部署地址，关闭电脑后别人的浏览器也不能访问你的127.0.0.1。

## 4. TypeScript：类型检查与运行时检查是两件事

`EventItem` 的 id 是正整数，title/location 是字符串。`EventInput = Omit<EventItem,'id'>` 表示创建时由服务器分配 id，浏览器只提交标题和地点。把 `id: '1'` 写入 EventItem，`npm run typecheck` 会报字符串不能赋给number。它帮助你在运行前发现自己代码的错误。[TypeScript 手册](https://www.typescriptlang.org/docs/handbook/intro.html)

服务器响应来自网络，编译器没见过实际数据。`await res.json() as EventItem[]` 只改编译器的看法，不会变魔术校验字段。本例先把 JSON 当 `unknown`，isEvent 检查对象存在、id安全整数且>0、title与location类型，再用数组 every 检查每项。故意让mock返回 `{items:[...]}` 时，页面应显示“接口数据形状不符合 EventItem[]”，而不是直到渲染某处才报undefined。

`LoadState` 是带kind的联合类型：loading不含items，error必须有message，ready才有items。渲染前检查kind，让“加载中却读取items”的错误在类型检查时暴露；空列表是ready+[]，不是error。

## 5. 状态、事件与服务器数据：一次提交的因果链

输入框 value 来自 EventForm 的 title，onChange 把每次输入写回 state。输入时只改变当前浏览器组件状态，没有POST，没有数据库写入。onSubmit 阻止浏览器默认表单导航，trim后检查标题，busy锁住重复提交，调用父组件onSave。

onSave 调用createEvent，只有收到成功响应才清空输入并增加refresh。refresh改变触发useEffect重新GET，重新以服务器结果渲染列表。你看到新卡片，是服务器响应和后续读取成功的结果，不是“点击即假装保存成功”。失败时保留输入让用户修正。

在Network里观察：输入文本不发请求；点提交出现POST；随后GET；返回201的创建请求与返回200的读取请求不同。停掉mock后提交应给失败反馈，不能清空用户还未保存的输入。mock重启恢复一条种子活动说明数据存在服务器内存，不是可靠持久化；localStorage也不是多人业务数据库。

## 6. 前端路由与API路由：两个URL归谁处理

`#/events` 和 `#/events/1` 是本例的前端hash路由。#后内容不作为HTTP路径发到服务器，App观察hashchange切换列表与详情。`/api/events` 则是mock收到的真实HTTP路径。点详情不会请求“网页 /events/1”；Network中列表请求仍指向8777的/api/events。

手工把地址改成 `#/events/999`，本例在已加载列表中查不到就显示“当前列表中不存在这个活动ID”。这是受控起步项目；未来活动量很大时详情应独立GET /api/events/{id}，不能假定当前分页包含所有记录。正式history路由还要静态托管配置回退index.html，否则刷新深路径404。

## 7. fetch、取消、超时和四种结果

fetch在HTTP500时一般仍resolve，所以call必须判断res.ok。解析JSON也可能失败；API函数把错误交给页面显示。5秒计时器调用AbortController.abort停止等待；组件卸载或再次加载时cleanup也abort旧请求，避免旧结果覆盖新页面。

本例call把外部signal的取消传给内部controller，finally清理timer和listener。网络失败、HTTP错误、形状错误、AbortError不是同一件事；页面先给可读反馈，再让学习者在Network区分。超时取消不能证明服务器没有完成一次写入，因此真正重要操作需要幂等设计；本例不自动重试创建。

依次在mock终端Ctrl+C，设置模式后重新启动。Windows命令：

```powershell
$env:MOCK_MODE='empty'
npm run mock
```

macOS/Linux：`MOCK_MODE=empty npm run mock`。测试完用Windows `Remove-Item Env:MOCK_MODE` 或macOS/Linux `unset MOCK_MODE`恢复normal，再重启mock。每次模式变化不是在Vite终端设置；应设置在运行mock的终端。

| 模式 | 点重新获取后的预期 | 你要核对的证据 |
| --- | --- | --- |
| normal | 显示活动卡片 | GET200，Response是数组 |
| empty | 显示服务器返回空列表 | GET200，Response是[] |
| error | 显示受控500错误 | GET500，error.message存在 |
| shape | 显示形状不符合 | GET200，但Response是对象 |
| slow | 约5秒后请求取消并报读取失败 | Network取消，非HTTP404 |

## 8. 表单校验、Network和公开配置

required拒绝空字符串，浏览器maxlength帮助输入长度；只有空格仍需要trim检查。服务端mock再次校验，下一课API会做更严的类型/长度/未知字段/体积校验。禁用提交只避免当前UI重复点，任何客户端都可以绕开它直接请求，权限仍要在后端检查。

按F12打开DevTools，选择Network→Fetch/XHR，勾Preserve log后新增“算法分享”，点击POST查看Headers的URL、Method、201，Payload的title/location，Response的id。再看GET的结果含新id。打开Sources给api.ts的fetch行加断点，提交时查看options.body和base，F10逐步执行，不要在截图里暴露真实秘密。断点暂停会影响超时判断，调试后移除断点再测。

VITE_API_BASE是公开地址，Vite将VITE_变量替换进浏览器bundle。数据库密码、会话密钥不放这个文件；改名叫“private”也不能隐藏已经被打包的字符串。[Vite 环境变量](https://vite.dev/guide/env-and-mode.html) 使用mock默认地址无需.env；下一课复制.env.example为.env，把地址改成 `http://127.0.0.1:8768`，开启Go对应CORS后重启Vite。不要把旧的mock成功误认为Go已经接上。

## 完整主例：逐个文件保存

下面每个标题都是相对练习目录的真实文件名。在 VS Code 左侧新建对应文件夹和文件，粘贴整段代码，按 Ctrl+S（macOS 为 Cmd+S）保存；不要把不同文件的代码拼进同一文件。完整下载目录已经包含这些文件，直接打开时无需重复抄写。`package-lock.json` 和 `go.sum` 随源码下载，手工重建时分别由 npm install 和 go mod tidy 生成。

### 完整文件：package.json

```json
{"name":"club-frontend-practice","private":true,"version":"1.0.0","type":"module","scripts":{"dev":"vite --host 127.0.0.1 --strictPort","mock":"node mock/server.mjs","typecheck":"tsc --noEmit","build":"tsc --noEmit && vite build","preview":"vite preview --host 127.0.0.1","test":"node --test test/*.test.mjs"},"dependencies":{"react":"19.3.0","react-dom":"19.3.0"},"devDependencies":{"@types/react":"19.3.0","@types/react-dom":"19.3.0","typescript":"7.0.2","vite":"8.3.4"}}
```

### 完整文件：tsconfig.json

```json
{"compilerOptions":{"target":"ES2022","lib":["ES2022","DOM","DOM.Iterable"],"module":"ESNext","moduleResolution":"Bundler","jsx":"react-jsx","strict":true,"noEmit":true,"skipLibCheck":true},"include":["src"]}
```

### 完整文件：index.html

```html
<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>全栈起点：活动管理前端</title><div id="root"></div><script type="module" src="/src/main.tsx"></script></html>
```

### 完整文件：.env.example

```text
# Vite 的 VITE_ 变量都会进入浏览器代码，只能放公开地址。
VITE_API_BASE=http://127.0.0.1:8777
```

### 完整文件：src/env.d.ts

```ts
/// <reference types="vite/client" />
```

### 完整文件：src/types.ts

```ts
export interface EventItem { id: number; title: string; location: string }
export type EventInput = Omit<EventItem,'id'>;
export type LoadState = {kind:'loading'} | {kind:'error';message:string} | {kind:'ready';items:EventItem[]};
```

### 完整文件：src/api.ts

```ts
import type {EventItem, EventInput} from './types';
const base=import.meta.env.VITE_API_BASE??'http://127.0.0.1:8777';
// 编译器不会替服务器验证 JSON。unknown 强迫我们先检查字段。
function isEvent(value:unknown):value is EventItem {
  if(!value||typeof value!=='object')return false;
  const x=value as Record<string,unknown>;
  return typeof x.id==='number'&&Number.isSafeInteger(x.id)&&x.id>0&&typeof x.title==='string'&&typeof x.location==='string';
}
async function call(path:string,options:RequestInit={}) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  const cancel=()=>controller.abort();options.signal?.addEventListener('abort',cancel,{once:true});
  if(options.signal?.aborted)controller.abort();
  try {
    const res=await fetch(base+path,{...options,signal:controller.signal,headers:{'Content-Type':'application/json',...options.headers}});
    const body:unknown=await res.json();
    if(!res.ok){const e=body as {error?:{message?:string}};throw new Error(e?.error?.message??`HTTP ${res.status}`);}
    return body;
  } finally {clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
}
export async function listEvents(signal:AbortSignal):Promise<EventItem[]> {
  const value=await call('/api/events',{signal});
  if(!Array.isArray(value)||!value.every(isEvent))throw new Error('接口数据形状不符合 EventItem[]，检查 Network 的 Response');
  return value;
}
export async function createEvent(input:EventInput):Promise<EventItem>{
  const value=await call('/api/events',{method:'POST',body:JSON.stringify(input)});
  if(!isEvent(value))throw new Error('创建响应形状错误');return value;
}
```

### 完整文件：src/EventCard.tsx

```tsx
import type {EventItem} from './types';
export function EventCard({item,onOpen}:{item:EventItem;onOpen:()=>void}) {
  return <li><h2>{item.title}</h2><p>{item.location||'地点待定'}</p><button onClick={onOpen}>查看详情 #{item.id}</button></li>;
}
```

### 完整文件：src/EventDetail.tsx

```tsx
import type {EventItem} from './types';
export function EventDetail({item,onBack}:{item:EventItem;onBack:()=>void}){return <section><h2>{item.title}</h2><p>服务器 ID：{item.id}</p><p>地点：{item.location||'地点待定'}</p><button onClick={onBack}>返回活动列表</button></section>;}
```

### 完整文件：src/Notice.tsx

```tsx
export function Notice({message}:{message:string}){return <p role="status">{message}</p>;}
```

### 完整文件：src/EventForm.tsx

```tsx
import {useState} from 'react';
import type {EventInput} from './types';
export function EventForm({onSave}:{onSave:(input:EventInput)=>Promise<void>}){
  const [title,setTitle]=useState(''),[location,setLocation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  return <form onSubmit={async e=>{e.preventDefault();if(!title.trim()){setError('标题不能只有空格');return;}setBusy(true);setError('');try{await onSave({title:title.trim(),location:location.trim()});setTitle('');setLocation('');}catch(err){setError(err instanceof Error?err.message:'保存失败');}finally{setBusy(false);}}}>
    <h2>新增活动</h2><label htmlFor="title">标题</label><input id="title" value={title} required maxLength={100} onChange={e=>setTitle(e.target.value)}/>
    <label htmlFor="location">地点</label><input id="location" value={location} maxLength={100} onChange={e=>setLocation(e.target.value)}/>
    <button disabled={busy}>{busy?'正在请求…':'提交给 API'}</button><p role="status">{error}</p>
  </form>;
}
```

### 完整文件：src/main.tsx

```tsx
import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {listEvents,createEvent} from './api';
import {EventCard} from './EventCard';import {EventForm} from './EventForm';import {EventDetail} from './EventDetail';import {Notice} from './Notice';
import type {LoadState} from './types';import './style.css';
function App(){
  const [state,setState]=useState<LoadState>({kind:'loading'}),[refresh,setRefresh]=useState(0),[route,setRoute]=useState(location.hash||'#/events');
  useEffect(()=>{const change=()=>setRoute(location.hash||'#/events');addEventListener('hashchange',change);return()=>removeEventListener('hashchange',change);},[]);
  useEffect(()=>{const controller=new AbortController();setState({kind:'loading'});listEvents(controller.signal).then(items=>{if(!controller.signal.aborted)setState({kind:'ready',items});}).catch(err=>{if(!controller.signal.aborted)setState({kind:'error',message:err instanceof Error?err.message:'请求失败'});});return()=>controller.abort();},[refresh]);
  const id=Number(route.match(/^#\/events\/(\d+)$/)?.[1]),detail=state.kind==='ready'?state.items.find(x=>x.id===id):undefined;
  return <main><h1>社团活动管理：前端起点</h1><p>本课连接受控 mock HTTP 服务；重启 mock 会丢失新数据，第 08 课才切换自己编写的 API，第 09 课才用数据库。</p><a href="#/events">活动列表</a><button onClick={()=>setRefresh(x=>x+1)}>重新获取</button>
    {state.kind==='loading'&&<Notice message="正在请求 /api/events…"/>}
    {state.kind==='error'&&<Notice message={`读取失败：${state.message}。检查后端终端和 Network，再点重新获取。`}/>}
    {state.kind==='ready'&&(id?detail?<EventDetail item={detail} onBack={()=>location.hash='/events'}/>:<Notice message="当前列表中不存在这个活动 ID"/>:<><Notice message={state.items.length?`服务器返回 ${state.items.length} 条`:'服务器返回空列表'}/><ul>{state.items.map(item=><EventCard key={item.id} item={item} onOpen={()=>location.hash=`/events/${item.id}`}/>)}</ul></>)}
    <EventForm onSave={async input=>{await createEvent(input);location.hash='/events';setRefresh(x=>x+1);}}/>
  </main>;
}
createRoot(document.querySelector('#root')!).render(<App/>);
```

### 完整文件：src/style.css

```css
*{box-sizing:border-box}body{font:18px/1.7 system-ui;background:#f6f5f1;color:#27302c;margin:0}main{max-width:60rem;margin:auto;padding:1.5rem}ul{padding:0;list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:1rem}li,section,form{padding:1rem;background:white;border:1px solid #ccc;border-radius:.5rem;overflow-wrap:anywhere}form{display:grid;gap:.5rem}button,input{font:inherit;padding:.5rem}button{margin:.3rem;cursor:pointer}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #156a5a;outline-offset:3px}button:disabled{cursor:wait;opacity:.5}
```

### 完整文件：mock/server.mjs

```javascript
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
const mode=process.env.MOCK_MODE??'normal',origin=process.env.MOCK_ORIGIN??'http://127.0.0.1:5173';let next=2;const events=[{id:1,title:'图论训练',location:'教室 A'}];
const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
export function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  if(req.url!=='/api/events'){send(res,404,{error:{code:'not_found',message:'路径不存在'}});return;}
  if(req.method==='GET'){
    const respond=()=>mode==='error'?send(res,500,{error:{code:'mock_error',message:'受控 500 演示'}}):send(res,200,mode==='empty'?[]:mode==='shape'?{items:events}:events);
    if(mode==='slow')delay(6000).then(respond);else respond();return;
  }
  if(req.method==='POST'){
    let raw='',size=0,large=false;req.on('data',chunk=>{size+=chunk.length;if(size>8192)large=true;else raw+=chunk;});req.on('end',()=>{if(large){send(res,413,{error:{code:'body_too_large',message:'请求体过大'}});return;}try{const value=JSON.parse(raw);if(typeof value.title!=='string'||!value.title.trim()||value.title.length>100||typeof value.location!=='string'){send(res,400,{error:{code:'validation',message:'标题与地点形状不正确'}});return;}const item={id:next++,title:value.title.trim(),location:value.location.trim()};events.push(item);send(res,201,item);}catch{send(res,400,{error:{code:'invalid_json',message:'JSON 语法错误'}});}});return;
  }
  send(res,405,{error:{code:'method',message:'本 mock 只演示 GET / POST'}});
}
const port=Number(process.env.MOCK_PORT??8777);
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))http.createServer(handler).listen(port,'127.0.0.1',()=>console.log(`mock: http://127.0.0.1:${port}; MOCK_MODE=${mode}`));
```

### 完整文件：test/mock.test.mjs

```javascript
import {test} from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import {handler} from '../mock/server.mjs';
test('HTTP mock contract and invalid title',async()=>{const server=http.createServer(handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const base=`http://127.0.0.1:${server.address().port}`;const list=await fetch(base+'/api/events');assert.equal(list.status,200);assert.ok(Array.isArray(await list.json()));const create=await fetch(base+'/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'活动',location:'A'})});assert.equal(create.status,201);assert.equal((await create.json()).title,'活动');const bad=await fetch(base+'/api/events',{method:'POST',body:JSON.stringify({title:' ',location:''})});assert.equal(bad.status,400);}finally{await new Promise(r=>server.close(r));}});
```

## 独立变式：让错误能被解释

先不看答案：新增搜索输入，本地按title筛选；保留完整state.items作为原数组，不让筛选删除服务器数据。然后把mock的一条id改成字符串，观察类型检查与运行时校验哪一个首先发现问题。保存正常/空/500/形状/超时五张证据，并说明“输入”和“保存成功”区别。

### 参考答案

搜索用单独state query，渲染时 `state.items.filter(item=>item.title.toLowerCase().includes(query.trim().toLowerCase()))`；状态ready但过滤后0条应写“没有匹配活动”。原始数组不修改，所以清空query后恢复。mock写在JavaScript服务文件里，TS不会提前检查它返回给网络的JSON；isEvent会拒绝字符串id。不得把类型断言改成any来消除错误提示，那会移走检查而不是修正数据。

| 原知识点 | 详细教学入口 | 实际文件与结果 |
| --- | --- | --- |
| 框架二选一 | 2 组件职责与Vue实际入口 | 四组件+main.tsx，可列表/详情/表单 |
| Vite/模块 | 1、3 安装/启动/import/build | package.json/index.html，真实build生成dist |
| TypeScript基础 | 4 unknown/联合类型/运行时校验 | types.ts/api.ts，shape模式拒绝 |
| 组件拆分 | 2 单向props与事件 | EventCard/Detail/Form/Notice |
| 状态与事件 | 5 输入→POST→GET | busy与成功后更新，失败保留输入 |
| 路由 | 6 hash与HTTP路径 | #/events/1，与/api/events分开 |
| fetch封装 | 7 五模式、取消与超时 | api.ts/AbortController |
| 表单校验 | 8 trim与双端规则 | EventForm.tsx、mock/server.mjs |
| 浏览器调试 | 8 Network/Sources断点 | method/body/status/Response实证 |
| 环境变量 | 8 VITE_公开与下一课切换 | .env.example，重启Vite后指向Go |

自查：不看代码能说清四个组件的数据流吗？POST失败会发生什么？mock重启后数据去哪了？这一课运行成功仅证明当前练习，不替用户自动记为已掌握全栈。
