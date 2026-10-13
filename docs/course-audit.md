# 全部教程的独立审核与返修

2026-10-13。**Go 65 章、Web 60 章，共 125 章均已逐章独立审核；当前没有未关闭的教学返修项。** 此结论只确认本轮教学正文和相应证据，不代表学习者完成了课程，也不把未运行的环境验收计作通过。

## 审核怎样进行

三组写作 agent 分别负责 Go 基础、Go 后端和 Web 全阶段。写完后另派三名未参与这轮写作的 agent，读取自己负责的全部正文、catalog 中的示例与前置，必要时查配套实际代码，按 [教学标准](teaching-standard.md) 审查。发现问题后由写作者或主 agent 返修，原审核者复读受影响正文并核对结果。

| 范围 | 首轮通过 | 首轮需返修 | 最终通过 | 最终待修 |
| --- | ---: | ---: | ---: | ---: |
| Go 入门与初阶 | 9 | 26 | 35 | 0 |
| Go 中级与高级 | 21 | 9 | 30 | 0 |
| Web 全部阶段 | 15 | 45 | 60 | 0 |
| 合计 | 45 | 80 | 125 | 0 |

首轮共记录 96 项具体问题（Go 基础 32、Go 后端 11、Web 53），主要是独立练习缺口和首次术语、语法、运行入口的跳步。复核时又处理了 Scanner 顺序矛盾、CRUD 测试种子前提、响应合同、独立工程忽略规则和正常退出日志等细节。首轮问题保留，未用测试绿或增加篇幅直接替换成通过。

完整逐章证据：[Go 基础](reviews/tutorial-2026-10-13/audit-go-foundations.json)、[Go 后端](reviews/tutorial-2026-10-13/audit-go-backend.json)、[Go 后端首轮](reviews/tutorial-2026-10-13/audit-go-backend-round1.json)、[Web](reviews/tutorial-2026-10-13/audit-web-teaching.json)。Go 基础报告含两轮历史，Web 报告在每章保存 originalIssues 与 repairEvidence。

## 对照原要求修了什么

| 教学标准 | 本轮落实与复核 |
| --- | --- |
| 基础与前置 | Go 先程序、变量、类型、条件、循环和函数；Web 先 HTML/CSS，再 JavaScript、DOM、事件。HTTP 先讲浏览器、服务器、URL、端口和请求响应，再写 Handler、消息头和 JSON。新增术语首次解释或明确回链。 |
| 零基础读者能跟随 | 补 if 初始化语句、三参数 make、方法参数与返回值、Scanner/Err、容器网络、Git/GitHub/Actions 等实际前置；完整程序与需已有环境的片段分别写明位置。 |
| 代码与结果 | 示例加有效注释，按执行顺序解释新语法、数据和结果；每章写文件、目录、保存、运行与结果位置，长期服务写停止步骤；正文、catalog、实际源码与下载包同步。 |
| 独立练习与反馈 | 为缺失章节补从空白组织的新目标，限定已学知识，列正常与边界自查；改一个字面值或照抄操作不再算独立练习。错误实验必须出现所述失败，参考答案默认收起。 |
| 框架和组合项目 | 新增网页职责、服务器渲染、Web 框架、Go 中间件/框架与 HTML 模板课；先解释解决的问题，再做 React/Vue、JSON API 或模板页面。两条路线不要求同时学习多种后端语言。 |
| 阅读界面 | 左栏选 Go/Web、阶段及章节，每页最多 8 章；中间一次读一章，提供本节目录、前置、前后章。翻目录保留正文位置、答案、提问、笔记与草稿。 |
| 关键句加粗 | 修复中文标点紧邻粗体结束标记造成的字面 `**`；125 章解析均有实际 strong 标记。浏览器核对了 HTTP、恢复与全栈课的 700 字重，围栏代码未因格式修复改变。 |
| 完成证据 | 阅读、复制、例子运行、工程测试、数据库、容器和线上发布分别记录；保留用户进度、原笔记与代码，未自动标记课时完成。 |

## 实际代码缺陷与运行验证

四份后端工程在第二次 JSON Decode 也识别请求体超限：合法对象后接超量空白返回 413，额外 JSON 值仍返回 400；新增正常尾空白、8192 字节边界、超量尾空白、第二值、坏尾部与首值超限测试。密码格式在 Split/Base64 解码前限制长度；非法格式与超长输入有专门测试。

四份 main 在监听结束后等待 Shutdown 完成，收到 SIGINT/SIGTERM 都进入等待流程，记录开始与结束；Compose 的停止预算为 10 秒，大于内部 5 秒。退出回归使用实际 loopback 在途请求与可控 context，删除等待语句会失败；它验证控制流，未冒充 Linux 信号或容器实测。

全栈前端共享操作版本，旧成功和旧失败不覆盖新界面；创建后实际重新读取，读取失败仍保留创建确认。写作者实际 Go + Edge 联调通过，独立审核者另做 8 个延迟反例。Effect 完整父子组件通过类型检查、构建与浏览器卸载/取消/重新挂载验证。

- 课程运行：51 个 Go 例子、49 个浏览器例子、1 套 Node 测试；125 章在 320/768/1440px 共 375 个页面场景。另 24 章为环境、工程或人工步骤，单独记录，不混入小例子数。
- 目录交互：320/375/414/768/1440px，全部阶段和 95 个目录分页场景，含刷新、回退、定位、手机展开/选章、阅读与用户记录保留。
- Go 1.26.9：followup-08/09/10/11 的实际模块 vet、test、build 全部通过，go.mod/go.sum 未改；顶层通过测试数依次 4/4/5/5。09 的 TestRealDatabase 和 11 的 TestRealDatabase、TestRealSQLIdentityOwnership 明确 SKIP。
- 24 个知识主题、42 个旧课映射、安装教程、工作台、备份/异常恢复、离线读取、旧缓存和源码 ZIP 检查通过；原 5 份教材哈希检查无变化。

运行明细及最终源文件哈希：[执行汇总](reviews/tutorial-2026-10-13/execution-summary.json)、[四个完整后端模块](reviews/tutorial-2026-10-13/backend-module-validation.json)、[JSON/存储边界与故障回归](reviews/tutorial-2026-10-13/backend-boundary-regressions.json)、[在途请求退出](reviews/tutorial-2026-10-13/shutdown-fixes.json)、[Web 返修专项](reviews/tutorial-2026-10-13/web-teaching-audit-fixes-runtime.json)、[实际全栈联调](reviews/tutorial-2026-10-13/web-teaching-fullstack-race-runtime.json)。审核报告中早期工具链限制对应当时证据；追加真实四模块检查以执行汇总为准。

## 本轮没有执行的环境验收

真实 PostgreSQL 的三项集成测试、Docker/Linux 操作系统停止信号、远程 GitHub Actions、恢复库的完整 HTTP 流程及公网部署没有在本轮实际执行。教程提供可操作步骤与工程，执行证据仍需在对应环境取得。Vue 的基础构建与浏览器比较不扩称为全面 vue-tsc 验收。materials 原教材和学习进度文件保持原样。

## 全部章节覆盖

逐章的问题、原判定与返修证据见上方独立报告；这里列出覆盖，防止只审核前几节。

| 路线 | 阶段 | 章节 | 最终判定 | 审核组 |
| --- | --- | --- | --- | --- |
| Go | 入门 | [用 VS Code 编辑和运行 Go](courses/go/go-vscode.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [Go 程序结构](courses/go/go-program.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [注释和基本语法](courses/go/go-syntax.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [变量声明与赋值](courses/go/go-variables.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [基本数据类型与零值](courses/go/go-types.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [常量与变量的区别](courses/go/go-constants.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [算术与比较运算符](courses/go/go-operators.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [字符串与终端输出](courses/go/go-strings.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [if 与 else 条件语句](courses/go/go-if.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [switch 多分支选择](courses/go/go-switch.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [for 循环与累加](courses/go/go-for.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [函数参数与返回值](courses/go/go-functions.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [变量作用域与参数传值](courses/go/go-scope.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [递归与停止条件](courses/go/go-recursion.md) | 通过 | Go 入门与初阶 |
| Go | 入门 | [实战 学习时长计算器](courses/go/go-project-minutes.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [数组与下标](courses/go/go-arrays.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [切片与 append](courses/go/go-slices.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [切片共享与复制](courses/go/go-slice-sharing.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [range 遍历切片](courses/go/go-range.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [函数的多个返回值](courses/go/go-returns.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [map 键值集合](courses/go/go-maps.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [字符串的字节与 rune](courses/go/go-unicode.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [指针与修改调用者变量](courses/go/go-pointers.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [结构体与字段](courses/go/go-structs.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [方法与接收者](courses/go/go-methods.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [接口与行为约定](courses/go/go-interfaces.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [error 与失败返回](courses/go/go-errors.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [defer 与函数结束时执行](courses/go/go-defer.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [包与模块的实际组织](courses/go/go-packages.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [第一份单元测试](courses/go/go-testing.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [结构体与 JSON 编解码](courses/go/go-json.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [从终端读取一行输入](courses/go/go-input.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [文件读取与路径](courses/go/go-files.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [字符串处理与排序](courses/go/go-sort.md) | 通过 | Go 入门与初阶 |
| Go | 初阶 | [实战 词频统计与稳定排名](courses/go/go-project-wordfreq.md) | 通过 | Go 入门与初阶 |
| Go | 中级 | [HTTP 请求与响应](courses/go/go-http-message.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [第一个 Handler 与路由](courses/go/go-http-handler.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [查询参数与输入校验](courses/go/go-http-query.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [JSON 响应与状态码顺序](courses/go/go-http-json.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [严格 JSON 输入边界](courses/go/go-json-boundary.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [测试整个 HTTP 响应](courses/go/go-http-testing.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [标准库与 Web 框架](courses/go/go-web-frameworks.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [用 Go 模板生成 HTML 页面](courses/go/go-templates.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [数据库、表与约束](courses/go/go-sql-tables.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [SQL 查询、修改与删除](courses/go/go-sql-crud.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [Go 连接 PostgreSQL 与参数绑定](courses/go/go-database-go.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [事务与回滚](courses/go/go-transactions.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [Repository 与依赖注入](courses/go/go-repository.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [环境配置与明确的默认值](courses/go/go-config.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [分页参数与稳定排序](courses/go/go-pagination.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [goroutine 与等待完成](courses/go/go-goroutines.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [互斥锁与共享状态](courses/go/go-mutex.md) | 通过 | Go 中级与高级 |
| Go | 中级 | [CRUD 接口约定与内存实现](courses/go/go-crud.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [channel 的发送与接收](courses/go/go-channels.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [context 取消与 select](courses/go/go-context.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [类型断言与安全检查](courses/go/go-type-assertion.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [泛型函数的类型参数](courses/go/go-generics.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [密码哈希与验证](courses/go/go-passwords.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [登录会话、过期与注销](courses/go/go-sessions.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [记录归属与对象权限](courses/go/go-authorization.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [超时与有期限的服务退出](courses/go/go-shutdown.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [Docker 镜像、容器与数据卷](courses/go/go-containers.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [CI 与可复现的质量检查](courses/go/go-ci.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [基准、性能剖析与证据](courses/go/go-performance.md) | 通过 | Go 中级与高级 |
| Go | 高级 | [备份恢复与项目交付](courses/go/go-recovery.md) | 通过 | Go 中级与高级 |
| Web | 入门 | [网页、浏览器与三种基础语言](courses/web/web-roles.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [HTML 文档结构](courses/web/web-document.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [标签、元素与属性](courses/web/web-elements.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [标题、段落与列表](courses/web/web-text.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [链接与相对路径](courses/web/web-links.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [图片、src 与 alt](courses/web/web-images.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [语义区块与页面层级](courses/web/web-sections.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [表单控件与 label](courses/web/web-forms.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [CSS 规则与引入方式](courses/web/web-css.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [标签、类与 ID 选择器](courses/web/web-selectors.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [层叠、优先级与继承](courses/web/web-cascade.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [文字样式与长度单位](courses/web/web-units.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [盒模型与 box-sizing](courses/web/web-box.md) | 通过 | Web 全部阶段 |
| Web | 入门 | [实战 学习名片页](courses/web/web-project-profile.md) | 通过 | Web 全部阶段 |
| Web | 初阶 | [正常文档流与 display](courses/web/web-flow.md) | 通过 | Web 全部阶段 |
| Web | 初阶 | [Flexbox 的主轴与交叉轴](courses/web/web-flex.md) | 通过 | Web 全部阶段 |
| Web | 初阶 | [Grid 的列、间距与 fr](courses/web/web-grid.md) | 通过 | Web 全部阶段 |
| Web | 初阶 | [媒体查询与移动优先](courses/web/web-responsive.md) | 通过 | Web 全部阶段 |
| Web | 初阶 | [定位参照与小角标](courses/web/web-position.md) | 通过 | Web 全部阶段 |
| Web | 初阶 | [图片裁剪与长内容溢出](courses/web/web-overflow.md) | 通过 | Web 全部阶段 |
| Web | 初阶 | [CSS 变量与交互状态](courses/web/web-css-variables.md) | 通过 | Web 全部阶段 |
| Web | 初阶 | [实战 响应式活动页](courses/web/web-project-responsive.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [JavaScript 的运行位置](courses/web/web-js-start.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [let、const 与数据类型](courses/web/web-js-variables.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [运算符与类型转换](courses/web/web-js-operators.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [字符串与模板文字](courses/web/web-js-strings.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [条件分支与边界](courses/web/web-js-if.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [循环与累加](courses/web/web-js-loops.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [函数定义、参数与返回](courses/web/web-js-functions.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [函数作用域与值传递](courses/web/web-js-scope.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [数组与元素访问](courses/web/web-js-arrays.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [对象、属性与引用](courses/web/web-js-objects.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [JSON 文字与 JavaScript 对象](courses/web/web-json.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [回调与数组 filter](courses/web/web-js-callbacks.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [数组 map 与数据转换](courses/web/web-js-map.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [DOM 与读取页面元素](courses/web/web-dom.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [事件与点击处理函数](courses/web/web-events.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [创建列表与安全显示文字](courses/web/web-dom-list.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [状态、筛选与渲染](courses/web/web-ui-state.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [try、catch 与失败分支](courses/web/web-js-errors.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [Promise 的完成与失败](courses/web/web-promise.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [async、await 与错误处理](courses/web/web-async.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [JavaScript 模块与导入导出](courses/web/web-modules.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [localStorage 与序列化](courses/web/web-storage.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [fetch、HTTP 状态与 JSON](courses/web/web-fetch.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [加载、成功、空结果与失败](courses/web/web-request-states.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [重叠请求与过期结果](courses/web/web-cancel-request.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [HTML 从哪里来：静态页、模板与 API](courses/web/web-rendering.md) | 通过 | Web 全部阶段 |
| Web | 中级 | [Git 的工作区、暂存区与提交](courses/web/web-git.md) | 通过 | Web 全部阶段 |
| Web | 高级 | [Node、npm 与项目脚本](courses/web/web-npm.md) | 通过 | Web 全部阶段 |
| Web | 高级 | [为什么需要组件与框架](courses/web/web-frameworks.md) | 通过 | Web 全部阶段 |
| Web | 高级 | [TypeScript 注解与类型检查](courses/web/web-typescript.md) | 通过 | Web 全部阶段 |
| Web | 高级 | [联合类型与缩小范围](courses/web/web-narrowing.md) | 通过 | Web 全部阶段 |
| Web | 高级 | [React 组件、Props 与 State](courses/web/web-react.md) | 通过 | Web 全部阶段 |
| Web | 高级 | [Vue 模板、Props 与响应式状态](courses/web/web-vue.md) | 通过 | Web 全部阶段 |
| Web | 高级 | [组件生命周期与请求清理](courses/web/web-component-requests.md) | 通过 | Web 全部阶段 |
| Web | 高级 | [纯函数测试与失败实验](courses/web/web-testing.md) | 通过 | Web 全部阶段 |
| Web | 高级 | [键盘、资源与性能验证](courses/web/web-quality.md) | 通过 | Web 全部阶段 |
| Web | 高级 | [构建产物、静态发布与回滚](courses/web/web-deploy.md) | 通过 | Web 全部阶段 |
| Web | 高级 | [前端与自己的 Go API 联调](courses/web/web-fullstack.md) | 通过 | Web 全部阶段 |
