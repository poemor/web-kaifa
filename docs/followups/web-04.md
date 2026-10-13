# 用 React 做组件：从一条状态更新到列表、详情和表单

本课选择 **React 主路线**，沿用上一阶段 TypeScript、Vite 与活动数据协议。选择的理由是 JSX 可以直接看见 JavaScript 如何把状态变成界面，而且后续测试用同一套组件。Vue 也是有效选择；文末提供实际可运行的 Vue 输入/列表等价入口。它是帮助比较的基础分支，不意味着 Vue 的路由、请求、表单与测试都已完整学过。第一遍先完成一条路线。

## 准备文件与运行入口

下载/打开 `exercises/web/followup-04`。Node/npm 安装见上阶段；要求 Node 24.15+。VS Code 左边应看到 `src/App.tsx`、`src/components`、`package.json`。终端先确认当前目录，执行：

```powershell
npm.cmd ci
npm.cmd run dev
```

macOS/Linux 使用 npm。打开 `http://127.0.0.1:8804/`。首页显示固定活动数据，点击“活动列表”，搜索“图论”，点击“图论训练”进入详情，填写虚构姓名 `测试同学` 与邮箱 `demo@example.com`。按钮只做本地检查，结果明确说明尚未提交。终端 Ctrl+C 停服务。

本课 `.tsx` 表示可以写 JSX 的 TypeScript 文件，`className` 是 React 的 CSS class 属性名，`htmlFor` 对应 label 的 for。`main.tsx` 的 createRoot 把 React 挂到 HTML 的 #app；组件函数返回的是 JSX 描述，React 将它转换成真实 DOM。不要把完整 App.tsx 当 `<script>` 塞进普通网页。

## 先画组件树，为什么这些内容应拆开

```text
App（路由、共享关键词、请求状态）
├─ StateView（加载/失败/空数据反馈）
├─ EventResults（筛选结果与列表）
│  ├─ SearchBox（显示输入与报告输入变化）
│  └─ EventCard × N（单项活动）
└─ RegistrationForm（详情页字段检查）
```

卡片在首页与列表页都使用，搜索框不需要知道请求从哪来，StateView 不负责筛选。这就是按责任和变化点拆分；不是规定每个 div 都必须一个文件。App 拥有关键词，因为切到详情再返回仍需同一关键词；表单姓名只影响该表单，因此放在 RegistrationForm。全局状态库没有解决本课真实重复问题，不必先安装。

实践：先从完整例子跑通，打开 EventCard.tsx 改地点展示文案，首页与列表应同时改变；再改 SearchBox 的标签，两页输入名称应一致。每个组件变动只负责一件事，避免找到标题要翻几百行混在一起的业务逻辑。[React 组件思考方法](https://react.dev/learn/thinking-in-react)。

## Props 是输入，回调把用户操作交回父层

`<SearchBox value={keyword} onChange={setKeyword} />` 中 value 是父传子的数据，onChange 是父提供的函数。子输入发生变化后调用 `onChange(event.target.value)`，不直接改父变量。EventCard 收到 event 后展示 title/startTime，也不修改传入对象；父更换 event，子得到新的 props 后重新显示。

完整数据流是：用户输入“图” → SearchBox 的 onChange 事件 → 调用父的 setKeyword('图') → App 得到下一次渲染的 keyword → EventResults 的 filterEvents 重新计算 → 只渲染匹配卡片。不是搜索框自己藏卡片，也不是 onChange 把数据送到网络。后文代码里的同名 onChange，一个是原生输入事件，一个是自定义 props 回调，要看它所属元素才能区分。[React props](https://react.dev/learn/passing-props-to-a-component)。

## State、ref、受控输入与派生结果

`const [keyword, setKeyword] = useState('')` 保存状态快照与更新函数。直接 `keyword = '图论'` 不会通知 React，且这里 const 也不能重新赋值。输入框的 `value={value}` 由状态决定显示内容，这叫受控输入；`onChange` 必须更新该状态，否则每次按键都会被旧 value 覆盖。若 undefined 与字符串来回切换，会产生受控/非受控警告，所以输入初值统一为 `''`。[React 输入组件](https://react.dev/reference/react-dom/components/input)。

搜索结果 `found = filterEvents(events, keyword)` 是由已有数据计算的派生值，不另开 found 状态；否则更新 keyword 时忘记更新 found 就会不一致。`useRef` 用于保存 DOM 引用或不需要触发渲染的值；这里 heading ref 让路由切换后焦点落到新页标题。修改 ref.current 本身不会重新渲染，不能用它替代搜索 state。[State 快照](https://react.dev/learn/state-as-a-snapshot)。

更新依赖旧值时用函数形式 `setAttempt(value => value + 1)`，拿到 React 当前状态。不能把多个 setState 当同步赋值读取新值；日志在当前事件里仍可能打印旧快照，下一次渲染才是新状态。

跟做破坏实验：把 SearchBox 的 `onChange={(event) => onChange(event.target.value)}` 暂时改成 `onChange={() => {}}`，输入将无法改变；打开 React DevTools 看 App keyword 一直是空字符串，再恢复。记录是“事件没有传播到拥有状态的一层”，不是“React随机失灵”。

## 列表 key 和条件渲染

`found.map(event => <EventCard key={event.id} event={event} />)` 的 key 帮 React 区分同层项目在新增、删除、重排后还是哪一项。数组序号会随筛选变化，若卡片以后有局部输入状态，可能把原第2项状态错误复用给另一个项目。用真实稳定唯一 id；前一阶段 parseEvents 已拒绝重复 id。key 是 React 的识别信息，不会自动作为普通 prop 传给卡片。[React 列表](https://react.dev/learn/rendering-lists)。

条件渲染先判断 loading/error，再 success；只有 success 有 events 字段。success 的数组为空表示请求成功但无活动，和输入“不存在”得到的“没有匹配活动”也不同。切数据场景亲自检查三种情况，而不是只显示四张卡片就认为完成。

## Effect：什么时候请求、什么时候清理

组件渲染应描述界面，不能在函数正文每次 render 都发 fetch，否则 setState 再 render 会形成请求循环。useEvents 的 Effect 在 [scenario, attempt] 改变时同步外部数据；输入 keyword 不在依赖里，所以本地筛选不重复下载整份 JSON。依赖列表也不能靠随意删字段来避免更新，要解释每个变量是否参与请求。[React Effect](https://react.dev/learn/synchronizing-with-effects)。

时间线：第一次显示 → Effect 建 AbortController 并请求 → 成功后更新 success → scenario 改变/组件离开 → 清理函数 abort 旧请求 → 新 Effect 请求。回调检查 signal.aborted，旧请求不覆盖新结果。这里自定义 Hook 用于保存请求生命周期；首页与详情复用同一请求状态，App 统一调用一次，不是每张卡片调用一次 Hook 发同一个请求。

StrictMode 在开发环境会额外运行一轮设置/清理，帮助暴露没有正确清理的副作用。Network 看到取消的首轮请求不等于需要关掉 StrictMode。真正修复应让设置/清理成对；生产构建通常没有这个开发检查行为。

练习：DevTools Network 设置 Slow 3G，再由“正常”快速切到“空数据”；等待旧请求结束仍应显示空数据。切回正常恢复4项。Effect 的取消测试在后阶段会自动化。

键盘按重试时error按钮会在loading状态被移除。如果只更新请求state，焦点可能掉到body。App先通过heading ref聚焦始终存在的h1，再增加attempt；加载成功/为空/失败都保留明确的阅读起点。浏览器测试用Enter触发500后的重试，断言活动恢复且标题仍有焦点，帮助用户继续Tab到下一项。

## 表单：验证与真实提交必须分开

RegistrationForm 的 name/email 都是受控状态，submit 首先 preventDefault，防止浏览器把输入拼进 URL 或重新加载。name.trim() 拒绝空格；邮箱规则只做教学格式检查，不能证明邮箱存在。字段错误使用 role=alert，label 与 id 关联；用户继续编辑时清除旧错误和已过检查的反馈，避免修改后还显示以前的结论。

本项目没有 POST API、没有数据库、没有认证，页面准确显示“字段已通过本地检查；尚未提交、未保存到服务器”。真实报名必须追加后端再次验证、提交中禁重复、成功回执、失败重试和服务器记录；仅前端校验不能提供权限或安全保证。

验收：空姓名点击提示“请填写姓名”；姓名正常/邮箱乱写提示邮箱格式；虚构合法值显示“尚未提交”；再改姓名旧反馈清空，Network 没有报名 POST。之后才可以讨论接后端，不要把弹窗当报名已实现。


### JSX里的表达式与表单规则，逐段读一遍

标签里的 `{...}` 让JavaScript表达式参与显示；`{event.title}`显示文字，React默认将它作为文本，不能改成直接执行用户HTML。`condition && <p>...</p>`表示条件为真才显示；三元 `condition ? A : B`在两种界面中选择。空标签 `<>...</>`称为Fragment，只把几个兄弟元素组合成一次返回，不额外制造div；`map`将每个活动变成一个组件，不会改原数组。`onClick={() => onFavorite(id)}`是在点击时调用函数，若写成 `onClick={onFavorite(id)}`会在渲染时立即调用并把返回值作为事件处理器。

邮箱演示规则中的 `^`和`$`限制从头到尾匹配，`[^\s@]+`要求一个或多个非空白且非@字符，`@`要求分隔符，`\.`表示真的点而非任意字符；它只是本地宽松格式提示，真实邮件地址规则更复杂，也无法验证用户能收到邮件。`FormEvent<HTMLFormElement>`仅是TypeScript的事件类型，不能使浏览器自动验证或发送表单。

## Hash 路由与刷新为什么能工作

三个主要地址为 `#/`、`#/events`、`#/events/1`。hash 是 # 后浏览器片段，HTTP 请求不会发送这个部分。点击链接触发 hashchange，useHashRoute 的监听更新 route，App 根据 page 选择 UI。刷新详情时服务器仍请求项目 index.html，React 启动后 parseRoute 读取 hash，所以详情能恢复。非法编号、不存在 id 都有可返回列表的提示。

客户端路由处理“当前显示哪个视图”，服务器路由处理“HTTP路径返回哪个资源”。若以后换成 History 路由 `/events/1`，开发服务器可能帮你回退 index.html，而 GitHub Pages 静态站通常不会；不能只在 dev 刷新一次就宣称线上可用。本课 hash 路由适合静态演示，已有框架路由库可提供更完整的嵌套路由/数据加载/导航守卫，当前小路由只覆盖明确列出的几页，不是通用生产路由库。

按浏览器后退/前进、复制完整详情地址、新标签页打开、刷新、输入 `#/events/999`、输入 `#/unknown`，每一种都检查。路由变化后标题得到焦点；“跳到正文”用 preventDefault 聚焦 main，不能让 #main 被路由误判。

## UI 库与调试工具怎样有目的地用

本例按钮、卡片、表单用原生语义和基础 CSS：样式集中、focus-visible 可见、disabled 真正阻止分页。组件库不是禁用，但引入前要知道它解决什么重复问题、是否增加 JS/CSS、键盘焦点是否正确。可复制本项目到独立实验文件夹再试某个库，用 build 的 gzip 大小、Tab顺序、标签名称做对照；不要只凭宣传语说“可访问”。本课没有为试库而安装大型模板。

从[React DevTools官方入口](https://react.dev/learn/react-developer-tools)安装对应浏览器扩展后，在 Components 里查 App → EventResults → SearchBox 的 props 与 state；使用 Profiler 记录输入是否让整个不相关页面反复渲染，先定位再考虑优化。不变更 state 时不要先加 useMemo 或全局库。普通 Console 看异常与请求，React DevTools 看组件责任与数据来源，两者互补。


### 真的比较一个组件库，而不是只看宣传

followup-04还提供 `http://127.0.0.1:8804/library.html` 的独立对照入口，依赖已锁定 `@radix-ui/react-dialog@1.3.1`。普通按钮和搜索仍使用原生HTML，不需要库；模态弹窗涉及焦点陷阱、Escape关闭与焦点归还，才使用Radix。点击“查看活动说明”，Tab应只能在弹窗的备注和关闭按钮间循环，Escape后焦点回触发按钮。完整入口、CSS和测试代码都在后面。[Radix Dialog官方说明](https://www.radix-ui.com/primitives/docs/components/dialog)。

Dialog.Root提供弹窗上下文；Trigger是触发器；asChild让它把行为交给里面的原生button，避免嵌套两层button；Portal将内容放到body；Overlay是背景遮罩；Content是dialog；Title/Description提供可读名称和说明；Close负责关闭。库提供交互行为，我们仍要写CSS和正确语义，不能认为引入后无障碍自动全部合格。

构建同时输出main/vue/library三个入口，正常活动页没有导入Dialog所以不自动执行弹窗代码。用build输出和Network分别记录活动入口与library入口加载哪些JS；第三方库带来额外资源与依赖维护，只将它用于确实需要的交互。浏览器自动测试已覆盖Tab循环、Escape、焦点归还；人工屏幕阅读器仍需另测。若以后把弹窗合并进活动首页，要重新记录首页包体积，不能沿用独立入口的基线。

## Vue 可选等价入口，先看一件事的两种写法

同一个开发服务打开 `http://127.0.0.1:8804/vue.html`。应该看到“Vue 等价搜索示例”和两条活动，输入“图论”只剩一条，输入“不存在”有空状态。源文件 VueSearch.vue 完整列在后面，也随 build 输出 vue.html。

`ref('')` 给 keyword 一个响应式盒子，在脚本里访问 `.value`，模板自动解包；`v-model` 将输入和状态连起来；`computed` 根据 keyword 推导 found；`v-for` 渲染列表，`:key` 仍要稳定编号。父传子仍用 props，子报告操作用 emit；生命周期请求可在 onMounted/watch 中建立，并在清理时取消。这些对应概念能比较，但本课 Vue 入口只实现基础输入/列表。选择 Vue 主学者应继续官方组件、事件、生命周期与路由教程再扩展本作品。[Vue 表单输入绑定](https://cn.vuejs.org/guide/essentials/forms)。

## 运行检查、常见问题与独立变式

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

preview 地址 `http://127.0.0.1:8904/`；详情刷新与 vue.html 应可用。Vitest 14条通过；E2E 安装与完整讲解在下一阶段。React 页面没有卡片时先看数据场景与请求状态，不把空数组误当程序崩溃；输入固定不动先查 value 和回调；Effect反复请求先查依赖与调用位置；图片/JSON404先核对 base，不去删 node_modules 猜测。

独立变式：新增一个“只看线上活动”复选框，关键词与复选条件同时生效，返回详情后筛选条件保留。写一个组件测试验证“Web 分享”保留、“图论训练”隐藏，再检查清空关键词不会取消复选状态。

### 参考答案与解释

把 onlyOnline 放在 App，与关键词一样传到 EventResults；过滤为 keyword 匹配后再 `.filter(event => !onlyOnline || event.location === '线上')`。SearchBox 可保持只管关键词，另建有明确 label 的 checkbox。不要在 EventCard 用 querySelector 隐藏 DOM，也不要把 found存成第二套状态。原状态提升由多个视图共同需求决定；若条件只在单页局部有效，则无需放得更高。

## 完整文件：可以逐个建立，也可以下载源码

下面是这个独立项目的全部手写源文件与配置，文件名相对于项目目录。VS Code 左侧右键“新建文件/文件夹”，按相同目录名建立；每份代码完整复制、保存，再运行前面命令。package-lock.json 是 npm 生成的依赖锁，下载版已携带；手建版先 npm install 生成它，不把几千行锁文件当需要手敲的知识点。README 随下载版提供运行、验证、限制。node_modules、dist、test-results、playwright-report 不属于需复制的源码。

`public/fixtures/broken.json` 故意不是合法JSON，用于解析失败场景，请保持原样。没有 missing.json 才能复现真实404。`.env.example` 可复制为 `.env.local`，该设置仅是公开地址。所有例子可在自己的目录修改，不会自动更新学习网站的课程完成状态。

### package.json

```json
{
  "name": "followup-04",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24.15.0"
  },
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 8804 --strictPort",
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview --host 127.0.0.1 --port 8904 --strictPort",
    "format": "prettier --write src tests index.html vite.config.ts tsconfig.json package.json eslint.config.js",
    "lint": "eslint .",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "vue": "3.5.43",
    "@radix-ui/react-dialog": "1.3.1"
  },
  "devDependencies": {
    "vite": "8.3.4",
    "typescript": "6.0.3",
    "vitest": "5.0.4",
    "eslint": "10.12.0",
    "@eslint/js": "10.0.1",
    "typescript-eslint": "8.71.2",
    "prettier": "3.9.10",
    "globals": "17.13.0",
    "@types/node": "24.19.2",
    "@vitejs/plugin-react": "6.1.2",
    "@vitejs/plugin-vue": "6.0.10",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "jsdom": "30.1.2",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.7",
    "@playwright/test": "1.64.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vite/client"],
    "jsx": "react-jsx",
    "allowImportingTsExtensions": true
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"]
}
```

### vite.config.ts

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  base: "./",
  appType: "mpa",
  plugins: [react(), vue()],
  build: {
    rollupOptions: {
      input: { main: "index.html", vue: "vue.html", library: "library.html" },
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["tests/**", "node_modules/**"],
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

### index.html

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>社团活动练习</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### eslint.config.js

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);
```

### .env.example

```text
VITE_API_BASE=fixtures/
```

### .gitignore

```text
node_modules/
dist/
playwright-report/
test-results/
.env.local
```

### library.html

```html
<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>组件库对照实验</title></head><body><div id="library-app"></div><script type="module" src="/src/library-main.tsx"></script></body></html>
```

### playwright.config.ts

```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:8804', trace: 'retain-on-failure', ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}) },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:8804', reuseExistingServer: false },
});
```

### public/fixtures/broken.json

```text
[not valid JSON]
```

### public/fixtures/business.json

```json
{"ok":false,"code":"MAINTENANCE"}
```

### public/fixtures/empty.json

```json
[]
```

### public/fixtures/invalid.json

```json
[{"id":1,"start_time":"2026-11-01"}]
```

### public/fixtures/normal.json

```json
[
  {
    "id": 1,
    "title": "图论训练",
    "start_time": "2026-11-01 14:00",
    "location": "教室 A"
  },
  {
    "id": 2,
    "title": "算法交流",
    "start_time": "2026-11-02 10:00"
  },
  {
    "id": 3,
    "title": "Web 分享",
    "start_time": "2026-11-03 15:00",
    "location": "线上"
  },
  {
    "id": 4,
    "title": "Go 入门",
    "start_time": "2026-11-04 15:00",
    "location": "教室 B"
  }
]
```

### src/App.tsx

```tsx
import { useEffect, useRef, useState } from "react";
import { type Scenario } from "./api";
import { useEvents } from "./useEvents";
import { useHashRoute } from "./route";
import { StateView } from "./components/StateView";
import { EventResults } from "./components/EventResults";
import { RegistrationForm } from "./components/RegistrationForm";
export default function App() {
  const route = useHashRoute();
  const [keyword, setKeyword] = useState("");
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [attempt, setAttempt] = useState(0);
  const state = useEvents(scenario, attempt);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [route]);
  const detail =
    route.page === "detail" && state.status === "success"
      ? state.events.find((event) => event.id === route.id)
      : undefined;
  const title =
    route.page === "home"
      ? "社团活动首页"
      : route.page === "events"
        ? "活动列表"
        : route.page === "detail"
          ? "活动详情"
          : route.page === "resources"
            ? "学习资料"
            : "页面不存在";
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        跳到正文
      </a>
      <main id="main" tabIndex={-1}>
        <nav aria-label="主导航">
          <a href="#/">首页</a>
          <a href="#/events">活动列表</a>
          <a href="#/resources">学习资料</a>
        </nav>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <p className="muted">
          本地固定演示数据，不提供账号、报名或服务器保存。
        </p>
        <label>
          数据场景
          <select
            value={scenario}
            onChange={(event) => setScenario(event.target.value as Scenario)}
          >
            <option value="normal">正常</option>
            <option value="empty">空数据</option>
            <option value="invalid">字段错误</option>
            <option value="http">HTTP错误</option>
            <option value="broken">JSON错误</option>
            <option value="business">业务错误</option>
          </select>
        </label>
        {route.page === "home" && (
          <p>
            从<a href="#/events">活动列表</a>
            搜索活动，再打开详情。数据状态可在上方切换。
          </p>
        )}
        {(route.page === "home" ||
          route.page === "events" ||
          route.page === "detail") && (
          <StateView
            state={state}
            onRetry={() => {
              heading.current?.focus();
              setAttempt((value) => value + 1);
            }}
          />
        )}
        {(route.page === "home" || route.page === "events") &&
          state.status === "success" && (
            <EventResults
              events={state.events}
              keyword={keyword}
              onKeyword={setKeyword}
            />
          )}
        {route.page === "detail" &&
          state.status === "success" &&
          (detail ? (
            <section>
              <h2>{detail.title}</h2>
              <p>
                {detail.startTime} · {detail.location}
              </p>
              <a href="#/events">返回活动列表</a>
              <RegistrationForm />
            </section>
          ) : (
            <p role="status">
              找不到这项活动，请<a href="#/events">返回列表</a>。
            </p>
          ))}
        {route.page === "resources" && (
          <section>
            <h2>学习资料入口</h2>
            <p>本站使用本地 fixtures JSON 演示接口，不展示实时用户数。</p>
            <a href="https://react.dev/learn" target="_blank" rel="noreferrer">
              React 官方学习
            </a>
          </section>
        )}
        {route.page === "missing" && (
          <p>
            链接格式无法识别，请<a href="#/">返回首页</a>。
          </p>
        )}
      </main>
    </>
  );
}
```

### src/VueSearch.vue

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
const keyword = ref("");
const events = [
  { id: 1, title: "图论训练" },
  { id: 2, title: "算法交流" },
];
const found = computed(() =>
  events.filter((event) => event.title.includes(keyword.value.trim())),
);
</script>
<template>
  <main>
    <h1>Vue 等价搜索示例</h1>
    <p>可选分支：只展示基础输入和列表，不代表完整 React 路线均已改写。</p>
    <label>搜索活动<input v-model="keyword" type="search" /></label>
    <ul class="cards" v-if="found.length">
      <li class="card" v-for="event in found" :key="event.id">
        {{ event.title }}
      </li>
    </ul>
    <p role="status" v-else>没有匹配活动</p>
  </main>
</template>
```

### src/api.test.ts

```ts
import { afterEach, expect, it, vi } from "vitest";
import { loadEvents } from "./api";
afterEach(() => vi.unstubAllGlobals());
it("404 不会被当成成功JSON", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("{}", { status: 404 })),
  );
  await expect(loadEvents()).rejects.toMatchObject({ kind: "http" });
});
it("网络拒绝与HTTP错误可区分", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  await expect(loadEvents()).rejects.toMatchObject({ kind: "network" });
});
it("合法JSON但业务失败可区分", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response('{"ok":false}')),
  );
  await expect(loadEvents()).rejects.toMatchObject({ kind: "business" });
});
it("数据缺字段不能靠类型断言蒙混", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('[{"id":1}]')));
  await expect(loadEvents()).rejects.toMatchObject({ kind: "data" });
});
```

### src/api.ts

```ts
import { parseEvents, type EventItem } from "./events";
export type Scenario =
  "normal" | "empty" | "invalid" | "business" | "http" | "broken";
export class RequestError extends Error {
  constructor(
    public kind: "network" | "http" | "data" | "business",
    message: string,
  ) {
    super(message);
  }
}
export async function loadEvents(
  scenario: Scenario = "normal",
  signal?: AbortSignal,
): Promise<EventItem[]> {
  const base = import.meta.env.VITE_API_BASE || "fixtures/";
  const filename = scenario === "http" ? "missing.json" : scenario + ".json";
  const url = new URL(
    base + filename,
    new URL(import.meta.env.BASE_URL, document.baseURI),
  );
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error: unknown) {
    if (signal?.aborted) throw error;
    throw new RequestError("network", "网络连接失败，请检查网络后重试");
  }
  if (!response.ok)
    throw new RequestError("http", `HTTP ${response.status}：请求未成功`);
  try {
    const value: unknown = await response.json();
    if (
      typeof value === "object" &&
      value !== null &&
      "ok" in value &&
      value.ok === false
    ) {
      throw new RequestError("business", "演示服务暂停，请稍后重试");
    }
    return parseEvents(value);
  } catch (error: unknown) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(
      "data",
      error instanceof SyntaxError
        ? "响应不是可读取的 JSON，请检查接口地址或文件内容"
        : error instanceof Error
          ? error.message
          : "数据无法读取",
    );
  }
}
```

### src/components/EventCard.tsx

```tsx
import type { EventItem } from "../events";
type Props = {
  event: EventItem;
  favorite?: boolean;
  onFavorite?: (id: number) => void;
};
export function EventCard({ event, favorite, onFavorite }: Props) {
  return (
    <li className="card">
      <h2>
        <a href={`#/events/${event.id}`}>{event.title}</a>
      </h2>
      <p>
        {event.startTime} · {event.location}
      </p>
      {onFavorite && (
        <button
          type="button"
          aria-pressed={favorite}
          onClick={() => onFavorite(event.id)}
        >
          {favorite ? "取消收藏" : "收藏"}：{event.title}
        </button>
      )}
    </li>
  );
}
```

### src/components/EventResults.test.tsx

```tsx
import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { EventResults } from "./EventResults";
const events = [
  { id: 1, title: "图论训练", startTime: "2026-11-01" },
  { id: 2, title: "算法交流", startTime: "2026-11-02" },
];
function Harness() {
  const [keyword, setKeyword] = useState("");
  return (
    <EventResults events={events} keyword={keyword} onKeyword={setKeyword} />
  );
}
it("输入后改变真实列表，并处理空搜索结果", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.type(screen.getByRole("searchbox", { name: "搜索活动" }), "图论");
  expect(screen.getByRole("link", { name: "图论训练" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "算法交流" })).toBeNull();
  await user.clear(screen.getByRole("searchbox", { name: "搜索活动" }));
  await user.type(
    screen.getByRole("searchbox", { name: "搜索活动" }),
    "不存在",
  );
  expect(screen.getByRole("status").textContent).toContain("没有匹配活动");
});
```

### src/components/EventResults.tsx

```tsx
import { filterEvents, type EventItem } from "../events";
import { EventCard } from "./EventCard";
import { SearchBox } from "./SearchBox";
export function EventResults({
  events,
  keyword,
  onKeyword,
}: {
  events: EventItem[];
  keyword: string;
  onKeyword: (value: string) => void;
}) {
  const found = filterEvents(events, keyword);
  return (
    <section>
      <SearchBox value={keyword} onChange={onKeyword} />
      <p role="status">
        {events.length === 0
          ? "暂时没有活动"
          : found.length === 0
            ? "没有匹配活动，请修改关键词"
            : `找到 ${found.length} 个活动`}
      </p>
      <ul className="cards">
        {found.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </ul>
    </section>
  );
}
```

### src/components/RegistrationForm.test.tsx

```tsx
import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm } from "./RegistrationForm";
it("本地字段检查说明未提交，并在编辑后清除旧反馈", async () => {
  const user = userEvent.setup();
  render(<RegistrationForm />);
  await user.click(screen.getByRole("button", { name: "检查字段" }));
  expect(screen.getByRole("alert").textContent).toBe("请填写姓名");
  await user.type(screen.getByLabelText("姓名"), "测试同学");
  await user.type(screen.getByLabelText("邮箱"), "demo@example.com");
  await user.click(screen.getByRole("button", { name: "检查字段" }));
  expect(screen.getByRole("status").textContent).toContain("尚未提交");
  await user.type(screen.getByLabelText("姓名"), "A");
  expect(screen.getByRole("status").textContent).toBe("");
});
```

### src/components/RegistrationForm.tsx

```tsx
import { useState, type FormEvent } from "react";
export function RegistrationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!name.trim()) {
      setError("请填写姓名");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请填写可用的邮箱格式");
      return;
    }
    setError("");
    setMessage("字段已通过本地检查；尚未提交、未保存到服务器。");
  }
  function clearFeedback() {
    setError("");
    setMessage("");
  }
  return (
    <form onSubmit={submit} noValidate>
      <h2>报名字段演示</h2>
      <p>仅本地检查，不提供报名服务。请使用虚构测试资料。</p>
      <label htmlFor="name">姓名</label>
      <input
        id="name"
        value={name}
        autoComplete="off"
        aria-describedby="form-error"
        onChange={(event) => {
          setName(event.target.value);
          clearFeedback();
        }}
      />
      <label htmlFor="email">邮箱</label>
      <input
        id="email"
        type="email"
        value={email}
        autoComplete="off"
        aria-describedby="form-error"
        onChange={(event) => {
          setEmail(event.target.value);
          clearFeedback();
        }}
      />
      <p id="form-error" className="error" role="alert">
        {error}
      </p>
      <button type="submit">检查字段</button>
      <p role="status">{message}</p>
    </form>
  );
}
```

### src/components/SearchBox.tsx

```tsx
type Props = { value: string; onChange: (value: string) => void };
export function SearchBox({ value, onChange }: Props) {
  return (
    <label>
      搜索活动
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
```

### src/components/StateView.tsx

```tsx
import type { LoadState } from "../useEvents";
export function StateView({
  state,
  onRetry,
}: {
  state: LoadState;
  onRetry: () => void;
}) {
  if (state.status === "loading") return <p role="status">正在加载…</p>;
  if (state.status === "error")
    return (
      <section>
        <p role="alert" className="error">
          {state.message}
        </p>
        <button type="button" onClick={onRetry}>
          重新加载
        </button>
      </section>
    );
  if (state.events.length === 0)
    return <p role="status">暂时没有活动，请稍后再来。</p>;
  return null;
}
```

### src/dialog-demo.css

```css
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 45%);
}
.dialog-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(90vw, 500px);
  max-height: 90vh;
  overflow: auto;
  background: white;
  padding: 24px;
  border-radius: 10px;
}
```

### src/events.test.ts

```ts
import { describe, expect, it } from "vitest";
import { filterEvents, normalizeKeyword, parseEvents } from "./events";
const events = parseEvents([
  { id: 1, title: "图论训练", start_time: "2026-11-01" },
  { id: 2, title: "Web 分享", start_time: "2026-11-02" },
]);
describe("筛选与数据边界", () => {
  it("搜索图论只返回编号1", () =>
    expect(filterEvents(events, " 图论 ").map((e) => e.id)).toEqual([1]));
  it("英文忽略大小写", () =>
    expect(filterEvents(events, "web").map((e) => e.id)).toEqual([2]));
  it("没有匹配返回空数组", () =>
    expect(filterEvents(events, "不存在")).toEqual([]));
  it("空关键字返回全部", () =>
    expect(filterEvents(events, "")).toHaveLength(2));
  it("undefined关键字安全收窄", () =>
    expect(normalizeKeyword(undefined)).toBe(""));
  it("缺少标题拒绝外部数据", () =>
    expect(() => parseEvents([{ id: 1, start_time: "2026" }])).toThrow(
      "缺少字段",
    ));
  it("重复编号拒绝", () =>
    expect(() =>
      parseEvents([
        { id: 1, title: "A", start_time: "1" },
        { id: 1, title: "B", start_time: "2" },
      ]),
    ).toThrow("重复"));
  it("缺失地点在适配层补待定", () => expect(events[0].location).toBe("待定"));
});
```

### src/events.ts

```ts
export interface EventItem {
  id: number;
  title: string;
  startTime: string;
  location?: string;
}
export function normalizeKeyword(value: string | undefined): string {
  return typeof value === "string" ? value.trim().toLocaleLowerCase() : "";
}
export function filterEvents(
  events: EventItem[],
  keyword: string,
): EventItem[] {
  const q = normalizeKeyword(keyword);
  return events.filter((event) => event.title.toLocaleLowerCase().includes(q));
}
export function parseEvents(value: unknown): EventItem[] {
  if (!Array.isArray(value)) throw new Error("活动数据应为数组");
  const seen = new Set<number>();
  return value.map((row: unknown, index): EventItem => {
    if (
      typeof row !== "object" ||
      row === null ||
      !("id" in row) ||
      !("title" in row) ||
      !("start_time" in row)
    ) {
      throw new Error(`第 ${index + 1} 条活动缺少字段`);
    }
    if (
      typeof row.id !== "number" ||
      !Number.isSafeInteger(row.id) ||
      row.id < 1 ||
      seen.has(row.id)
    ) {
      throw new Error(`第 ${index + 1} 条活动编号无效或重复`);
    }
    if (
      typeof row.title !== "string" ||
      !row.title.trim() ||
      typeof row.start_time !== "string" ||
      !row.start_time.trim()
    ) {
      throw new Error(`第 ${index + 1} 条活动标题或时间无效`);
    }
    if (
      "location" in row &&
      row.location !== null &&
      typeof row.location !== "string"
    ) {
      throw new Error(`第 ${index + 1} 条活动地点应为文字`);
    }
    seen.add(row.id);
    return {
      id: row.id,
      title: row.title.trim(),
      startTime: row.start_time,
      location:
        "location" in row &&
        typeof row.location === "string" &&
        row.location.trim()
          ? row.location.trim()
          : "待定",
    };
  });
}
```

### src/library-main.tsx

```tsx
import { createRoot } from "react-dom/client";
import * as Dialog from "@radix-ui/react-dialog";
import "./style.css";
import "./dialog-demo.css";
const root = document.getElementById("library-app");
if (!root) throw new Error("缺少 library-app");
createRoot(root).render(
  <main>
    <h1>组件库对照实验</h1>
    <p>普通链接/按钮仍可自己写，复杂焦点行为可以借助经过核对的组件。</p>
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button">查看活动说明</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>活动说明</Dialog.Title>
          <Dialog.Description>
            本地演示活动；此处没有报名服务。
          </Dialog.Description>
          <label>
            备注
            <input placeholder="输入虚构备注" />
          </label>
          <Dialog.Close asChild>
            <button type="button">关闭说明</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </main>,
);
```

### src/main.tsx

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
const root = document.getElementById("app");
if (!root) throw new Error("缺少 #app 容器");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### src/route.ts

```ts
import { useEffect, useState } from "react";
export type Route =
  | { page: "home" | "events" | "resources" }
  | { page: "detail"; id: number }
  | { page: "missing" };
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  if (path === "/") return { page: "home" };
  if (path === "/events") return { page: "events" };
  if (path === "/resources") return { page: "resources" };
  const match = /^\/events\/([1-9]\d*)$/.exec(path);
  if (match && Number.isSafeInteger(Number(match[1])))
    return { page: "detail", id: Number(match[1]) };
  return { page: "missing" };
}
export function useHashRoute() {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
```

### src/style.css

```css
* {
  box-sizing: border-box;
}
:root {
  color: #252525;
  background: #f7f5ef;
  font:
    18px/1.65 system-ui,
    sans-serif;
}
body {
  margin: 0;
}
main {
  width: min(100% - 32px, 960px);
  margin: 32px auto;
}
h1,
h2,
h3 {
  line-height: 1.3;
}
nav,
.filters,
.paging {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
a {
  color: #164d85;
}
button,
input,
select {
  font: inherit;
  padding: 8px 12px;
  max-width: 100%;
}
input {
  width: min(100%, 360px);
}
label {
  display: block;
}
button {
  cursor: pointer;
  background: #fff;
  color: #252525;
  border: 1px solid #666;
  border-radius: 6px;
}
button:disabled {
  cursor: default;
  opacity: 0.5;
}
:focus-visible {
  outline: 3px solid #145ba5;
  outline-offset: 3px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 16px;
  padding: 0;
  list-style: none;
}
.card {
  background: white;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  overflow-wrap: anywhere;
}
.error {
  color: #9b1c17;
}
.muted {
  color: #555;
}
.skip {
  position: absolute;
  top: -80px;
  left: 16px;
  background: white;
  padding: 12px;
}
.skip:focus {
  top: 8px;
}
.banner {
  width: 100%;
  max-width: 640px;
  height: auto;
}
@media (min-width: 768px) {
  main {
    margin-top: 48px;
  }
}
```

### src/test-setup.ts

```ts
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
afterEach(cleanup);
```

### src/useEvents.ts

```ts
import { useEffect, useState } from "react";
import { loadEvents, type Scenario } from "./api";
import type { EventItem } from "./events";
export type LoadState =
  | { status: "loading" }
  | { status: "success"; events: EventItem[] }
  | { status: "error"; message: string };
export function useEvents(scenario: Scenario, attempt: number) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    loadEvents(scenario, controller.signal).then(
      (events) => {
        if (!controller.signal.aborted) setState({ status: "success", events });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            status: "error",
            message:
              error instanceof Error ? error.message : "未知错误，请重试",
          });
      },
    );
    return () => controller.abort();
  }, [scenario, attempt]);
  return state;
}
```

### src/vue-env.d.ts

```ts
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}
```

### src/vue-main.ts

```ts
import { createApp } from "vue";
import VueSearch from "./VueSearch.vue";
import "./style.css";
createApp(VueSearch).mount("#vue-app");
```

### tests/user-flow.spec.ts

```ts
import { test, expect } from "@playwright/test";
test("搜索→详情→刷新→返回", async ({ page }) => {
  await page.goto("/#/events");
  await page.getByRole("searchbox", { name: "搜索活动" }).fill("图论");
  await expect(
    page.getByRole("link", { name: "算法交流", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "图论训练", exact: true }).click();
  await expect(page).toHaveURL(/#\/events\/1$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "图论训练", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "返回活动列表" }).click();
  await expect(
    page.getByRole("heading", { name: "活动列表", exact: true }),
  ).toBeVisible();
});
test("失败→重试→正常；空数据独立文案", async ({ page }) => {
  await page.goto("/#/events");
  await page.getByLabel("数据场景").selectOption("http");
  await expect(page.getByRole("alert")).toContainText("HTTP 404");
  await page.getByLabel("数据场景").selectOption("normal");
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toBeVisible();
  await page.getByLabel("数据场景").selectOption("empty");
  await expect(page.getByText("暂时没有活动", { exact: true })).toBeVisible();
});
test("断网恢复、加载状态、旧请求不覆盖新结果", async ({ page, context }) => {
  await page.route("**/fixtures/normal.json", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });
  await page.goto("/#/events");
  await expect(page.getByText("正在加载…", { exact: true })).toBeVisible();
  await page.getByLabel("数据场景").selectOption("empty");
  await expect(page.getByText("暂时没有活动", { exact: true })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toHaveCount(0);
  await context.setOffline(true);
  await page.getByLabel("数据场景").selectOption("normal");
  await expect(page.getByRole("alert")).toContainText("网络连接失败");
  await context.setOffline(false);
  await page.getByRole("button", { name: "重新加载" }).click();
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toBeVisible();
});
for (const width of [360, 768, 1440]) {
  test(`宽度${width}不横向溢出且键盘可搜`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/events");
    const search = page.getByRole("searchbox", { name: "搜索活动" });
    await search.focus();
    await page.keyboard.type("图论");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "图论训练", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/width-${width}.png`,
      fullPage: true,
    });
  });
}

test("可选Vue基础入口与组件库键盘焦点", async ({ page }) => {
  await page.goto("/vue.html");
  await page.getByRole("searchbox", { name: "搜索活动" }).fill("图论");
  await expect(page.getByText("算法交流", { exact: true })).toHaveCount(0);
  await expect(page.getByText("图论训练", { exact: true })).toBeVisible();
  await page.goto("/library.html");
  const trigger = page.getByRole("button", { name: "查看活动说明" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "活动说明" })).toBeVisible();
  await expect(page.getByLabel("备注")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "关闭说明" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("备注")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("键盘重试成功后焦点回到稳定页标题", async ({ page }) => {
  let broken = true;
  await page.route("**/fixtures/normal.json", (route) =>
    broken
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: "{}",
        })
      : route.continue(),
  );
  await page.goto("/#/events");
  await expect(page.getByRole("alert")).toContainText("HTTP 500");
  broken = false;
  await page.getByRole("button", { name: "重新加载" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "活动列表", exact: true }),
  ).toBeFocused();
});
```

### vue.html

```html
<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Vue 等价搜索</title></head><body><div id="vue-app"></div><script type="module" src="/src/vue-main.ts"></script></body></html>
```

## 学完如何证明自己能继续

关闭参考答案，独立修改变式；在notes/web保存修改理由、运行命令、具体输出与仍不懂的地方。例子跑通只是验证环境和参考代码，并不会自动把你标成已掌握。只有自己完成任务且留下验收证据后再更新学习记录。

官方资料于2026-10-13核对，安装页面/主版本会变化，源码依赖已用lock固定；升级以兼容范围与真实检查为准。
