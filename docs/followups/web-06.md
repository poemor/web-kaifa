# 完成可展示的前端作品：需求、分页收藏、交付与回滚

本阶段把前几课的活动前端整理成一个可解释的作品，而不是再复制一张漂亮截图。最终作品有首页、活动列表、详情、学习资料，支持搜索、分页、当前浏览器收藏、准确错误恢复与本地字段检查。你需要真实部署自己的副本并保存测试证据；下面的参考实现已在本机运行验证，但没有替你发布一个新的项目，也没有实现服务器报名、账号或云同步。

## 需求先写成八条可验收操作

| 需求 | 操作 | 预期 |
| --- | --- | --- |
| 可预测导航 | 首页点击活动列表 | URL为#/events，标题活动列表 |
| 关键词筛选 | 输入“图论” | 仅图论训练，不整页重载 |
| 空搜索反馈 | 输入不存在词 | 可读空结果，能改词 |
| 列表分页 | 正常数据点下一页 | 看到Web分享与Go入门，页数2/2 |
| 本地收藏 | 收藏图论，刷新 | 仍为已收藏，明确仅此浏览器 |
| 详情可分享 | 新标签打开#/events/1并刷新 | 图论详情与返回链接可用 |
| 错误可恢复 | Offline请求，再上线点重新加载 | 先报网络失败，再恢复列表 |
| 多尺寸键盘 | 360/768/1440与Tab操作 | 不溢出，输入/链接/按钮可达 |

“高级”“有全栈感”不能直接验收。上表同时包含正常、空、失败与范围限制，画页面关系时也要把找不到活动、未知路由和恢复入口考虑进去。

## 页面结构和增量实施顺序

```text
首页 #/
  ├─ 活动列表 #/events
  │   └─ 活动详情 #/events/:id → 返回列表
  └─ 学习资料 #/resources
未知链接 → 页面不存在 → 首页
活动ID不存在 → 找不到活动 → 列表
```

先运行followup-05作为基线，记下测试结果。再在新项目 `exercises/web/followup-06` 做四个增量，每完成一步跑对应验收，不要一口气改完再找白屏：第一步统一设计变量和文案；第二步给EventCard增加收藏回调、把收藏state放在App并保存；第三步在EventResults里增加分页与只看收藏；第四步添加验收、部署与复盘文档。

App继续管理共享数据和导航，EventResults管理本页分页和收藏筛选开关，SearchBox/EventCard/StateView至少三个组件实际复用。改变一个组件时重新走多个使用入口，而不是只在组件单独截图。

## 打开源码，先得到正确基线

VS Code打开followup-06，终端运行以下命令；Windows使用npm.cmd，macOS/Linux使用npm，要求Node24.15+：

```powershell
npm.cmd ci
npm.cmd run dev
```

打开 `http://127.0.0.1:8806/`。活动正常4条，页大小2。第1页图论训练与算法交流，第2页Web分享与Go入门；输入图论会回第1页。收藏图论后刷新仍显示“取消收藏：图论训练”，打开“只看收藏”只剩此项。页面明确说明保存范围，其他设备不会自动看到。

报名字段仍只验证虚构输入，不保存或发送到服务器。不要为作品虚构用户数、在线人数或报名成功回执；公开API会受到速率/稳定性/CORS限制，本课受控fixtures可以离线重复。每页README注明数据文件、字段和来源，真实后端可作为下一条路线的独立目标。

## 收藏为什么保存编号，如何处理错误

收藏数组保存 `[1,3]` 这样的id，而不复制整个活动对象；对象来自数据源，以免标题变化时收藏里留着旧副本。toggle用函数形式读取当前state，有则filter删除、无则创建新数组添加，避免直接push修改同一数组导致界面不更新。EventCard通过onFavorite回调把操作交给App，aria-pressed表达当前开关状态。

localStorage只接受字符串，所以用JSON.stringify写入，JSON.parse读出后仍视为unknown并验证数组、正整数、去重。默认只在有效可读时写回；损坏JSON或拒绝存储时显示明确警告并保留原记录，不把无法读取的真实记录默默覆盖为空数组。本次收藏仍可在内存使用，但刷新可能丢失。这个策略比一行catch返回[]更可解释。

测试“损坏收藏原文不会静默覆盖”先写入受控字符串 `{broken`，刷新、收藏后读回仍为原文。你可在自己的测试浏览器DevTools Application→Local Storage找到 `club-frontend-favorites-v1`，先复制保存，再明确处理测试记录。不要清空整个网站存储，更不要把学习进度记录当无关垃圾。当前示例没做多标签实时同步，已删除活动的旧收藏id也不会自动丢弃；这些限制写在README，不能宣传成云收藏。

## 分页数据流与边界，为什么先筛选再切片

`found` 先应用keyword和onlyFavorites，再计算 `Math.ceil(found.length / pageSize)`，最后 `slice((page-1)*pageSize, page*pageSize)`。若先对所有活动切片再筛选，搜索图论可能只查当前页，漏掉其它页符合条件的活动。

page从1开始，数组索引从0开始，因此第2页size=2的起点是2。搜索或切换收藏过滤时setPage(1)；删除收藏导致页数缩小，用activePage=min(page,totalPages)夹到合法页。空结果不显示分页；第一页上一页disabled，最后一页下一页disabled。不是只把按钮变灰，disabled属性真的禁止操作。

这是小型本地分页，全部4条数据已加载。真实API服务端分页需要传page/limit并接总数或游标，搜索也应按接口契约实现；不能为了上千条数据继续无限下载再在浏览器切片。本阶段先把本地边界做对，再将同样验收改为服务端版本。

只看收藏时取消一项，该卡片和按钮会从DOM移除，浏览器可能把键盘焦点丢到body。EventResults保存筛选checkbox的ref，在调用父层取消前先将焦点转到仍存在的“只看收藏”入口。最后一项也如此，用户可继续按Space关闭过滤，重新看全部活动。新增浏览器测试真的用Space取消最后收藏，断言checkbox保持焦点，再用Space恢复列表，不只是检查空文案。

## 设计一致性与阅读，不靠模板堆装饰

`design-tokens.css` 给品牌色、正文色、背景、间距、圆角、按钮高度起名，style.css统一引用。修改品牌色可同时影响链接和焦点；字号/行高随正文阅读需要设定，卡片允许长标题换行。各页按钮同样高度，空/错反馈同样语义，不给“收藏”与“返回”完全不同且无法预测的操作方式。

在360宽度检查分页与收藏按钮是否换行，200%缩放检查输入仍可用。没有为了作品列表添加无作用搜索、假退出或摆设图表。真的有新交互时需要相应state、清晰反馈、恢复路径和测试。

键盘按重试时error按钮会在loading状态被移除。如果只更新请求state，焦点可能掉到body。App先通过heading ref聚焦始终存在的h1，再增加attempt；加载成功/为空/失败都保留明确的阅读起点。浏览器测试用Enter触发500后的重试，断言活动恢复且标题仍有焦点，帮助用户继续Tab到下一项。

## 测试与三条核心流程证据

停止dev后运行：

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

已有Edge可设置PW_CHANNEL=msedge，具体方法见上一课。预期14条单元/组件测试与11条浏览器测试通过。新增浏览器测试验证分页/收藏刷新/搜索复位，以及损坏记录原文保留。所有测试使用自己的受控演示数据，不操作真实报名。

留三个流程的证据：搜索→详情→刷新→返回；收藏→刷新→只看收藏；断网→重连→重试。记录命令、日期、版本、截图/trace位置，而不是只写打勾。CI、线上验收、人工屏幕阅读器、外部真实接口不在本机测试的证明范围内。

## 构建、发布到自己的GitHub Pages与检查路径

运行build生成dist，然后preview打开 `http://127.0.0.1:8906/`。代码用base:'./'与hash路由，适合静态子目录托管。进入详情刷新、打开vue.html、检查所有JSON/JS/CSS的Network状态；网页可以打开不代表数据请求没404。不要把localhost地址作为线上演示链接给别人。[Vite静态部署](https://vite.dev/guide/static-deploy)。

下面提供完整的`.github/workflows/pages.yml`示例文件，只在你自己的独立作品仓库建立它。将followup-06目录内容作为该仓库根目录（不是把整个学习仓库覆盖成它），GitHub仓库Settings→Pages→Build and deployment选择GitHub Actions。工作流执行ci、lint、typecheck、test、build后上传dist，deploy-pages发布；E2E本机另跑，工作流并未声称执行浏览器测试。[GitHub Pages工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

```yaml
name: publish-frontend
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deploy
```

`build`和`deploy`是两个job，needs保证构建成功后才发布；permissions给本工作流最少的源码读取/Pages发布身份权限，id-token用于平台部署身份，并非你在前端保存令牌。concurrency只保留该发布组最近一次运行，避免旧发布晚到覆盖新发布。`${{ steps.deploy.outputs.page_url }}`是GitHub表达式，读取deploy步骤输出的真实页面地址，不是JavaScript字符串模板。setup-node准备Node与npm缓存，upload-pages-artifact传dist，deploy-pages把artifact发布到Pages。不要将`${{...}}`改成普通`$()`命令。

首次发布：在自己的仓库提交源码、package/lock、README与这个工作流，推送main。打开Actions看每一步真实完成，失败查看日志，不写“CI已经通过”直到真实运行。成功后Pages提供 `https://你的用户名.github.io/你的仓库名/`，用新浏览器标签验证首页、详情刷新、收藏、断网恢复与手机版，记下发布提交hash。本站参考项目没有执行这个新工作流；本机测试成功不能替代你自己账号上的部署成功。

前端VITE_配置都公开，不放数据库口令或API私密钥；Pages只托管静态文件，不运行本项目的Node服务器，也不会自动给本地表单存储能力。准备接后端时明确浏览器→前端托管→API服务的地址、CORS与HTTPS；不要把后端密钥打包进去。

## 两次发布与一次真实回滚怎么练

第一次可用发布后记录GOOD_SHA与在线截图。第二次只改一个可见标题，重跑检查并发布，验证新标题确实在线。若新版本异常，在自己的独立仓库执行 `git log --oneline` 找出确切引入问题的提交，然后 `git revert 那个提交的完整hash`（把文字换成真实hash），解决冲突、重新跑全部检查、提交推送。新工作流应构建恢复版本；最后打开线上看旧行为与资源都恢复。

revert产生新提交，保留历史，不需要强推覆盖别人提交。也可保存经过验证的旧构建artifact用于托管平台回滚，但本课教程不假设GitHub保留了某个artifact。若同时改变数据库协议，退前端不一定能恢复服务；本项目没有数据库，仅演练静态前端回滚。只在文档写回滚步骤不能算实际已演练。

## README、作品陈述与3分钟演示

README写目标用户、8条需求、页面入口、数据来源、启动/验证命令、技术选择理由、本人负责部分、两条实际修复、限制、真实演示与源码地址、部署/回滚步骤。不用“全栈系统”“多人云同步”描述只有本地数据的作品。截图是不同宽度的真实浏览器结果，留日期和版本；没有做过的修复用“待改进”而不是“已解决”。

三分钟脚本：0–30秒说用户需要查什么；30–90秒搜索、详情、收藏刷新；90–120秒演示HTTP错误→恢复；120–150秒解释状态、类型边界、测试保护；150–180秒讲一条亲手发现的bug与仍未实现的服务端功能。现场能解释代码的一条更新链，比罗列React/Vite/AI名称更有用。

## 独立变式：新增排序并保持分页正确

需求：活动列表增加“编号正序/倒序”，切排序回第1页，收藏仍按id正确对应。不能原地sort修改共享events。添加一条测试验证倒序第一页是id4/3，输入图论仍只返回id1；按收藏后刷新不应收藏错项。

### 参考答案与解释

排序state放EventResults（只影响本页），`const sorted = [...found].sort((a,b)=>descending ? b.id-a.id : a.id-b.id)`，随后按sorted切片；切排序同时setPage(1)。复制数组避免修改App请求结果，key始终用event.id，favorites也用id，所以次序变化不影响归属。若排序需写进可分享URL，才将它迁到路由/查询参数并做读取校验。完成后跑单元、组件、浏览器和三尺寸，公开写出本阶段未提供云保存。

## 完整文件：可以逐个建立，也可以下载源码

下面是这个独立项目的全部手写源文件与配置，文件名相对于项目目录。VS Code 左侧右键“新建文件/文件夹”，按相同目录名建立；每份代码完整复制、保存，再运行前面命令。package-lock.json 是 npm 生成的依赖锁，下载版已携带；手建版先 npm install 生成它，不把几千行锁文件当需要手敲的知识点。README 随下载版提供运行、验证、限制。node_modules、dist、test-results、playwright-report 不属于需复制的源码。

`public/fixtures/broken.json` 故意不是合法JSON，用于解析失败场景，请保持原样。没有 missing.json 才能复现真实404。`.env.example` 可复制为 `.env.local`，该设置仅是公开地址。所有例子可在自己的目录修改，不会自动更新学习网站的课程完成状态。

### package.json

```json
{
  "name": "followup-06",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24.15.0"
  },
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 8806 --strictPort",
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview --host 127.0.0.1 --port 8906 --strictPort",
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
  use: { baseURL: 'http://127.0.0.1:8806', trace: 'retain-on-failure', ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}) },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:8806', reuseExistingServer: false },
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
import { readFavorites, writeFavorites } from "./favorites";
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
  const [initialFavorites] = useState(readFavorites);
  const [favorites, setFavorites] = useState(initialFavorites.ids);
  const [favoriteWarning, setFavoriteWarning] = useState(
    initialFavorites.warning,
  );
  function toggleFavorite(id: number) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }
  useEffect(() => {
    if (initialFavorites.writeable && !writeFavorites(favorites))
      setFavoriteWarning("收藏无法保存，本次仅暂存，刷新会丢失。");
  }, [favorites, initialFavorites.writeable]);
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
        <p>收藏保存在当前浏览器，不会上传或跨设备同步。</p>
        {favoriteWarning && <p role="alert">{favoriteWarning}</p>}
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
              favorites={favorites}
              onFavorite={toggleFavorite}
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
    <EventResults
      events={events}
      keyword={keyword}
      onKeyword={setKeyword}
      favorites={[]}
      onFavorite={() => {}}
    />
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
import { useRef, useState } from "react";
import { filterEvents, type EventItem } from "../events";
import { EventCard } from "./EventCard";
import { SearchBox } from "./SearchBox";
type Props = {
  events: EventItem[];
  keyword: string;
  onKeyword: (value: string) => void;
  favorites: number[];
  onFavorite: (id: number) => void;
};
export function EventResults({
  events,
  keyword,
  onKeyword,
  favorites,
  onFavorite,
}: Props) {
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const favoriteFilter = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const found = filterEvents(events, keyword).filter(
    (event) => !onlyFavorites || favorites.includes(event.id),
  );
  const pageSize = 2;
  const totalPages = Math.max(1, Math.ceil(found.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const visible = found.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  return (
    <section>
      <SearchBox
        value={keyword}
        onChange={(value) => {
          onKeyword(value);
          setPage(1);
        }}
      />
      <label>
        <input
          type="checkbox"
          ref={favoriteFilter}
          checked={onlyFavorites}
          onChange={(event) => {
            setOnlyFavorites(event.target.checked);
            setPage(1);
          }}
        />
        只看收藏
      </label>
      <p role="status">
        {events.length === 0
          ? "暂时没有活动"
          : found.length === 0
            ? "没有匹配活动，请修改关键词或关闭只看收藏"
            : `找到 ${found.length} 个活动`}
      </p>
      <ul className="cards">
        {visible.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            favorite={favorites.includes(event.id)}
            onFavorite={(id) => {
              // 在过滤视图取消收藏会移除当前按钮，先将焦点交给仍存在的筛选入口。
              if (onlyFavorites) favoriteFilter.current?.focus();
              onFavorite(id);
            }}
          />
        ))}
      </ul>
      {found.length > 0 && (
        <nav className="paging" aria-label="列表分页">
          <button
            type="button"
            disabled={activePage === 1}
            onClick={() => setPage(activePage - 1)}
          >
            上一页
          </button>
          <span>
            第 {activePage} / {totalPages} 页
          </span>
          <button
            type="button"
            disabled={activePage === totalPages}
            onClick={() => setPage(activePage + 1)}
          >
            下一页
          </button>
        </nav>
      )}
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

### src/design-tokens.css

```css
:root {
  --brand: #164d85;
  --text: #252525;
  --background: #f7f5ef;
  --surface: #ffffff;
  --space: 16px;
  --radius: 10px;
  --button-height: 48px;
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

### src/favorites.ts

```ts
const key = "club-frontend-favorites-v1";
export function readFavorites(): {
  ids: number[];
  warning: string;
  writeable: boolean;
} {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { ids: [], warning: "", writeable: true };
    const value: unknown = JSON.parse(raw);
    if (
      !Array.isArray(value) ||
      value.some(
        (id: unknown) =>
          typeof id !== "number" || !Number.isSafeInteger(id) || id < 1,
      )
    )
      throw new Error("收藏数据格式异常");
    return { ids: [...new Set<number>(value)], warning: "", writeable: true };
  } catch {
    return {
      ids: [],
      warning:
        "收藏记录无法读取，原记录保留；本次收藏仅暂存，刷新会丢失。请先在浏览器开发工具保存原记录后再处理。",
      writeable: false,
    };
  }
}
export function writeFavorites(ids: number[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
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
@import "./design-tokens.css";
* {
  box-sizing: border-box;
}
:root {
  color: var(--text);
  background: var(--background);
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
  gap: var(--space);
  flex-wrap: wrap;
  align-items: center;
}
a {
  color: var(--brand);
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
  min-height: var(--button-height);
  background: #fff;
  color: var(--text);
  border: 1px solid #666;
  border-radius: 6px;
}
button:disabled {
  cursor: default;
  opacity: 0.5;
}
:focus-visible {
  outline: 3px solid var(--brand);
  outline-offset: 3px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: var(--space);
  padding: 0;
  list-style: none;
}
.card {
  background: var(--surface);
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: var(--radius);
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
  background: var(--surface);
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

test("分页、收藏保存、搜索从第1页开始", async ({ page }) => {
  await page.goto("/#/events");
  await page
    .getByRole("button", { name: "收藏：图论训练", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "取消收藏：图论训练", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "下一页", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Go 入门", exact: true }),
  ).toBeVisible();
  await page.getByRole("searchbox", { name: "搜索活动" }).fill("图论");
  await expect(page.getByText("第 1 / 1 页", { exact: true })).toBeVisible();
  await page.getByLabel("只看收藏").check();
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toBeVisible();
});
test("损坏收藏原文不会静默覆盖", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("club-frontend-favorites-v1", "{broken"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("原记录保留");
  await page
    .getByRole("button", { name: "收藏：图论训练", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("club-frontend-favorites-v1"),
    ),
  ).toBe("{broken");
});

test("只看收藏取消最后一项后键盘焦点保留在筛选入口", async ({ page }) => {
  await page.goto("/#/events");
  await page
    .getByRole("button", { name: "收藏：图论训练", exact: true })
    .click();
  const filter = page.getByLabel("只看收藏");
  await filter.check();
  await page
    .getByRole("button", { name: "取消收藏：图论训练", exact: true })
    .focus();
  await page.keyboard.press("Space");
  await expect(filter).toBeFocused();
  await expect(
    page.getByRole("button", { name: "取消收藏：图论训练", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("link", { name: "图论训练", exact: true }),
  ).toBeVisible();
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
