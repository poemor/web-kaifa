# 知识讲解内容审核：2026-10-13

当前状态：24 个主题的详细讲义已实施，独立内容复核完成，24 个独立主例实际运行通过；42 节课的主题展示及相关浏览器检查通过。下面保留初审发现，再记录逐项复核和最终运行证据。真实数据库、完整认证、Docker 与远程 CI 的环境验收仍按各节注明的条件执行。

## 初审范围与结论

本轮从零基础学习者视角检查了 `README.md`、`docs/study-plan.md`、`AGENTS.md`，以及 `assets/data/learning-lab.js` 的 24 个主题、`assets/data/curriculum.js` 的 42 课、`assets/data/adaptations.js` 的 Go 第 2 课适配和 `assets/learning.js` 的概念展示。下文记录的是扩写前的内容现状；后续修订须逐项复核，不能把初审建议当成已实现。

结论：原教材保留了较长的课时讲义，但工作台补充区只有三条一句话解释；知识详情也主要是一段片段、一条误区和一问一答。它们适合提醒已经学过的人，尚不能独立承担“零基础读懂、亲手运行、预测并解释结果”的教学任务。42 课都有主题关联只证明路由映射存在，**不证明每课列出的概念都已讲透**。

本次审核不改变教材、完成状态或用户成果。未实际安装全部平台的软件，未连接真实 PostgreSQL、认证或公网服务，不把静态阅读视为这些项目的验收证据。

## 可操作的问题清单

优先级含义：P1 为会阻断目标学习流程的内容或展示缺口；P2 为局部错误、歧义或需要补足的讲解。位置按初审时文件标记，修订后行号可能改变。

| 编号 | 级别与位置 | 问题及对学习者的影响 | 改正与复核要求 |
| --- | --- | --- | --- |
| K01 | P1，`assets/learning.js:39–45` | `conceptMarkup` 只输出摘要与三个 points；`lessonMarkup` 又用 `relevant.slice(0, 2)` 截断主题。Web 07 / 14 各关联四个主题，后两个在课内不出现；“把关键概念讲清楚”的标题与实际内容不匹配。 | 全部关联主题可到达；正文提供定义、理由、操作、完整例子、逐步结果、边界与变式。使用目录/章节管理篇幅，不靠截断隐藏知识。 |
| K02 | P1，`assets/data/learning-lab.js:150`、`curriculum.js` 的 `go-02` | “变量与类型、if/switch、函数”列为本课概念，但补充区只讲零值/循环/多返回，没解释声明与赋值区别、`:=`、类型、比较/逻辑、分支、作用域与转换。截图中的零基础用户无法据此实现任务。 | 先讲一个变量如何产生与改变，逐步演示条件和累加过程；用整数除法对比浮点除法，最后组合函数。每个术语第一次出现就解释。 |
| K03 | P1，`assets/data/adaptations.js:10`、`app.js:113–115` | `audience=new` 的 Day 02 要求 `Stats(scores)`，使用 `[]int`、`len`、`range`；正式 slice 主题在 Day 03。有效课时仍继承原 `sourceMarkdown`，其中开场假定熟悉 C++ 题与循环，和新手任务不一致。 | 新手正文必须以新手任务为准；在本课解释最小列表语法/长度/遍历，或把列表任务清楚标为学完下一课的加练。已有基础者可选自己的任意语言小题作对照，不把 C++ 作为先修。分别检查两种 audience 的任务、说明、提示、验收与讲义。 |
| K04 | P2，`assets/data/learning-lab.js:150` 的 `SumTo` | 示例 `SumTo(-1)` 直接返回 0，而新手任务约定负数报告无效；例子本身不返回 error。当前预期文字虽提醒另行处理，仍容易被当成完整答案。 | 明确此片段只演示累加，或改为有负数分支的完整程序；用正常、0、负数演示实际返回。新手主例不要依赖未讲的错误体系。 |
| K05 | P2，`assets/data/learning-lab.js:20` | `web-files.expected` 声称初次页面“会请求三个相对地址”，但 `<a href="./about.html">` 创建的是导航链接，通常激活后才导航到目标。把链接与 CSS/图片加载混为一谈。 | 分别说明初次资源加载和点击导航，并让学习者在 Network 中观察。MDN 定义 `<a>` 为可被激活的超链接。[依据](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a) |
| K06 | P1，`assets/data/learning-lab.js:180`、`:395` | `go-errors` 与 `go-json` 关联 Day 05，却从 `r.Body` 和已有 Handler 起步，HTTP 到 Day 07 才学。片段的错误分支只是注释，没有真实响应和 `return`，直接粘贴会继续处理错误输入。 | Day 05 主例改为本机字符串/文件解析；HTTP 边界移为 Day 10 后应用，并补完整错误退出路径。未知字段与单值检查的条件须逐项解释。[JSON API](https://pkg.go.dev/encoding/json) |
| K07 | P2，24 个主题的 `example/expected`，尤其 `go-tests` | CSS、DOM、Go 函数/Handler、SQL 片段没有统一的文件、目录、依赖、运行命令与具体输出；`go-tests` 只给 TestSumTo，没有定义 SumTo 或 package。部分片段已标注限制，仍缺零基础可运行的起点。 | 明确“完整可运行程序”与“放入已有程序的片段”；每主题至少提供一个完整例子或配套文件，写明 VS Code 打开目录、保存、运行、看到什么与如何停止。上下文依赖必须可追溯。 |
| K08 | P2，`assets/data/learning-lab.js:160`、原 Day 03/15 | slice/map 的现有语义提醒基本正确，但缺索引/长度/容量/`make`/`append` 的机制和执行过程。原 Day 03 把 rune 数简称“中文字符个数”，可能扩展为用户看到字符数；Day 15 的长度业务约定亦需明确码点。 | 用共享与独立复制的对照、nil map 写入反例、排序并列与空输入补讲；区分字节、码点和视觉字符，给组合字符或 emoji 的边界，不把 rune 当作通用视觉字符计数。[Go 字符串说明](https://go.dev/blog/strings) |
| K09 | P1，`assets/data/learning-lab.js:210` | “SQL、参数绑定与事务”覆盖 Go 12–14 / 17，但三个 points 不能教会数据库准备、SQL 四种操作、NULL、驱动、连接池、资源关闭、错误映射和真正回滚。例子仅有 `QueryRowContext`，没有事务。 | 分章节补 SQL/连接/查询生命周期/事务；完整展示 BeginTx、defer Rollback、全部通过 tx 调用、Commit 错误检查，分别验证成功和第二步失败。值用参数，动态标识符白名单；声明 PostgreSQL 与真实测试库条件。[事务](https://go.dev/doc/database/execute-transactions)、[参数绑定](https://go.dev/doc/database/sql-injection) |
| K10 | P1，`assets/data/learning-lab.js:230` | 单条 owner 条件查询不能承担 Go 22–25 的账号、密码、会话、权限、CSRF/CORS 全过程。现有安全方向基本正确，但没有解释身份取得、令牌失效、Cookie 场景和写操作的原子归属条件。 | 用注册→哈希→登录→随机会话→请求认证→对象授权→撤销的流程解释；查询/创建/PATCH/DELETE 都演示可信 owner 来源。两用户测试验证拒绝且数据不变。CORS 和 CSRF 单独讲，不能互当替代。[授权](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)、[会话](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)、[CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) |
| K11 | P2，`assets/data/learning-lab.js:240` | 并发例子仅展示 select；对 channel 关闭只留注释，不解释 `(value, ok)`、零值、关闭 channel 始终可读及退出。goroutine、锁范围、取消、Shutdown 只靠一句话无法完成 Day 26。 | 用同步完成、竞争反例、加锁、channel 关闭与取消的对照逐层说明；明确取消信号必须被观察，不保证强制结束。关服例子说明 deadline 超限时处理与运行条件。 |
| K12 | P1，`assets/data/learning-lab.js:250` | Go 27/28 关联“交付”，但没有解释 image/container、Dockerfile 多阶段、volume、健康检查、迁移、CI YAML 与发布标记，只有 Go 检查命令。 | 将容器与 CI 分章节，给实际入口与最低版本条件；说明服务名、持久化、失败启动和 CI 测试范围，不能把容器启动或纯单元测试全绿当成后端整体可用。[Compose 网络](https://docs.docker.com/compose/how-tos/networking/) |

## 24 个主题审核矩阵

“现有正确提醒”表示阅读时未发现该提醒本身错误，不表示主题完整或例子已运行。所有主题都需要扩写成可跟做的讲解。

| 主题 | 现有正确提醒或局部问题 | 必须补上的教学内容与边界 |
| --- | --- | --- |
| web-files | 相对路径与大小写方向正确；初次“三个请求”错误见 K05。 | 文件/目录/扩展名、完整 HTML 壳、地址解析、导航与资源请求、保存刷新、Network 的具体操作；CSS 内 url 相对 CSS 文件。 |
| web-html | 标题层级、链接/按钮、alt 提醒合理。 | 标签/属性/嵌套、doctype/head/body/charset/title、完整文档、语义区域为什么存在、锚点 id、信息图与装饰图对照。 |
| web-css | 同条件后写规则胜出例子合理。 | 三种引入、元素/类/伪类、继承与层叠差别、DevTools 匹配规则、颜色/字体/行高、CSS 变量、focus-visible 与图片 object-fit。层叠不能简化成单看优先级。[层叠](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction) |
| web-box | 240/196/284 的算式正确，margin 不含在 border-box 内。 | 默认块/行内行为、四层空间、完整测量页、外宽与总占用区别、垂直 margin 合并及适用边界。 |
| web-flex | 主轴与交叉轴提醒正确。 | 容器与直接子项、剩余空间、grow/shrink/basis、wrap 与 gap、row/column 对照、长文本 min-width 的原因。 |
| web-grid | 自适应最小列宽与溢出方向合理。 | 行/列/轨道、fr 的剩余空间、repeat/minmax/auto-fit 逐步读法、二维与一维选择、完整 HTML/CSS 例子。 |
| web-responsive | 不应隐藏溢出来掩盖根因的方向合理。 | viewport、px/rem/%、max-width、媒体查询语法、内容断点、设备模拟具体操作、真实设备与缩放边界。 |
| web-forms | label、校验与真实反馈提醒正确。 | 控件/name/form/button 默认行为、submit 流程、required/email/disabled 差别、可见错误关联、Tab/Enter/Space 实验、浏览器校验能被绕过。 |
| web-js | filter/map、浅层共享和 const 提醒合理。 | 变量/类型/分支/循环/函数、数组与对象、Number 空值陷阱、return、浏览器执行位置和 Console 输出、先手算再转换。 |
| web-dom | textContent 与重复绑定提醒合理。 | DOM 树、defer/执行时机、null 排错、input/click/submit、状态→渲染、完整配套 HTML；事件监听不是自动执行。 |
| web-fetch | response.ok、JSON 形状、file 限制提醒正确。 | async/await/Promise、try/catch/finally、请求/响应/状态、四状态转换、AbortController/旧结果规则、JSON 文件与本地 HTTP 步骤。 |
| web-quality | diff、调试证据、静态托管边界合理。 | 浏览器面板操作、复现→假设→单次修改、Git 身份/初始化/忽略/提交、部署前提、README 运行验证与已知限制。 |
| go-tools | 独立 module、package、工具命令提醒合理。 | package main/func main/import、文件与目录、`.`、run 编译并执行/build 产物、命令与输出、跨包导入路径、格式/test/vet 差别。 |
| go-control | 零值、作用域、多返回方向合理；任务/示例负数契约不一致见 K04。 | 声明/赋值/类型、if/switch/比较、for 执行顺序、作用域、函数参数与返回、整数/浮点转换、列表先修、逐步输出。 |
| go-collections | 共享、map 缺失零值、rune 不等于视觉字符提醒正确。 | 数组/slice/len/cap/索引边界、make/nil/append、浅复制、range 值与索引、map 初始化与排序、Unicode 对照。 |
| go-models | 值/指针字段修改、JSON 导出、小接口方向正确。 | 自定义类型/struct 字段、字面量、&/*、方法集、指针与值副本、接口隐式满足、JSON tag、请求 DTO 与模型。 |
| go-errors | 严格解码和 defer 提醒合理；HTTP 前置见 K06。 | error/nil/return/%w/Is/As、defer 调用时机、完整本机 JSON、缺字段/类型/空白/未知字段/多值/超限的分流。 |
| go-tests | fake 不证明 SQL、覆盖率非充分条件正确。 | 测试文件布局、testing.T、SumTo 定义与反例、表驱动/t.Run、got/want、HTTP recorder、数据库条件及测试数据隔离。 |
| go-http | 响应 Header 顺序、200[]/404 分别正确。 | 客户端/服务器/URL、路由和方法、r/w、字符串参数校验、PathValue、DTO、CRUD 状态/错误形状、启动停止与真实 curl。 |
| go-sql | 参数占位符、sql.Open/Ping 与 tx 内调用方向正确。 | K09 全部，尤其 NULL/约束/WHERE/RowsAffected/RETURNING/rows 生命周期、回滚反例与真实数据库条件。 |
| go-design | 小接口、机密日志、唯一字段稳定排序提醒合理。 | Handler/Service/Repository 数据流、构造注入、配置校验与日志字段、分页计算/默认/上限/排序；offset 并发偏移与游标取舍。 |
| go-auth | 不信任 owner_id、对象归属、CORS 非授权方向正确。 | K10 全部，尤其认证失败/对象无权/不存在状态策略、写操作和会话撤销、密码字节上限与 Cookie/CSRF 场景。 |
| go-concurrency | map 同步、context 主动观察、race 范围提醒正确。 | goroutine 生命周期、WaitGroup/channel/锁、临界区、关闭与取消、race 运行条件、超时传播、HTTP 优雅退出。 |
| go-delivery | 本机 localhost、CI 范围与保密提醒合理。 | K12 全部，镜像/容器/多阶段/volume/迁移/健康、干净环境、构建测试/CI YAML/tag/release 与证据。 |

## 42 课概念映射与缺口

本表列出**补充知识层**相对每课 concepts/task 的缺口。原 sourceMarkdown 中可能已有一句定义或例子，不等于该缺口完全不存在于仓库；也不等于它在课内展开顺序合理。Web 后续 JavaScript/DOM/请求专题另关联后续阶段，不属于 42 节起步课的全部概念。

| 课时 | 现有关联主题 | 补充层未充分讲解的本课重点 |
| --- | --- | --- |
| web-01 | files/html | doctype/head/body/title/charset、标签嵌套、完整文件与运行。 |
| web-02 | files/html | href/src/alt/id、锚点与文件路径的操作对照、footer。 |
| web-03 | css | CSS 引入、元素/类/伪类、继承与普通声明顺序。 |
| web-04 | box | 块级/行内行为、实测尺寸和 margin。 |
| web-05 | flex | flex-grow、收缩、方向切换后的具体结果。 |
| web-06 | css/flex | object-fit/宽高比/圆角、复用类、hover/focus。 |
| web-07 | html/box/flex/quality | 后两个主题课内被截断；结构、工具和重建流程需完整入口。 |
| web-08 | grid | repeat/minmax/fr 与容器宽度、列数推演。 |
| web-09 | responsive | viewport 标签、相对单位与 @media 语法。 |
| web-10 | css | CSS 自定义属性、可读行长、对比和间距体系。 |
| web-11 | responsive | DevTools 设备模拟步骤、超宽元素检查与长内容。 |
| web-12 | forms | disabled、键盘焦点、不同按钮与真实提交边界。 |
| web-13 | files/css/quality | quality 被截断；目录移动、资源错误与面板操作。 |
| web-14 | grid/responsive/forms/quality | forms/quality 被截断；综合验收顺序与交付证据。 |
| go-01 | tools | 安装入口与 package/main/import；build 产物启动。 |
| go-02 | control | K02/K03/K04：变量、类型、分支、作用域、转换、列表先修及两种起点。 |
| go-03 | collections | 数组/切片/make/len/cap/append/range/排序/Unicode 全流程。 |
| go-04 | models | struct 字段、&/*、接收者与副本、导出/tag、筛选。 |
| go-05 | errors | 无 HTTP 前置的独立 error/JSON/defer 演示；错误退出。 |
| go-06 | tools/tests | 多文件包、导入路径、*_test.go、表驱动的完整例子。 |
| go-07 | http | URL/客户端/服务器/HandlerFunc/ServeMux、参数转换与 curl。 |
| go-08 | http | HTTP 方法语义、资源、创建/更新 DTO、完整成功/失败契约。 |
| go-09 | http | PathValue/Query/Parse/400 vs404、列表 JSON 空数组。 |
| go-10 | errors/http | MaxBytesReader/严格 JSON/DTO、201/Location、共享存储保护。 |
| go-11 | http/concurrency | PATCH 的缺字段 vs false、RWMutex、原子操作、删除204。 |
| go-12 | sql | 数据库准备、四种 SQL、NULL、类型、主键与约束。 |
| go-13 | sql | 驱动安装、连接池、DATABASE_URL、Ping、超时、参数与 Scan。 |
| go-14 | sql | repository、Query/Exec/RETURNING/RowsAffected、RowsErr、真正事务。 |
| go-15 | tests | 按业务约定独立期待、Unicode 长度、error 判断及故意失败。 |
| go-16 | tests | NewRequest/NewRecorder/ServeHTTP、路由/JSON断言、fake 与测试隔离。 |
| go-17 | tests/sql | 测试库连接/迁移/回滚/清理、约束失败、重复运行。 |
| go-18 | models/design | 各层职责、接口/构造注入、请求数据流与不必强拆的判断。 |
| go-19 | design | 环境变量实际读取/校验、结构化日志字段、敏感信息与请求关联。 |
| go-20 | design | page/limit 解析与 offset、范围检查、参数筛选、稳定排序边界。 |
| go-21 | design/delivery | 在新目录跟 README 重放、质量命令含义、实际接口例子。 |
| go-22 | auth | 表关系、旧记录归属迁移、哈希原则、最小权限。 |
| go-23 | auth | 注册/登录实现边界、bcrypt 72 字节、会话令牌与 Cookie、过期。 |
| go-24 | auth | 可信会话取得身份、Session/JWT 差异、写操作授权、撤销、A/B证据。 |
| go-25 | errors/auth | SQL 参数/动态列白名单未关联 sql；413、CORS/CSRF、Origin/HTTPS与限流。 |
| go-26 | concurrency | goroutine/channel/锁/context/超时/Shutdown 的逐步演示。 |
| go-27 | delivery | Dockerfile、Compose、volume、健康、启动/迁移顺序；现有提示不足。 |
| go-28 | delivery | workflow YAML/CI、数据库服务准备、toolchain、Git tag/Release 与验收范围。 |

## 复核标准

每个详细主题应能回答：它解决什么问题、语法每部分是什么、数据逐步怎样变化、在哪里建哪个文件、在 VS Code 哪个终端输入什么、预期看到什么、修改一处为什么改变、常见错误如何收集证据、适用边界是什么。术语数、文件数、主题映射数和字数均不能替代这些教学证据。

运行验证必须区分完整程序与集成片段，记录实际工具链/浏览器和输入输出。SQL、认证、容器等需要外部环境的示例，若只做编译、fake 或结构核验，应明确写出；不能称“完整后端验收通过”。新增课内链接与目录还需检查两种起点、桌面/窄屏、file://、代码复制、进度不变及预览隔离。

## 修订后复核

本轮已逐篇阅读 `docs/knowledge/web/` 的 12 篇与 `docs/knowledge/go/` 的 12 篇详细讲义，不仅抽查标题、字数或前四篇。复核包含文件布局、术语先修、源码与输出对应关系、修改实验、错误路径和声明的运行边界；对审核反馈新增的段落再读一遍。网页运行、真实示例运行和界面检查由实施任务另行记录在本文后续部分，本节仅记录内容复核。

### 逐主题内容复核结果

| 主题 / 详细源文件 | 已核对的机制与例子 | 内容结论及实际环境边界 |
| --- | --- | --- |
| web-files / `docs/knowledge/web/web-files.md` | 三文件路径、保存刷新、file/HTTP、CSS url 相对位置、样式加载与链接导航分开。 | K05 纠正；首页/关于页的地址与预期对应。是否实际请求成功由浏览器结果确认。 |
| web-html / `docs/knowledge/web/web-html.md` | 标签/元素/属性、文档骨架、标题关系、语义区块、锚点、Tab/Enter。 | 补齐 Web01/02 的关键定义；无须 JS 即可运行结构与导航。 |
| web-css / `docs/knowledge/web/web-css.md` | 类/后代与组合选择器、指定值与继承、同条件顺序、CSS变量及回退、focus、行长/间距/对比。 | `.card .note` 蓝色加粗预期合理；65ch 不等于65个中文字，色彩对比需计算，未把视觉猜测当验收。 |
| web-box / `docs/knowledge/web/web-box.md` | 四层、content/border-box算式、getBoundingClientRect、transform边界、block/inline与margin合并。 | 226/200、242/200、284/240/196 预算核对无误；JS明确作为测量工具，未要求新手此时掌握所有DOM。 |
| web-flex / `docs/knowledge/web/web-flex.md` | 直接子项、两轴、剩余空间、wrap、最小尺寸、grow/shrink/basis。 | 剩余400按1:3得到200/400、按1:2得到233.33/366.67预算正确；不把总宽直接按grow比例分。 |
| web-grid / `docs/knowledge/web/web-grid.md` | 轨道/fr/gap、minmax/min、auto-fit、长内容、719/720断点。 | 600扣20间隙后1:2预算正确；规则不靠隐藏溢出完成。 |
| web-responsive / `docs/knowledge/web/web-responsive.md` | viewport、断点、图片盒与内容、max-width/object-fit、长文本、缩放与模拟边界。 | 本地SVG无素材下载前置；完整展示与cover裁剪的取舍明确，模拟视口未称真实设备全覆盖。 |
| web-forms / `docs/knowledge/web/web-forms.md` | label/id/name、原生校验、空白输入、submit/Enter、状态失效、disabled/readonly。 | 本机验证与真实保存分开；空白、清空与编辑后反馈对应代码。真实提交与后台未实现。 |
| web-js / `docs/knowledge/web/web-js.md` | 字符串/数字/空输入、有限数、对象数组、const/浅共享、filter/map、return、边界<=。 | 30→HTML/CSS、20→HTML、0→空结果符合程序；不将打印当返回、空字符串转换当有效输入。 |
| web-dom / `docs/knowledge/web/web-dom.md` | DOM/null/执行时机、事件登记与调用、统一渲染、textContent、空状态、监听去重。 | 发现“重复addEventListener必然多次”的歧义已改为不同匿名函数风险，同函数引用/同capture去重已写明。[MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) |
| web-fetch / `docs/knowledge/web/web-fetch.md` | HTTP/解析/契约分层、Promise/async/await、正常/空/404/坏JSON/错形状、最新请求规则。 | 已移除未知异步先修并首次解释Promise；版本号阻止旧结果渲染，明确不取消实际请求。依赖Python本地HTTP，不能双击文件后期待fetch成功。 |
| web-quality / `docs/knowledge/web/web-quality.md` | 复现证据、三个浏览器面板、三文件、Git身份/独立目录/暂存diff、交付范围。 | 计数0→1→2/刷新0与源码一致；静态文件、提交、上传、发布各有边界，无虚构上线。 |
| go-tools / `docs/knowledge/go/go-tools.md` | 编辑器与工具链、包/模块、独立目录、main/import、run/build与旧程序、导出。 | 两行输出与源码对应；主程序/测试/vet分别解释，不将无测试结果称功能测试。 |
| go-control / `docs/knowledge/go/go-control.md` | 变量/零值/声明赋值/作用域、布尔判断、最小列表与range、for顺序、switch、转换、多返回与任务接口。 | 新手Day02不再必须先读Day03或C++；Passed/Stats与示范Average区别明确。SumTo负数返回错误、空分数与零分分开；极大整数溢出未承诺支持。 |
| go-collections / `docs/knowledge/go/go-collections.md` | 数组/slice、长度容量、make/append/copy、浅共享、map存在/nil、排序、字节偏移/rune。 | 中文8字节/4码点、偏移0/1/2/5与文本匹配；rune未等同视觉字符，词频分词与标点范围明确。 |
| go-models / `docs/knowledge/go/go-models.md` | struct、取地址/解引用、值/指针修改、方法集、小接口、JSON导出/tag、typed nil边界。 | 值方法false/指针true/JSON键与代码一致；副本中的引用字段可能共享，不讲成值接收者绝无外部影响。 |
| go-errors / `docs/knowledge/go/go-errors.md` | 单机字符串Decode、语法/类型/未知/单值/业务、error/wrap/Is/As、EOF、大小单位、defer。 | 已解除Day05 HTTP前置；拒绝分支真实return，顶层null/缺字段与重复键限制明确。HTTP请求上限仍需后续Handler保护。 |
| go-tests / `docs/knowledge/go/go-tests.md` | 完整主程序与测试文件、表驱动/子测试/got-want/失败反例、HTTP recorder、fake边界。 | SumTo定义已包含；直接Health测试未被称mux路由测试，fake未被称SQL验证，数据库清理仍需独立测试环境。 |
| go-http / `docs/knowledge/go/go-http.md` | URL与query类型、方法路由、r/w、Header顺序、Atoi、重复参数、httptest/serve、PathValue/DTO/201/204/PATCH。 | GET模式也匹配HEAD、默认404/405非统一JSON已写；PATCH指针区分缺字段/false，但null默认视同缺失的限制也写明。CRUD片段明确不是完整现成项目。 |
| go-sql / `docs/knowledge/go/go-sql.md` | 参数与标识符、连接池/Ping、Rows/Scan/Err、RETURNING/RowsAffected、单连接临时表、tx提交/回滚。 | PostgreSQL trim默认普通空格范围已写，约束错误核验23505/23514，不把任意错误当约束成功。临时表不证明重启持久化；真实DB实验必须另外实际执行。 |
| go-design / `docs/knowledge/go/go-design.md` | 三层职责、小接口/构造注入、进程环境继承与Getenv读取、slog字段、分页/唯一排序。 | 修正“环境变量只在启动时读取”笼统描述；limit/offset预算与空页区别正确，offset并发跳动未被稳定排序掩盖。 |
| go-auth / `docs/knowledge/go/go-auth.md` | 哈希/盐/bcrypt限制、Session链条/失效、JWT签名与声明、Cookie、CORS/预检/凭据/CSRF、对象写权限。 | A/B与到期示例是固定身份纯逻辑；未虚构注册/会话/CSRF/浏览器凭据或真实库已完成。它们的环境与实现需后续集成验证。 |
| go-concurrency / `docs/knowledge/go/go-concurrency.md` | goroutine等待、Mutex临界区、WaitGroup、channel缓冲/关闭二值/range/nil、协作取消与race边界。 | 600计数与预取消/正常路径可手推；关闭后读完再0,false与nil通道机制准确。普通运行不等于race或真实数据库取消验证。 |
| go-delivery / `docs/knowledge/go/go-delivery.md` | 超时/Shutdown、CLI配置、Docker多阶段、端口/EXPOSE、数据库网络/卷/健康/迁移、CI/tag/Release。 | PostgreSQL18卷挂载范围已按官方镜像核对，17及以下不同；浮动镜像标为学习用，正式可复现须固定摘要。[镜像说明](https://hub.docker.com/_/postgres) 容器、真实数据库迁移与远程CI仍需实际环境。 |

### 初审 12 项问题的关闭情况

“内容已修正”表示对应讲解/契约/展示源码已复看，**不等于实际环境已经验收**。运行结果须读取实施记录。

| 编号 | 内容复核状态 | 对应改动与保留边界 |
| --- | --- | --- |
| K01 | 展示根因已修正 | lessonMarkup不再截断主题，conceptMarkup加载详细讲义；目录、复制、答案折叠可减轻长文阅读负担。路由与屏幕执行结果待实施记录。 |
| K02 | 内容已修正 | go-control已覆盖声明/赋值/类型/条件/switch/循环/作用域/转换/函数，多步骤解释代替三条摘要。 |
| K03 | 两种起点已修正 | effectiveLesson(new)使用go-control详细源；本课先解释最小列表，Passed/Stats明确对接。已有基础者展开旧讲义时，另有提示明确C++对照可选，Python/Java等学习者也可用熟悉小题对照，不把C++作为共同先修。 |
| K04 | 契约已修正 | SumTo拒绝负数，并解释失败返回的零不是有效结果；正常与0保持原任务含义。 |
| K05 | 错误已修正 | 超链接导航与CSS/图片资源加载区分，初次三次请求断言撤除。 |
| K06 | 前置已修正 | Go05采用字符串JSON解析；要求Handler的go-json练习移至Go10，HTTP片段含错误return。 |
| K07 | 运行上下文已补齐 | 每主题有完整文件/步骤/预期或清楚标注集成片段；Go与Web主例实际结果待实施记录，不以阅读声称运行通过。 |
| K08 | 概念与边界已补齐 | slice共享/容量/浅复制、nil map、排序并列、字节/rune/视觉字符区别均可阅读验证。Unicode业务长度仍由具体项目定义。 |
| K09 | 内容已修正，真实DB待验 | SQL生命周期、成功/失败事务、SQLSTATE和约束范围补齐；临时表实验与持久化CRUD/集成测试是不同证据。 |
| K10 | 内容已修正，真实认证待验 | 登录身份链、失效、JWT、Cookie、CORS/CSRF和写操作归属机制展开；纯逻辑A/B运行无法证明真实认证栈、安全库参数或跨站保护通过。 |
| K11 | 内容已修正，动态环境待验 | channel关闭/nil、同步等待、取消、Shutdown均有解释；race需工具链支持，真实HTTP在途退出与DB取消另验。 |
| K12 | 内容已修正，交付环境待验 | Docker/Compose/DB卷健康迁移/CI/tag机制与范围补齐；未运行的容器或Actions不能宣称成功。 |

### 本轮追加发现与修订

内容复核额外指出并直接交作者修订的事项包括：DOM同函数监听去重、Fetch未知异步先修、Go02列表先修/switch/任务接口、Go04取地址与解引用、Go配置读取时机、SQL trim空白范围、数据库约束SQLSTATE、PATCH的false与缺失/null、JWT/Cookie/CORS-CSRF、关闭channel与nil、PostgreSQL18卷布局和浮动镜像可复现范围。这些均按原理与实际前置审核，不使用字数增长代替检查。

复核时发现新增 `INSERT INTO problems(title)` 片段与本课程Day12的`platform`/`difficulty`必填约束不相容。最终源码已改为显式传入`title/platform/difficulty`三列，并说明多用户阶段的owner字段须来自可信身份，已复看关闭。对真实项目示例，依赖“我的表恰好有默认值”不能成为教材默认前提。密码散列片段的校验失败分支也已改为明确return，避免失败后继续创建会话。

本轮没有发现已复看的完整主例存在确定的核心语义错误；上述结论以限定范围成立。完整项目的数据库、认证、容器和CI仍需按自己的真实实现接受集成验证，不把“补充主题都已存在”改写成“所有后端能力已验收”。

## 实施与实际运行验收

正文位于 `docs/knowledge/web/`、`docs/knowledge/go/`，每个方向 12 篇。网页离线数据由 `scripts/build_knowledge_guides.cjs` 生成；正文和主示例清单必须同步。课内完整显示所有关联主题，首个默认展开；章节跳转、代码复制和折叠答案用于管理篇幅。知识地图使用同一详细正文，旧片段保留为速查。零基础 Go02 使用新的完整源文；已有基础者的原教材对照明确说明不要求 C++。

| 检查 | 实际证据与结果 |
| --- | --- |
| `node scripts/check_site.cjs` | 通过；24 讲义源与离线包一致，入口资源哈希一致，课程/练习/来源映射有效。 |
| `node scripts/test_knowledge_guides.cjs` | 通过；24 主题 × 320/375/414/768/1024/1280/1440px，章节可见与焦点、源码复制、危险 Markdown 转义、离线加载、阅读不更新完成状态；42 课全部关联主题均展示。 |
| Web 12 个主例 | 全部在真实 Edge 浏览器运行。检查文件导航与 CSS 加载、盒模型 226/200px、Flex 方向、表单空白拒绝与仅本地反馈、筛选、DOM 文本安全、请求正常/空/404/坏JSON/错误结构、点击计数和四档示例宽度。 |
| Go 12 个主例 | 全部在隔离模块实际执行：工具输出、零值/正常与非法输入、集合/Unicode、结构体与 JSON、错误解析、真实表驱动和 HTTP 单元测试、HTTP Handler 正常/错误响应、标题逻辑、分页、A/B归属和会话逻辑、600次同步计数与取消、交付配置。stdout与明确结果逐项核对。 |
| 另一个 PostgreSQL 主例 | 驱动依赖下编译检查通过；统一运行清单标为 manual，要求专用真实测试库、DATABASE_URL 与 pgx。未连接真实数据库，未冒充事务/持久化验收。 |
| `node scripts/test_site.cjs` | 通过；54 内容路由、状态保存/备份/异常恢复、真实完成规则、原讲义安全与隔离预览。 |
| `node scripts/test_learning.cjs` | 通过；44 补充路由、搜索/筛选/返回、复制与手动预览、文件协议、移动宽度与配套练习失败场景。 |
| `node scripts/test_workbench.cjs` | 通过；七档宽度、三步标签、问题/代码草稿、上下文、键盘与面板开关，无外部模型请求。 |
| 用户原有浏览器页面 | 刷新后在原 `#/lesson/go-02` 页面实际看到完整变量/类型/零值、if、列表与循环解释，章节定位成功；保留问题文本并恢复原 ChatGPT 选择，没有发送消息。 |

执行中发现盒模型测量示例在代码格式化后把缩进带入了结果字符串，与说明存在多余空白差异。已同步修正讲义和示例源码为明确换行拼接，保留原测量断言重新通过，没有放宽预期值。最终独立例子结果写入开发环境的 `.qa/knowledge-example-results.json`，记录 24 个 passed 和 1 个 manual；此开发记录不进入学习完成状态。

本次内容审核由独立代理完整复读 24 篇并检查 42 课映射，主执行者负责修订整合、页面和代码运行验证。它不是第三方教学认证或真实新手访谈。教材原文未修改，学习完成状态没有因阅读/复制/示例运行而自动改变。本次交付为本地修改，尚未发布线上。
