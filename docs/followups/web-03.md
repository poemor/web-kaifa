# 用 TypeScript 整理代码：从安装 Node 到构建活动搜索页

本阶段把已经会运行的 JavaScript 搜索页搬进一个有模块、有类型检查、有构建命令的项目。完成后，你应能指出“数据在哪里进来、在哪一行被验证、哪个函数筛选、哪个函数显示”，并亲手让类型检查失败一次再修好。不是先背完 TypeScript 才能写程序。

## 先确认起点与本阶段成果

需要会 HTML 文件、CSS 选择器、JavaScript 数组/函数/事件和 fetch。若 `events.filter(...)`、`async/await` 还陌生，先回到 JavaScript、DOM、请求三个知识专题做完可运行例子。本阶段不要求 React，不要求数据库。最终页面能搜索四条本地活动，选择空数据、错误字段、错误 JSON、HTTP 404、业务失败，显示准确反馈，能重新加载。所有数据都为固定教学数据。

代码在仓库 `exercises/web/followup-03`。既可下载本阶段源码，也可按后面的完整文件逐个建立。不要只把 `main.ts` 复制到普通 HTML 后双击；浏览器不直接执行 TypeScript，必须通过本课的 Vite 开发服务器或构建后的网页。

## 安装 Node.js，并在 VS Code 验证

Node.js 是在浏览器外执行 JavaScript 的运行环境。本课用它启动 Vite、执行类型检查和测试；最终用户的浏览器仍执行构建后的 JavaScript。npm 是随官方安装包提供的包管理器，负责下载本项目声明的依赖及运行命令。本课选择 **Node 24 LTS、至少 24.15.0**，避免为学习追逐 Current 版本；这是本课 jsdom 等工具的版本要求，不是所有 JavaScript 都需要该版本。[Node 官方下载](https://nodejs.org/en/download)、[Vite 环境要求](https://vite.dev/guide/)。

Windows：打开官方页面，选择 24 LTS、Windows 与你的架构（一般为 x64，ARM 电脑选择 ARM64），下载 Installer `.msi`。双击按安装器步骤安装，保留 npm 和 PATH 功能，完成后关闭并重新打开 VS Code。macOS：选 macOS 的 `.pkg`，按安装器完成，重新打开终端。不要复制某个陌生网站的一行远程脚本来解决安装问题。

Linux 可用官方预编译包：先用 `uname -m` 确认架构；x86_64 对应 x64、aarch64 对应 ARM64。下载匹配架构的 LTS `.tar.xz`。以下是 **x64、下载文件名为 node-v24.21.0-linux-x64.tar.xz** 的示范，实际下载版本不同要改两处目录名。文件位于 Downloads 时：

```sh
cd "$HOME/Downloads"
tar -xf node-v24.21.0-linux-x64.tar.xz
export PATH="$HOME/Downloads/node-v24.21.0-linux-x64/bin:$PATH"
node --version
npm --version
```

该 `export` 只对当前终端有效；希望新终端仍有效，可把同一行加入自己的 `~/.bashrc`（使用 Bash）或 `~/.zshrc`（使用 Zsh），保存后重开终端。保持该目录不被清理。若使用发行版软件包，也必须核对版本符合本课要求，不要只因 apt 安装成功就忽略版本。已安装合适 Node 的人不用重复安装。

VS Code 选择“终端 → 新建终端”，逐行输入：

```powershell
node --version
npm.cmd --version
```

Windows 示例预期如下；小版本可以不同，第一行必须符合上述最低版本：

```output
v24.21.0
11.x.x
```

macOS/Linux 使用 `npm --version`。后文 Windows 命令写 `npm.cmd`，是为了避免 PowerShell 执行策略阻挡 `npm.ps1`；不必因此全局关闭脚本安全策略。若显示“不是内部或外部命令”，先重开 VS Code，再 Windows `where.exe node` 或 macOS/Linux `which node` 检查实际路径；装了两套 Node 时先确认正在用哪一套。

## 建文件、安装依赖、看到第一个结果

下载源码后解压，VS Code “文件 → 打开文件夹”直接选择 `followup-03`，左侧应看到 `package.json` 与 `src`，不是外面的压缩包目录。在终端执行 `pwd`（PowerShell）或 `pwd`（Shell）确认末尾是 `followup-03`。按完整源码手建的人：新建同名文件夹，右键新建 `src`、`public/fixtures`，再按下面文件名建立文件，保存时确认没有 `.txt` 后缀。

带本课 `package-lock.json` 的下载版按锁安装：

```powershell
npm.cmd ci
npm.cmd run dev
```

macOS/Linux 把 `npm.cmd` 改为 `npm`。第一次安装需联网；成功会创建 `node_modules`。`dev` 命令持续运行，终端未回到输入提示符是正常现象。浏览器打开 `http://127.0.0.1:8803/`，应看到标题“活动搜索：TypeScript 版”和四条活动。输入“ 图论 ”只剩“图论训练”；输入“不存在”出现“没有匹配活动，请修改关键词”。停止服务器在终端按 Ctrl+C。

如果是照正文手建，尚无 lock，先执行一次 `npm.cmd install` 生成 `package-lock.json`；之后与别人协作、重新安装用 `npm.cmd ci`。`package.json` 写直接依赖与脚本，lock 记录完整依赖树、精确版本与完整性，`node_modules` 是当前机器安装结果。lock 要保留到源码，依赖目录不用提交。`npm ci` 发现 lock 与 package 不匹配会报错，不能靠删 lock 掩盖未知变更。[npm ci 规则](https://docs.npmjs.com/cli/v11/commands/npm-ci/)。


如果想认识官方脚手架，而不是下载本课配套代码，可在另一个空目录执行 `npm.cmd create vite@9.2.1 club-ts-sandbox -- --template vanilla-ts`，进入 `club-ts-sandbox` 后 `npm.cmd install`、`npm.cmd run dev`。这会生成独立模板，不包含本课活动功能；不要在followup-03上覆盖执行。`--` 后面的template参数传给create-vite。模板版本可能随时间变化，本课可跟做版本以完整源码和lock为准。

## 模块到底解决什么问题

传统普通 `<script>` 的顶层名字可能共享全局空间；两个文件都写 `filterEvents` 容易覆盖。ES module 的每个文件有自己的作用域，`export` 明确允许别人使用什么，`import` 明确谁依赖谁。本项目 `events.ts → api.ts → main.ts` 中，箭头表示数据和能力的提供方向：`events.ts` 导出数据校验与筛选，`api.ts` 导入校验函数以加载外部数据，`main.ts` 导入两者显示页面。没有把所有函数挂到 `window`。

在 `index.html` 中，`<script type="module" src="/src/main.ts">` 指定入口。Vite 从这个入口跟随 import 找到其他模块。类型导入 `import type { EventItem }` 只供检查，运行时会被移除；函数导入 `import { filterEvents }` 必须在运行时存在。相对路径 `./events` 指同一 src 目录，不是安装一个名为 events 的 npm 包。

跟做：在 VS Code 的 `main.ts` 按 Ctrl/Cmd 点击 `filterEvents`，应跳到 `events.ts` 的声明；故意将导入名拼成 `filterEvent`，运行 typecheck 查看“没有导出的成员”，再修回。不需要将两个文件粘成一份。

## 类型、接口、可选属性与联合类型如何建模

`EventItem` 是给前端使用的数据形状：`id: number`、`title: string`、`startTime: string`、`location?: string`。`?` 表示该属性可能不存在，读取结果包含 `undefined`，不等于一定有空字符串。`EventItem[]` 表示数组，数组每一项应符合这个形状；`(events: EventItem[], keyword: string): EventItem[]` 同时约束函数的输入和返回。

`interface` 适合对象协议，`type` 可给联合类型或其它类型起名；不是所有类型都必须写成 interface。例如 `Scenario` 是六个允许字符串的联合，写错 `'normla'` 会被编辑器拦下。异步状态也可用带标签的联合，只有 `status === 'success'` 时允许读取 `events`，后续 React 课会使用这个方法。

小实验：在 `main.ts` 的 `render` 内临时把 `filterEvents(events, input.value)` 的第二参数改成 `42`，保存并运行：

```powershell
npm.cmd run typecheck
```

应得到包含 `Argument of type 'number' is not assignable to parameter of type 'string'` 的错误并以非零状态退出。这才说明检查真的执行了。修回 `input.value` 后应无错误退出。开发服务器可能仍能显示页面，因为 Vite 的 TS 转换与 tsc 的类型检查职责不同；本项目把 typecheck 放进 build，避免带类型错误发布。

## 收窄：先确认数据是什么，再使用它

`normalizeKeyword(value: string | undefined)` 先用 `typeof value === 'string'` 确认类型，只有为字符串才调用 `trim()`。否则返回空字符串，这就是收窄；不是给变量强加一个 `as string`。`parseEvents(value: unknown)` 的 `unknown` 表示“还没检查，不允许随便使用”。先验证 Array，再验证每项非 null 对象，再用 `in` 检查字段，最后检查字段类型和值。

为什么必须写 `row !== null`？JavaScript 中 `typeof null` 也是 `'object'`；为什么检查重复 id？后面的 React key 与详情路由需要唯一活动编号；为什么检查非空标题？`typeof '' === 'string'` 为真，但空标题不符合产品规则。这些是运行时的判断，TypeScript 只能跟随已写出的判断理解结果。[TypeScript 收窄](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)。

本课外部 JSON 使用 `start_time`，校验后返回前端的 `startTime`，缺失或 null 地点统一显示“待定”。组件不用每次猜服务端字段名。当前时间只是教学展示字符串，尚未实现日期有效性、时区计算；如果以后要按日期排序，必须增加真实日期协议和验证。

## Promise、HTTP、JSON 和业务错误是不同边界

`async loadEvents(...): Promise<EventItem[]>` 表示调用马上得到 Promise，await 完成后得到 EventItem 数组；请求仍可能失败。类型注解不会拦截服务器返回的 `[{id:1}]`。`response.json()` 的结果先放入 `unknown`，经过 `parseEvents` 才进入可信前端领域。

`fetch` 遇到 404 通常仍返回 Response，不会自动进入 catch，因此必须检查 `response.ok`。网络断开才会导致 fetch 拒绝。合法 JSON 也可能表示业务失败 `{ok:false}`，这是另一类错误。`RequestError.kind` 保留 network/http/data/business 分类，页面给用户说明，测试准确断言是哪类。`catch(error: unknown)` 用 `error instanceof Error` 收窄后读 message，避免假设所有抛出的值都是 Error。

试六个场景：正常显示4项；空数据提示“暂时没有活动”；字段错误提示“第 1 条活动缺少字段”；HTTP 错误访问不存在的 JSON，Network 为404；JSON错误提供故意损坏文本，显示解析错误；业务错误显示“演示服务暂停”。选回正常应恢复。输入关键词不会把错误提示冒充空结果。

连续切换时上一个请求可能晚到。每次 reload 取消旧 `AbortController`，新请求持有自己的 current；完成/失败都检查未取消才更新界面，防止旧结果覆盖新选项。取消与真实网络失败要区分，取消后的旧请求不应显示红色失败。

## 四类检查工具各自做什么

```powershell
npm.cmd run format
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

format 用 Prettier 调整缩进/换行；lint 用 ESLint 检查可疑写法与未使用变量；typecheck 用 tsc 检查类型；test 用 Vitest 检查行为。格式整齐不能证明函数算对，类型通过也不能证明 HTTP 正常。本课 8 条单元测试检查搜索大小写/空格/不存在词、缺失字段、重复编号和地点默认值。预期测试输出包含 `Tests 8 passed`，构建输出有 `dist/index.html` 与带哈希的 JS/CSS。

依赖固定到已验证组合：TypeScript 6.0.3、Vite 8.3.4、Vitest 5.0.4。此时 typescript-eslint 8.71.2 的 peer 范围不含 TS7，所以没有自动追最新 TS7。升级前读兼容范围、更新 lock、重跑上述命令，不用 `any`、`@ts-ignore` 让错误消失。[typescript-eslint 版本要求](https://typescript-eslint.io/users/dependency-versions/)。

## 环境变量、构建与部署路径

把 `.env.example` 复制为 `.env.local`，内容 `VITE_API_BASE=fixtures/`，是公开的接口路径，不是密码。修改 env 后重启 dev。Vite 把 VITE_ 变量替换进客户端代码，所有访问者可以下载查看；`.gitignore` 隐藏源文件也不能隐藏已经进入 bundle 的机密。本课相对目录必须以 `/` 结尾，使 `base + filename` 正确形成路径。[Vite 环境变量](https://vite.dev/guide/env-and-mode)。

构建：Ctrl+C 停止 dev，执行 `npm.cmd run build`；再 `npm.cmd run preview`，打开 `http://127.0.0.1:8903/`。搜索和六种数据场景应一样可用。preview 是检查 dist 的本地静态服务器，不是生产后端，不替你发布到 GitHub。不要双击 dist/index.html 检查网络请求；使用 preview。

源码 `src/main.ts` 不在最终 HTML 中直接执行：构建移除类型、合并依赖、压缩内容、输出带内容哈希的资源地址。public 目录的 fixtures 则复制到 dist。删除 dist 后重新 build 可以恢复，不要把 dist 当唯一源代码。使用 DevTools Network 点击 JS 的 Response 并搜索“fixtures/”，可以看到公开配置确实可被读到。

本项目 `base: './'` 使资源相对当前 HTML，适合项目托管子目录。若改为固定 GitHub Pages 仓库地址，如 `/club-demo/`，base 要与真实仓库名一致。资源路径问题与路由刷新问题不同：`/club-demo/events/1` 可能让静态服务器寻找并不存在的文件；下一阶段用 `#/events/1`，服务器只接收 `/club-demo/`，由浏览器读 hash 选视图。[Vite 静态部署](https://vite.dev/guide/static-deploy)。

本例也设置 `appType: 'mpa'`，因为页面只有这个HTML入口，不需要将不存在JSON回退为首页。真实开发服务的missing.json应为404，正常JSON为200；这项配置与后面的hash路由相容。

## 排错要看哪一层

| 现象 | 首先确认 | 修复与复验 |
| --- | --- | --- |
| ENOENT 找不到 package.json | pwd 是否在 followup-03 | 进入项目目录再 ci |
| EBADENGINE | node --version | 使用满足要求的LTS并重开VSCode |
| 端口已占用 | 8803 是否另有服务 | 停止自己旧终端的服务，或修改端口并使用新地址 |
| imports 红线 | 文件是否保存，大小写是否一致 | 核对 events.ts 的 export 与导入名 |
| 网页空白 | Console 的第一条错误，Network 的 src 请求 | 缺#app查HTML；404查base与URL，不重装全部依赖 |
| fixtures 返回 HTML | Network Response 是不是<!doctype | URL错误命中了页面回退，校对fixtures文件名 |
| ci lock 不匹配 | package修改是否有意 | 明确依赖变更后install更新lock，再ci复验 |

卡住时问 AI：“我在 Windows/Node版本__、followup-03 中执行命令__；目标是__；预期__，实际__；完整首条报错__；相关 api.ts 与 Network URL__。请先解释错误所在层，再给最小修改与验证步骤。”不要发口令、令牌或真实报名资料。

## 独立变式：按地点同时筛选

不看答案先做：给 `filterEvents` 增加第三个可选参数 location，空字符串/undefined 不限制；关键词与地点同时满足才返回。用“图论”和“教室 A”应返回编号1；“图论”和“线上”应为空。再添加两条测试。不得修改原数组，不得使用 any。

### 参考答案与为什么

把参数写成 `location?: string`，先 `const place = normalizeKeyword(location)`，筛选条件为 `titleMatches && (!place || normalizeKeyword(event.location).includes(place))`。`&&` 表达两个筛选同时成立，`!place` 允许不限制地点。用前端标准化后的地点，不要让每个显示函数重新读取 start_time 或处理 null。新增参数后跑 format/lint/typecheck/test/build，并亲手在页面接一个地点输入验证。

## 完整文件：可以逐个建立，也可以下载源码

下面是这个独立项目的全部手写源文件与配置，文件名相对于项目目录。VS Code 左侧右键“新建文件/文件夹”，按相同目录名建立；每份代码完整复制、保存，再运行前面命令。package-lock.json 是 npm 生成的依赖锁，下载版已携带；手建版先 npm install 生成它，不把几千行锁文件当需要手敲的知识点。README 随下载版提供运行、验证、限制。node_modules、dist、test-results、playwright-report 不属于需复制的源码。

`public/fixtures/broken.json` 故意不是合法JSON，用于解析失败场景，请保持原样。没有 missing.json 才能复现真实404。`.env.example` 可复制为 `.env.local`，该设置仅是公开地址。所有例子可在自己的目录修改，不会自动更新学习网站的课程完成状态。

### package.json

```json
{
  "name": "followup-03",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24.15.0"
  },
  "scripts": {
    "dev": "vite --host 127.0.0.1 --port 8803 --strictPort",
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview --host 127.0.0.1 --port 8903 --strictPort",
    "format": "prettier --write src index.html vite.config.ts tsconfig.json package.json eslint.config.js",
    "lint": "eslint .",
    "test": "vitest run"
  },
  "dependencies": {},
  "devDependencies": {
    "vite": "8.3.4",
    "typescript": "6.0.3",
    "vitest": "5.0.4",
    "eslint": "10.12.0",
    "@eslint/js": "10.0.1",
    "typescript-eslint": "8.71.2",
    "prettier": "3.9.10",
    "globals": "17.13.0",
    "@types/node": "24.19.2"
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
import { defineConfig } from 'vite';
export default defineConfig({ base: './', appType: 'mpa' });
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
    <script type="module" src="/src/main.ts"></script>
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

### src/main.ts

```ts
import "./style.css";
import { filterEvents, type EventItem } from "./events";
import { loadEvents, type Scenario } from "./api";
const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("缺少 #app 容器");
root.innerHTML = `<main><h1>活动搜索：TypeScript 版</h1><p>本地演示数据，不提供报名服务。</p><div class="filters"><label>搜索活动<input id="keyword" type="search"></label><label>数据场景<select id="scenario"><option value="normal">正常</option><option value="empty">空数据</option><option value="invalid">字段错误</option><option value="http">HTTP错误</option><option value="broken">JSON错误</option><option value="business">业务错误</option></select></label><button id="reload" type="button">重新加载</button></div><p id="status" role="status"></p><ul id="list" class="cards"></ul></main>`;
function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`缺少元素 ${selector}`);
  return element;
}
const input = required<HTMLInputElement>("#keyword");
const select = required<HTMLSelectElement>("#scenario");
const list = required<HTMLUListElement>("#list");
const status = required<HTMLParagraphElement>("#status");
let events: EventItem[] = [];
let loaded = false;
let controller: AbortController | undefined;
function render() {
  if (!loaded) return;
  const found = filterEvents(events, input.value);
  list.replaceChildren();
  for (const event of found) {
    const card = document.createElement("li");
    card.className = "card";
    const title = document.createElement("h2");
    title.textContent = event.title;
    const detail = document.createElement("p");
    detail.textContent = `${event.startTime} · ${event.location}`;
    card.append(title, detail);
    list.append(card);
  }
  status.textContent =
    events.length === 0
      ? "暂时没有活动"
      : found.length === 0
        ? "没有匹配活动，请修改关键词"
        : `找到 ${found.length} 个活动`;
}
async function reload() {
  controller?.abort();
  const current = new AbortController();
  controller = current;
  events = [];
  loaded = false;
  list.replaceChildren();
  status.textContent = "正在加载…";
  try {
    events = await loadEvents(select.value as Scenario, current.signal);
    if (!current.signal.aborted) {
      loaded = true;
      render();
    }
  } catch (error: unknown) {
    if (!current.signal.aborted)
      status.textContent =
        error instanceof Error ? error.message : "未知错误，请重试";
  }
}
input.addEventListener("input", render);
select.addEventListener("change", reload);
required<HTMLButtonElement>("#reload").addEventListener("click", reload);
void reload();
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

## 学完如何证明自己能继续

关闭参考答案，独立修改变式；在notes/web保存修改理由、运行命令、具体输出与仍不懂的地方。例子跑通只是验证环境和参考代码，并不会自动把你标成已掌握。只有自己完成任务且留下验收证据后再更新学习记录。

官方资料于2026-10-13核对，安装页面/主版本会变化，源码依赖已用lock固定；升级以兼容范围与真实检查为准。
