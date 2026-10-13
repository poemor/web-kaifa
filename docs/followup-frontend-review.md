# 前端后续阶段内容与实物审核（2026-10-13）

负责web-03..06，原知识点共42项（9+12+11+10）。审核不是按字数通过，而是对照每项解释、实际文件、操作、错误边界与验收。原materials未改，网站bundle接入/主站部署由root处理，本报告不宣称已上线。

## 原知识点逐项对应

| 阶段 | 原知识点 | 正文讲解位置 | 代码/操作与证据 |
| --- | --- | --- | --- |
| web-03 | 模块化 | 模块到底解决什么问题 | events.ts export、main.ts import 与 Ctrl点击跳转/导入拼错实验 |
| web-03 | Vite | 建文件、安装依赖、看到第一个结果；环境变量、构建与部署路径 | Vite dev/build/preview 与官方vanilla-ts脚手架副本 |
| web-03 | TypeScript 基础 | 类型、接口、可选属性与联合类型如何建模 | 筛选参数42→TS2345，真实红绿已运行 |
| web-03 | 类型建模 | 类型、接口、可选属性与联合类型如何建模 | EventItem interface、location?、Scenario联合 |
| web-03 | 类型收窄 | 收窄：先确认数据是什么，再使用它 | unknown JSON、Array/typeof/in/null检查 |
| web-03 | 异步数据类型 | Promise、HTTP、JSON 和业务错误是不同边界 | Promise<EventItem[]>、未知错误、坏fixtures拒绝 |
| web-03 | 格式与静态检查 | 四类检查工具各自做什么 | 实际format/lint/typecheck/test/build独立命令 |
| web-03 | 配置和环境变量 | 环境变量、构建与部署路径 | 公开VITE_API_BASE与重启、bundle可见 |
| web-03 | 构建产物 | 环境变量、构建与部署路径 | dist/哈希/public/base、preview和子目录真实浏览器 |
| web-04 | 框架选择 | 开篇与Vue可选等价入口 | React明确主路线；Vue ref/v-model/v-for基础入口实测 |
| web-04 | 组件拆分 | 先画组件树，为什么这些内容应拆开 | App/SearchBox/EventCard/StateView责任与实际复用 |
| web-04 | Props | Props 是输入，回调把用户操作交回父层 | EventCard事件props展示 |
| web-04 | 状态与视图 | State、ref、受控输入与派生结果 | useState/useRef、受控value和派生found |
| web-04 | 事件通信 | Props 是输入，回调把用户操作交回父层 | 输入→回调→父state→列表数据流 |
| web-04 | 列表与条件渲染 | 列表 key 和条件渲染 | id key、空与loading/error、编号验证 |
| web-04 | 副作用 | Effect：什么时候请求、什么时候清理 | 请求依赖、AbortController、StrictMode生命周期 |
| web-04 | 表单 | 表单：验证与真实提交必须分开 | 受控输入、错误/旧反馈、准确未提交，组件实测 |
| web-04 | 路由 | Hash 路由与刷新为什么能工作 | 首页/列表/详情，刷新后退与不存在页 |
| web-04 | 复用逻辑 | Effect：什么时候请求、什么时候清理 | useEvents Hook统一共享页面数据与清理 |
| web-04 | UI 组件库 | UI 库与调试工具怎样有目的地用；真的比较一个组件库 | 原生按钮表单基线+Radix独立入口，Tab/Escape/焦点实测 |
| web-04 | 调试 | UI 库与调试工具怎样有目的地用 | React DevTools安装入口、受控回调破坏实验 |
| web-05 | API 交互 | 统一接口层与视图适配：数据走过哪些关口 | loadEvents、RequestError四类与真实404 |
| web-05 | 状态边界 | 五种状态与错误恢复 | idle→loading→success/empty/error与无匹配区别 |
| web-05 | 错误恢复 | 五种状态与错误恢复 | offline→online→retry E2E、取消旧请求 |
| web-05 | 输入校验 | 前端验证改善体验，后端验证保障业务边界 | 姓名/邮箱、前端不能代替服务器，组件实测 |
| web-05 | 组件测试 | 单元测试与组件测试：读懂一条断言；亲手红一次，再绿一次 | 真实搜索/字段/表单断言，破坏实现→失败→恢复已执行 |
| web-05 | 端到端测试 | 端到端测试：让浏览器自己走一遍 | 完整Playwright脚本，7条实际通过 |
| web-05 | 无障碍 | 无障碍与多尺寸回归，如何实际检查 | 原生名称/label/焦点/alt/标题/alert/status，人工限制 |
| web-05 | 响应式回归 | 无障碍与多尺寸回归，如何实际检查 | 360/768/1440自动浏览器与截图 |
| web-05 | 性能测量 | 性能：先量资源，再解释收益与局限 | 实响应192195→188字节；Lighthouse三次实测任务不编造成绩 |
| web-05 | 数据与视图分离 | 统一接口层与视图适配：数据走过哪些关口 | start_time→startTime、null地点适配 |
| web-05 | 错误日志 | 问题记录与验收证据 | Network/Console/trace/层级证据、隐私日志 |
| web-06 | 需求说明 | 需求先写成八条可验收操作 | 8条前置/动作/预期表 |
| web-06 | 信息架构 | 页面结构和增量实施顺序 | 4页关系/未知页/不存在活动恢复图 |
| web-06 | 组件规划 | 页面结构和增量实施顺序 | 实际复用组件、共享和本地state边界 |
| web-06 | 设计一致性 | 设计一致性与阅读，不靠模板堆装饰 | 真实design-tokens.css统一颜色/间距/高度/圆角 |
| web-06 | 真实数据策略 | 打开源码，先得到正确基线 | 固定JSON来源、没有真实报名/账号/云保存 |
| web-06 | 错误与空态 | 需求表及五种状态沿用 | 每页请求边界、空筛选/空数据/失败恢复实测 |
| web-06 | 单元与 E2E | 测试与三条核心流程证据 | 14单元/组件+11 E2E实测，成功与失败 |
| web-06 | 部署与回滚 | 构建、发布到自己的GitHub Pages与检查路径；两次发布与一次真实回滚 | 完整源码内示例workflow、hash/base、自己发布/revert步骤，未假称CI跑过 |
| web-06 | 作品集陈述 | README、作品陈述与3分钟演示 | 真实数据/技术选择/负责部分/两次修复模板/限制 |
| web-06 | 演示与复盘 | README、作品陈述与3分钟演示 | 分段演示脚本、错误恢复、bug与未实现功能 |

## 实际执行结果

四个独立目录重新执行npm ci，format/lint/typecheck/test/build全部退出0。环境是Windows、Node26.7.0、本机Edge；讲义建议Node24 LTS>=24.15.0符合锁定工具的官方engines范围，但未在另一台机器的24LTS实际重跑，不把兼容范围当异机验收。

| 项目 | 单元/组件 | 实际浏览器 | 构建 |
| --- | --- | --- | --- |
| followup-03 | 8通过 | 真实8803 dev及嵌套子目录dist检查 | 通过 |
| followup-04 | 14通过 | 8 E2E（含Vue与Radix Tab/Escape/焦点） | main/vue/library三入口通过 |
| followup-05 | 14通过 | 8 E2E，断网/旧请求/3尺寸/资源实验 | main/vue通过 |
| followup-06 | 14通过 | 11 E2E，新增分页/收藏刷新/损坏记录保留 | main/vue通过 |

另用独立静态服务器8899，把四份dist放在多层URL下，真实浏览器检查搜索、接口正常/404/坏字段、React详情刷新和三份Vue入口，无pageerror。03实际dev请求missing.json为404、normal.json为200、4行；自己的8803dev已停止。资源返回body实测192195bytes→188bytes，原版人为增加注释，是明确教学实验，未提供虚构Lighthouse分数或整体提速比例。

实际行为红绿：故意把filter条件改true，npm test退出1；恢复后退出0。实际类型红绿：将keyword参数改42，typecheck退出2；恢复退出0。最终源文件已恢复，四份正文全部手写文件围栏逐个与源码精确核对，lock文件下载版携带，手建版明确npm install生成。

## 审核发现与修复

- Vite默认SPA fallback把missing.json变为200 HTML。四个项目统一appType:'mpa'（路由本身hash，不需服务器路径回退），开发/构建接口检查真实404；03单行config第一次替换漏掉，经root复查后已补并单独实际dev断言。
- Vanilla在加载/失败时输入会把请求状态覆盖为空提示。增加loaded状态，未成功加载时搜索不抹掉错误。
- API坏JSON原来给英文SyntaxError，改为可理解的中文下一步提示，仍保留错误分类并验证字段。
- ESLint对资源脚本.mjs缺少Node globals，补匹配mjs，lint重跑通过。
- SVG测试原先误把dev的BASE_URL限定成'./'；改断言资源名兼容dev和production，实际图形与byte检查保留。
- 初版UI库只说明没有实际入口；增加Radix独立入口、完整源码、依赖锁、API部件解释和键盘E2E，不让学习者因build input缺HTML卡住。
- 根报告指出README/完整代码快照与新增文件同步风险，最终从落盘源码重生正文，手写文件全部比对通过。

- common交叉审核发现只看收藏取消最后一项后焦点掉BODY；已在移除项前focus筛选checkbox，新增Space取消/继续关闭过滤回归，06重跑lint/build与10条E2E全部通过。正文解释DOM删除后的焦点责任，并同步完整源码。

- common进一步实测04–06键盘重试按钮移除时焦点掉BODY；先将焦点交给稳定h1，再开始重试。新增500→Enter重试→数据恢复/h1Focused检查，修前真正红、修后三组分别8/8/11 E2E全部绿，build/typecheck再次通过，正文与源同步。

## 官方资料与版本依据

Node建议[官方LTS下载](https://nodejs.org/en/download)，npm ci/lock规则依据[npm](https://docs.npmjs.com/cli/v11/commands/npm-ci/)。Vite8.3.4、TS6.0.3、React19.3.0、Vue3.5.43、Vitest5.0.4、Playwright1.64.0、Radix1.3.1在npm官方registry核对并锁定。TS7不在本课typescript-eslint8.71.2的peer范围，选择TS6并以实际安装/检查验证，不建议盲追最新。

模块/类型参考[TypeScript收窄](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)，环境公开性与静态发布参考[Vite env](https://vite.dev/guide/env-and-mode)、[Vite部署](https://vite.dev/guide/static-deploy)，组件/生命周期参考[React props](https://react.dev/learn/passing-props-to-a-component)、[Effect](https://react.dev/learn/synchronizing-with-effects)、[Vue表单](https://cn.vuejs.org/guide/essentials/forms)，测试参考[Vitest](https://vitest.dev/guide/)、[Playwright](https://playwright.dev/docs/intro)，组件库参考[Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)。正文引用放在对应解释附近。

## 不扩大证明范围

未运行独立作品GitHub Actions/Pages发布、实际系统安装器、外部API服务、真实服务器报名或数据库；没有改用户学习进度。Vue仅等价基础搜索入口，未用vue-tsc执行完整SFC类型检查。屏幕阅读器与Lighthouse是给学习者的独立实测任务，不假称已完成。CI示例保存在06项目的嵌套.github内，不影响学习网站根目录CI；要在自己的独立仓库根目录才运行。

源码下载应排除node_modules、dist、test-results、playwright-report、.env.local，以及由scripts/make-performance-assets.mjs重建的banner-original.svg/banner-optimized.svg；保留源码、lock、README和完整脚本。站点教程已扩展，不等于用户完成课程。
