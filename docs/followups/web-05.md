# 让修改有测试保护：请求边界、失败恢复、可访问性和测量

本阶段直接在上一课的活动前端上添加可重复的质量检查。真正的成果不是“安装了 Vitest”，而是你改坏筛选后能看到测试失败；断网后页面仍能操作，重连可恢复；键盘能完成主流程；资源优化有明确的前后字节数。源码在 `exercises/web/followup-05`，没有真实账号、后端或数据库。

## 打开项目，先记录基线

VS Code 打开 followup-05 文件夹，终端确认末尾是该目录，Node 要求24.15+。Windows执行如下，macOS/Linux将npm.cmd改为npm：

```powershell
npm.cmd ci
npm.cmd run dev
```

打开 `http://127.0.0.1:8805/`，进入活动列表搜索“图论”，查看详情，返回。再切换数据场景，记录正常、空、字段错误、JSON错误、HTTP错误、业务错误各自文案。不要在拿不到数据时凭空补一份看似成功的列表。

本项目保留上一课组件，新增 `api.test.ts`、组件交互测试、浏览器流程测试、PerformancePanel 与资源生成脚本。测试放在自己的项目，没要求你到整个资料仓库根目录安装依赖。所有图片为自制简单几何图，所有活动是固定演示 JSON。

## 统一接口层与视图适配：数据走过哪些关口

```text
组件需要活动
  → useEvents(scenario, attempt)
  → api.ts 的 loadEvents
  → fetch /fixtures/*.json
  → 检查 HTTP 状态
  → 解析 unknown JSON
  → 检查业务失败
  → parseEvents 验证字段与编号
  → 将 start_time 转 startTime、缺地点补待定
  → success 状态
  → EventResults / EventCard
```

接口函数集中处理 URL、信号、HTTP、JSON、领域规则，组件不各自拼 URL。接口数据协议与前端视图模型可以不同：本课只在 parseEvents 中处理 snake_case 字段和地点默认值，卡片只用 EventItem。服务端以后将地点改为空值时修适配层，而不是在每个组件复制判断。

输入不是对象、缺标题、重复 id 等直接拒绝，不能用 `response.json() as EventItem[]` 认为已验证。网络错误是请求未完成，HTTP错误是返回了错误状态，业务错误是HTTP成功但服务表示拒绝，数据错误是响应无法解析或协议不符。四种 kind 对排错和恢复建议有不同含义。

本项目配置 `appType: 'mpa'`，因为实际导航只用 hash，不需要开发服务器对不存在的资源回退 HTML。这样请求 `fixtures/missing.json` 真正返回404；否则某些 SPA 开发服务会给200的index.html，导致JSON解析错误。这个区别能在 Network 的 Status 与 Response 里直接看见，不能只读 catch 文案猜服务器状态。

## 五种状态与错误恢复

初始化可视为 idle；本课进入页面立即开始请求，初值 loading。之后成功且数组有内容→正常列表；成功但数组为空→“暂时没有活动”；成功有内容但关键词无匹配→“没有匹配活动”；任何请求/协议失败→error与重新加载按钮。空数据是成功结果，不应该显示检查网络；error没有数据可筛选时也不能随输入变成空状态。

```text
进入页面 / 切换场景 / 重新加载
                ↓
              loading
             ↙       ↘
    success（可能空）   error
          ↑             │
          └─ 重试→loading┘
```

操作性验收：在页面已加载后，将 DevTools Network 设为 Offline，点击错误页“重新加载”或切场景触发请求，应看到网络失败而不是整页白屏；改回 No throttling，点重新加载应恢复。只切回在线但不重发请求不会自动得到新数据，所以必须说明下一步按钮。

等待中的旧请求由 AbortController 清理，用户快速切场景后旧成功也不能覆盖当前空数组。测试中故意把正常请求延迟250ms、马上切空场景，等待300ms后仍无图论卡片，验证的是这个时间边界，不是看代码里有没有写abort。

键盘按重试时error按钮会在loading状态被移除。如果只更新请求state，焦点可能掉到body。App先通过heading ref聚焦始终存在的h1，再增加attempt；加载成功/为空/失败都保留明确的阅读起点。浏览器测试用Enter触发500后的重试，断言活动恢复且标题仍有焦点，帮助用户继续Tab到下一项。

## 前端验证改善体验，后端验证保障业务边界

详情报名字段仅作本地演示：空姓名/空格要报姓名错误，邮箱无基本格式报邮箱错误，虚构合法值显示“尚未提交”。这些反馈帮助用户及时纠正输入；浏览器用户能改JS或直接发HTTP，所以接真实服务器后必须重新校验类型、长度、权限和对象归属。

Form测试要验证行为：点击时出现正确字段错误；修正后明确未提交；再次编辑清除旧结论。不能只断言“form存在”。真实提交才需要 pending 防重复、HTTP失败保留输入、回执确认成功；本项目没有这个后端，所以不出现“报名成功”。

## 单元测试与组件测试：读懂一条断言

在VSCode打开 `src/events.test.ts`。`it` 名称说明规则，expect接实际结果，`toEqual([1])` 比较结构和值。筛选“ 图论 ”得到编号1，所以断言不只是数组长度大于0，还保证没有混入算法活动。缺标题数据应该抛错，`toThrow('缺少字段')` 保护输入边界。数据适配默认地点也有具体断言。

再打开 `src/components/EventResults.test.tsx`：Harness用真正的useState接受输入，Testing Library渲染组件，userEvent模拟实际输入；使用 `getByRole('searchbox', {name:'搜索活动'})` 找语义输入，检查图论链接存在、算法链接消失。清空后输入不存在关键词，确认状态文字。这不是绕开事件直接调用内部setter的测试。[Vitest 入门](https://vitest.dev/guide/)。

运行：

```powershell
npm.cmd test
```

预期 `Test Files 4 passed`、`Tests 14 passed`。测试涉及实际筛选/数据校验8条、API错误分类4条、组件交互与表单2条。jsdom提供DOM环境，适合快速组件检查；它不是完整浏览器，不会证明真实CSS、网络、焦点布局都正确，所以还需要浏览器检查。

api.test 使用受控fetch返回404、网络拒绝、业务失败、错误字段；这是验证接口函数合同。afterEach恢复mock，防止上一例假的fetch污染下一例。端到端测试再使用真正本地HTTP服务，二者覆盖不同风险。

## 亲手红一次，再绿一次

1. 先运行npm test确认基线通过。
2. 打开events.ts，临时把 `event.title.toLocaleLowerCase().includes(q)` 改为 `true`，保存。
3. 再运行npm test，筛选图论、英文与不存在词的测试应失败；组件输入后算法卡片也仍在，相关组件测试失败。阅读Expected与Received，而不是复制AI建议一口气重写全部代码。
4. 恢复原条件、保存、重跑，全部绿。
5. 写下“我破坏了哪条规则→哪条测试发现→恢复后哪些检查通过”。这才验证测试能够拦截回归。

再做类型红绿：把关键词传成42，typecheck应失败，修回通过。行为测试与类型检查都要真实执行，不使用 --if-present 跳过不存在脚本。不要为追覆盖率让测试与实现逐行相同；优先保护用户规则与边界。

## 端到端测试：让浏览器自己走一遍

第一次用Playwright，Windows在项目终端执行：

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

macOS/Linux用npx/npm；Linux如果缺浏览器系统库，按Playwright官方说明执行 `npx playwright install --with-deps chromium`（可能要求系统安装权限）。已安装Edge且不希望下载浏览器可改用本项目支持的通道：Windows `$env:PW_CHANNEL='msedge'` 后运行test:e2e；Shell `PW_CHANNEL=msedge npm run test:e2e`。机器需真实安装Edge，通道配置不会代为安装。[Playwright 安装](https://playwright.dev/docs/intro)。

test:e2e自动启动8805服务并在结束后关闭；先Ctrl+C停止自己的dev，否则strictPort/reuseExistingServer=false会提示冲突。`tests/user-flow.spec.ts` 是完整代码：搜索→详情→刷新→返回；HTTP失败恢复；空数据；加载与过期请求；断网重试；360/768/1440宽度；资源字节对照。成功预期 `8 passed`。失败trace保存在test-results，可用输出日志给出的 `npx playwright show-trace ...` 查看操作和请求。截图也是证据，但截图本身不能取代断言。

Playwright的expect(locator)会等待目标状态，不需要随意固定sleep猜页面多久完成。唯一短等待专门用在“旧请求不覆盖”边界，先通过可等待的空状态，再等被人为延迟的旧请求窗口，不用于掩盖程序不确定性。

## 无障碍与多尺寸回归，如何实际检查

从地址栏进入列表，不用鼠标按Tab：导航→数据场景→搜索→活动链接。输入“图论”，Tab到图论链接按Enter进详情，检查新标题得到焦点。label点击聚焦对应input；focus-visible是3px可见蓝框；错误是role=alert，加载/结果是role=status；h1每页一个，活动h2，不靠大字体代替标题。图片有描述性alt，纯装饰图应使用空alt；不要滥加aria-label覆盖可见文字。

浏览器设备工具选择360、768、1440宽度，检查长标题、输入、按钮、详情表单有没有横向溢出、截断或焦点在屏幕外。自动检查比较document.scrollWidth与innerWidth，只证明横向尺寸，不证明阅读体验。放大到200%再走一遍；对比度用DevTools颜色面板查看正文/背景，不只凭自己看着舒服。屏幕阅读器朗读体验应另做人工核对，自动角色检查不能保证完整可访问性。

## 性能：先量资源，再解释收益与局限

进入学习资料页。资源测量实验展示同一自制SVG；原版故意有12000组无用元数据注释，优化版删除注释但保留相同图形和640×180尺寸。这是可重复的教学实验，不是为了证明任何真实网站“提速几百倍”。资源生成器在npm的predev/prebuild/preview步骤运行，源码ZIP无需包含巨大重复文本。

DevTools Network勾选Disable cache、筛选svg，重新加载后记录原版的资源字节；点击“切换优化资源”记录优化版。压缩后的传输字节、解压资源大小、磁盘大小和加载时间是不同指标，应把列名一起记录。自动测试实际获取响应body大小，原版192195 bytes、优化版188 bytes；如果你的服务启用gzip，传输列可能不同。width/height预留比例可减少图片加载后的布局位移，max-width使窄屏不溢出，loading=lazy仅用于不关键的下方图，首屏关键图不应盲目lazy。[web.dev 图片性能](https://web.dev/learn/performance/image-performance)。

再在构建preview中用Lighthouse固定移动模式、相同网络/CPU设置、无扩展干扰，原/优化各做3次，记录中位数的LCP、CLS与报告位置。LCP衡量最大内容出现时间，CLS描述意外布局位移；本实验小图可能不影响LCP，所以不得编造分数或宣称整体提速。JS包体积、请求数量、缓存命中与图片大小都要看实际瓶颈。照片才应考虑合适像素尺寸、WebP/AVIF和压缩；object-fit改变显示裁切，不降低文件传输量。

## 问题记录与验收证据

遇到异常在notes/web写：URL/hash、Node/浏览器版本、复现步骤、预期、实际、Console首条报错、Network URL/status/response类型、是否只有某尺寸发生、截图/trace位置。不要把测试令牌、Cookie或真实邮箱放进日志。请求没发出查事件/状态；返回404查URL；返回200 HTML查回退/路径；JSON协议错查适配；正确数据仍不显示查props与筛选。

至少保存五个关键案例的结果，不能只写“测试通过”：图论筛选；不存在词；HTTP404；断网重试；详情刷新。加三尺寸截图与资源前后字节，说明自动与人工的边界。

## 独立变式：给请求增加超时与重试说明

不看答案先做：正常响应延迟3秒，1秒后用户应看到可操作的超时提示；切场景导致的取消不应提示超时；点击重试可恢复。写一条测试验证“慢请求→超时→重试”，不要真实等待很多秒，可用受控定时器或浏览器请求延迟。

### 参考答案与解释

为每次请求建立独立controller和timeout标记；计时器到期置timeout标记并abort；finally清除计时器。catch先区分主动离开取消、超时取消和真正网络拒绝。用户切场景时清理旧计时器，否则旧计时器会取消新请求。重试创建全新controller，不复用已aborted的signal。测试同时覆盖超时与场景切换，用户文案明确“请求超时，可重试”，后端仍需自身资源和超时管理。

## 完整文件：可以逐个建立，也可以下载源码

下面是这个独立项目的全部手写源文件与配置，文件名相对于项目目录。VS Code 左侧右键“新建文件/文件夹”，按相同目录名建立；每份代码完整复制、保存，再运行前面命令。package-lock.json 是 npm 生成的依赖锁，下载版已携带；手建版先 npm install 生成它，不把几千行锁文件当需要手敲的知识点。README 随下载版提供运行、验证、限制。node_modules、dist、test-results、playwright-report 不属于需复制的源码。

`public/fixtures/broken.json` 故意不是合法JSON，用于解析失败场景，请保持原样。没有 missing.json 才能复现真实404。`.env.example` 可复制为 `.env.local`，该设置仅是公开地址。所有例子可在自己的目录修改，不会自动更新学习网站的课程完成状态。

### package.json

```json
{
  "name": "followup-05",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24.15.0"
  },
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 8805 --strictPort",
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview --host 127.0.0.1 --port 8905 --strictPort",
    "format": "prettier --write src tests scripts index.html vite.config.ts tsconfig.json package.json eslint.config.js",
    "lint": "eslint .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "predev": "node scripts/make-performance-assets.mjs",
    "prebuild": "node scripts/make-performance-assets.mjs",
    "prepreview": "node scripts/make-performance-assets.mjs"
  },
  "dependencies": {
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "vue": "3.5.43"
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
  build: { rollupOptions: { input: { main: "index.html", vue: "vue.html" } } },
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
public/banner-original.svg
public/banner-optimized.svg
```

### playwright.config.ts

```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:8805', trace: 'retain-on-failure', ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}) },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:8805', reuseExistingServer: false },
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

### scripts/make-performance-assets.mjs

```js
import { mkdirSync, writeFileSync } from "node:fs";
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="180" viewBox="0 0 640 180"><rect width="640" height="180" fill="#edf4ff"/><circle cx="320" cy="90" r="60" fill="#165a9c"/></svg>';
mkdirSync("public", { recursive: true });
writeFileSync("public/banner-optimized.svg", svg);
writeFileSync(
  "public/banner-original.svg",
  svg.replace(
    "</svg>",
    "<!--" + "unused metadata ".repeat(12000) + "--></svg>",
  ),
);
console.log("Generated original/optimized SVG fixtures");
```

### src/App.tsx

```tsx
import { PerformancePanel } from "./components/PerformancePanel";
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
          <>
            <PerformancePanel />
            <section>
              <h2>学习资料入口</h2>
              <p>本站使用本地 fixtures JSON 演示接口，不展示实时用户数。</p>
              <a
                href="https://react.dev/learn"
                target="_blank"
                rel="noreferrer"
              >
                React 官方学习
              </a>
            </section>
          </>
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

### src/components/PerformancePanel.tsx

```tsx
import { useState } from "react";
export function PerformancePanel() {
  const [optimized, setOptimized] = useState(false);
  const file = optimized ? "banner-optimized.svg" : "banner-original.svg";
  return (
    <section>
      <h2>资源体积测量实验</h2>
      <p>
        同一幅自制图形；原版故意保留大量无用注释，只用于对照传输体积，不代表真实线上性能基准。
      </p>
      <button type="button" onClick={() => setOptimized((value) => !value)}>
        {optimized ? "查看原版资源" : "切换优化资源"}
      </button>
      <p role="status">
        当前：{optimized ? "优化版" : "原版"}；在 Network 查看 SVG 大小。
      </p>
      <img
        className="banner"
        src={import.meta.env.BASE_URL + file}
        width="640"
        height="180"
        alt="蓝色圆形活动标识"
        loading="lazy"
      />
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

test("优化图片保留尺寸且实际响应字节减少", async ({ page }) => {
  await page.goto("/#/resources");
  const original = await page.request.get("/banner-original.svg");
  const optimized = await page.request.get("/banner-optimized.svg");
  const before = (await original.body()).length;
  const after = (await optimized.body()).length;
  expect(before).toBeGreaterThan(190000);
  expect(after).toBeLessThan(300);
  await page.getByRole("button", { name: "切换优化资源" }).click();
  await expect(
    page.getByRole("img", { name: "蓝色圆形活动标识" }),
  ).toHaveAttribute("src", /banner-optimized\.svg$/);
  console.log(`Actual SVG response bytes: ${before} -> ${after}`);
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
