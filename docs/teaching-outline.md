# Web 与 Go 教学大纲

课程分入门、初阶、中级、高级，共125个章节。编号表示学习顺序，掌握后再向前，不限定每天必须完成几节。

每节围绕一个具体概念，给出前置、小例子、预期结果、逐步解释、修改实验与独立练习。安装与运行在起步区，工具与工程资料按需要查阅，项目只综合已学知识。

编写与逐章独立审核按 [教学标准](teaching-standard.md) 进行。代码注释解释作用与执行顺序，关键结论适量加粗。测试通过只证明例子运行，不能替代知识前置和讲解质量的审核。

## 阅读结构与两条路线的衔接

选择 Go 或 Web 后，在左栏按入门、初阶、中级、高级选择阶段；章节目录每页最多8章，中间一次只读一节。目录翻页保留阅读位置，正文提供前置、本节目录、上一节和下一节。

Web先认识浏览器与HTML/CSS/JavaScript的职责，再逐项学习标签、样式、语言语法、DOM、事件和请求。Go先学程序结构与语法，再组织数据；进入后端前明确讲浏览器、服务器、URL、端口、HTTP请求与响应，之后才写Handler、消息头、JSON和SQL。

原生页面能运行后，再解释组件与框架解决的数据同步问题。Go通过JSON API与网页交互，也可以在服务器上生成HTML模板页面；两条方式分别有完整例子。Node/Express和Python/FastAPI作为HTTP之后的选学比较，不要求同时掌握多种后端语言。

## Go 从语法入门到后端项目

### 入门 程序结构与基础语法

| 章节 | 本节目标 |
| --- | --- |
| [用 VS Code 编辑和运行 Go](courses/go/go-vscode.md) | 分清文件、终端和工具链，亲手保存并运行一次。 |
| [Go 程序结构](courses/go/go-program.md) | 看懂 package、import、main 和一条打印语句，运行后得到一行文字。 |
| [注释和基本语法](courses/go/go-syntax.md) | 区分注释与执行语句，理解名字大小写和括号配对。 |
| [变量声明与赋值](courses/go/go-variables.md) | 用 var 和 := 保存一个值，再用 = 修改已有变量。 |
| [基本数据类型与零值](courses/go/go-types.md) | 区分 int、float64、bool、string，并观察未赋初值的结果。 |
| [常量与变量的区别](courses/go/go-constants.md) | 用 const 表达固定规则，用变量表达会变化的数量。 |
| [算术与比较运算符](courses/go/go-operators.md) | 计算总数、余数和比较结果，观察整数除法。 |
| [字符串与终端输出](courses/go/go-strings.md) | 连接字符串，区分打印文字与打印变量。 |
| [if 与 else 条件语句](courses/go/go-if.md) | 根据分数选择执行哪一个分支。 |
| [从终端读取一行输入](courses/go/go-input.md) | 读取数字和整行文字，区分空行、EOF、转换错误与范围校验。 |
| [switch 多分支选择](courses/go/go-switch.md) | 按一个值选择明确的分支，处理没有匹配的情况。 |
| [for 循环与累加](courses/go/go-for.md) | 跟踪循环变量，计算 1 到 5 的和。 |
| [函数参数与返回值](courses/go/go-functions.md) | 定义一个 Add 函数，区分定义、调用和返回。 |
| [变量作用域与参数传值](courses/go/go-scope.md) | 辨认同名局部变量，理解整数参数的修改范围。 |
| [递归与停止条件](courses/go/go-recursion.md) | 跟踪函数调用自己，确认输入逐步靠近停止条件。 |
| [实战 学习时长计算器](courses/go/go-project-minutes.md) | 只用已学的变量、函数和条件完成一个小程序。 |

阶段实战：学习时长计算器。变量、函数、条件与计划时长计算。

### 初阶 数据结构、错误与独立程序

| 章节 | 本节目标 |
| --- | --- |
| [数组与下标](courses/go/go-arrays.md) | 用固定长度数组保存三个分数，读取和修改一项。 |
| [切片与 append](courses/go/go-slices.md) | 用切片保存可增长的一组整数，理解长度与切片范围。 |
| [切片共享与复制](courses/go/go-slice-sharing.md) | 观察两个切片共享数据，再用copy建立独立副本。 |
| [range 遍历切片](courses/go/go-range.md) | 读取每一项的位置和值，计算总分。 |
| [函数的多个返回值](courses/go/go-returns.md) | 同时接收两个返回值，用布尔值表示是否找到结果。 |
| [map 键值集合](courses/go/go-maps.md) | 统计指定单词次数，区分不存在与值为零。 |
| [字符串的字节与 rune](courses/go/go-unicode.md) | 观察中文字符串的字节数、Unicode码点数和遍历位置。 |
| [指针与修改调用者变量](courses/go/go-pointers.md) | 用&取得地址，用*访问地址指向的整数。 |
| [结构体与字段](courses/go/go-structs.md) | 把题目标题和完成状态放进同一个值。 |
| [方法与接收者](courses/go/go-methods.md) | 为Problem增加MarkSolved，理解指针接收者。 |
| [接口与行为约定](courses/go/go-interfaces.md) | 用一个只要求Name方法的接口接受具体类型。 |
| [error 与失败返回](courses/go/go-errors.md) | 先检查错误，再使用函数返回的数据。 |
| [defer 与函数结束时执行](courses/go/go-defer.md) | 观察延后执行顺序，为资源关闭准备基础。 |
| [包与模块的实际组织](courses/go/go-packages.md) | 建立两个文件，把函数放到可导入的calc包。 |
| [第一份单元测试](courses/go/go-testing.md) | 比较真实结果与自己手算的期望，改错后看到失败。 |
| [结构体与 JSON 编解码](courses/go/go-json.md) | 将Go结构体变成JSON文字，再读取回来。 |
| [文件读取与路径](courses/go/go-files.md) | 读取一个本地文件，不存在时显示错误。 |
| [字符串处理与排序](courses/go/go-sort.md) | 先把文字拆成单词，再建立确定的输出顺序。 |
| [实战 词频统计与稳定排名](courses/go/go-project-wordfreq.md) | 把字符串、map、切片、结构体和排序连成一个命令行工具。 |

阶段实战：词频统计工具。大小写、计数、并列排序与空输入。

### 中级 HTTP、HTML 模板、SQL 与共享数据

| 章节 | 本节目标 |
| --- | --- |
| [HTTP 请求与响应](courses/go/go-http-message.md) | 先认识客户端、服务器、URL 和 HTTP，再拆请求与响应。 |
| [第一个 Handler 与路由](courses/go/go-http-handler.md) | 登记处理函数，并分别验证内存模拟和浏览器的真实 HTTP 响应。 |
| [查询参数与输入校验](courses/go/go-http-query.md) | 将 a、b 转为范围明确的整数，转换或校验失败时返回 400。 |
| [JSON 响应与状态码顺序](courses/go/go-http-json.md) | 先写Content-Type和状态，再编码JSON响应。 |
| [严格 JSON 输入边界](courses/go/go-json-boundary.md) | 拒绝未知字段，并检查一个值之后没有额外JSON。 |
| [测试整个 HTTP 响应](courses/go/go-http-testing.md) | 同时断言路由、状态、Content-Type与JSON字段。 |
| [标准库与 Web 框架](courses/go/go-web-frameworks.md) | 用路由和中间件理解后端框架会接管哪些工作。 |
| [用 Go 模板生成 HTML 页面](courses/go/go-templates.md) | 把请求中的标题填进 HTML，启动服务，并验证特殊字符会作为文字显示。 |
| [数据库、表与约束](courses/go/go-sql-tables.md) | 区分数据库服务与SQL客户端，建立有明确字段规则的表。 |
| [SQL 查询、修改与删除](courses/go/go-sql-crud.md) | 先选出目标行，再对明确条件执行修改。 |
| [Go 连接 PostgreSQL 与参数绑定](courses/go/go-database-go.md) | 从环境读取连接配置，明确驱动、连接池和SQL参数的职责。 |
| [事务与回滚](courses/go/go-transactions.md) | 让有关联的写入一起成功，任何一步失败就回滚。 |
| [Repository 与依赖注入](courses/go/go-repository.md) | 在不使用数据库的情况下测试调用者，只依赖一个读取行为。 |
| [环境配置与明确的默认值](courses/go/go-config.md) | 读取端口配置，不把密码写进源码或日志。 |
| [分页参数与稳定排序](courses/go/go-pagination.md) | 校验page、limit，计算offset，解释范围与排序。 |
| [goroutine 与等待完成](courses/go/go-goroutines.md) | 启动一个并发任务，再等待它结束。 |
| [互斥锁与共享状态](courses/go/go-mutex.md) | 保护计数读写，区分等待任务与保护数据。 |
| [CRUD 接口约定与内存实现](courses/go/go-crud.md) | 先写成功与失败约定，再逐个实现创建、读取、修改和删除。 |

阶段实战：活动管理 CRUD API。先内存实现，再加入数据库持久化。

### 高级 并发、身份权限与交付

| 章节 | 本节目标 |
| --- | --- |
| [channel 的发送与接收](courses/go/go-channels.md) | 把任务结果交给接收者，理解无缓冲通道的等待。 |
| [context 取消与 select](courses/go/go-context.md) | 让工作函数观察取消信号，而不是只创建一个Context。 |
| [类型断言与安全检查](courses/go/go-type-assertion.md) | 判断接口值保存的具体类型，不用单结果断言赌输入。 |
| [泛型函数的类型参数](courses/go/go-generics.md) | 让同一个取首项函数支持不同元素类型。 |
| [密码哈希与验证](courses/go/go-passwords.md) | 区分密码校验、存储与登录会话，使用维护中的密码算法。 |
| [登录会话、过期与注销](courses/go/go-sessions.md) | 让服务端验证会话，不信任页面里的一项已登录标记。 |
| [记录归属与对象权限](courses/go/go-authorization.md) | 用A、B两个用户验证每次读取、修改与删除。 |
| [超时与有期限的服务退出](courses/go/go-shutdown.md) | 传递取消信号，停止接新请求并等待正在处理的请求。 |
| [Docker 镜像、容器与数据卷](courses/go/go-containers.md) | 区分程序打包、进程启动与数据库数据保存。 |
| [CI 与可复现的质量检查](courses/go/go-ci.md) | 让工作流执行真实存在的测试，并证明改错能让它失败。 |
| [基准、性能剖析与证据](courses/go/go-performance.md) | 先定义慢在哪里，再用相同条件测量修改效果。 |
| [备份恢复与项目交付](courses/go/go-recovery.md) | 在独立恢复库实际还原数据，再验证业务关系。 |

阶段实战：带会话和权限的活动服务。两用户隔离、退出、容器与恢复演练。

## Web 从网页基础到完整应用

### 入门 HTML与CSS的基本组成

| 章节 | 本节目标 |
| --- | --- |
| [网页、浏览器与三种基础语言](courses/web/web-roles.md) | 知道页面在哪里显示，分清 HTML、CSS、JavaScript 各负责什么。 |
| [HTML 文档结构](courses/web/web-document.md) | 分清head与body，写出一张只包含标题和段落的网页。 |
| [标签、元素与属性](courses/web/web-elements.md) | 看懂开始标签、结束标签、内容和属性。 |
| [标题、段落与列表](courses/web/web-text.md) | 用h1、h2、p、ul和li组织说明文字。 |
| [链接与相对路径](courses/web/web-links.md) | 区分外部地址、同目录文件与页面内锚点。 |
| [图片、src 与 alt](courses/web/web-images.md) | 使用一个可离线显示的图片，解释src与alt的职责。 |
| [语义区块与页面层级](courses/web/web-sections.md) | 用header、nav、main、section、footer表达页面职责。 |
| [表单控件与 label](courses/web/web-forms.md) | 让标签关联输入框，观察required的浏览器校验。 |
| [CSS 规则与引入方式](courses/web/web-css.md) | 识别选择器、属性和值，让一个段落改变颜色。 |
| [标签、类与 ID 选择器](courses/web/web-selectors.md) | 只改变活动标题，区别h2、.event-title、#main-title。 |
| [层叠、优先级与继承](courses/web/web-cascade.md) | 判断同一属性最终使用哪一条规则。 |
| [文字样式与长度单位](courses/web/web-units.md) | 用rem、百分比和行高控制一小段正文。 |
| [盒模型与 box-sizing](courses/web/web-box.md) | 手算内容、内边距与边框合成的实际宽度。 |
| [实战 学习名片页](courses/web/web-project-profile.md) | 从空文件写出结构清楚、可读且能键盘操作的一页。 |

阶段实战：个人学习名片。HTML语义、文字、链接与基础样式。

### 初阶 布局、响应式与可用页面

| 章节 | 本节目标 |
| --- | --- |
| [正常文档流与 display](courses/web/web-flow.md) | 比较block、inline与inline-block的排列行为。 |
| [Flexbox 的主轴与交叉轴](courses/web/web-flex.md) | 用Flex排一组导航，知道两个对齐属性控制哪条轴。 |
| [Grid 的列、间距与 fr](courses/web/web-grid.md) | 用两列网格排列四张卡片，再改成三列。 |
| [媒体查询与移动优先](courses/web/web-responsive.md) | 先做单列，再在空间够时切换两列。 |
| [定位参照与小角标](courses/web/web-position.md) | 让角标相对卡片定位，保留正常内容流。 |
| [图片裁剪与长内容溢出](courses/web/web-overflow.md) | 处理长串换行和图片展示比例，定位撑宽原因。 |
| [CSS 变量与交互状态](courses/web/web-css-variables.md) | 用一个变量统一颜色，并让键盘焦点可见。 |
| [实战 响应式活动页](courses/web/web-project-responsive.md) | 用Flex、Grid和媒体查询组织一个完整静态页面。 |

阶段实战：响应式活动页。Flex、Grid、长内容与手机布局。

### 中级 JavaScript、DOM与数据请求

| 章节 | 本节目标 |
| --- | --- |
| [JavaScript 的运行位置](courses/web/web-js-start.md) | 区分HTML结构与script中的执行语句，查看控制台。 |
| [let、const 与数据类型](courses/web/web-js-variables.md) | 保存数字、文字和布尔值，判断哪个变量可以重新赋值。 |
| [运算符与类型转换](courses/web/web-js-operators.md) | 预测数字相加和字符串拼接，明确转换用户输入。 |
| [字符串与模板文字](courses/web/web-js-strings.md) | 连接文字，读取长度，理解模板中的表达式。 |
| [条件分支与边界](courses/web/web-js-if.md) | 根据分数选择分支，先拒绝非法范围。 |
| [循环与累加](courses/web/web-js-loops.md) | 跟踪for循环的开始、条件和更新。 |
| [函数定义、参数与返回](courses/web/web-js-functions.md) | 把计算提成函数，区分返回结果与打印结果。 |
| [函数作用域与值传递](courses/web/web-js-scope.md) | 区分函数内部参数与调用者的数字变量。 |
| [数组与元素访问](courses/web/web-js-arrays.md) | 保存多项数据，访问下标并追加一项。 |
| [对象、属性与引用](courses/web/web-js-objects.md) | 用对象表示活动，观察两个变量引用同一个对象。 |
| [JSON 文字与 JavaScript 对象](courses/web/web-json.md) | 在字符串与对象之间转换，检查坏JSON为何失败。 |
| [回调与数组 filter](courses/web/web-js-callbacks.md) | 把函数作为参数传入，筛选满足条件的数据。 |
| [数组 map 与数据转换](courses/web/web-js-map.md) | 把每项转换成新的值，区分转换与筛选。 |
| [DOM 与读取页面元素](courses/web/web-dom.md) | 把HTML里的一个元素找出来，修改它的文字。 |
| [事件与点击处理函数](courses/web/web-events.md) | 给按钮绑定click事件，点击后执行函数。 |
| [创建列表与安全显示文字](courses/web/web-dom-list.md) | 从数组创建li，避免把数据当HTML执行。 |
| [状态、筛选与渲染](courses/web/web-ui-state.md) | 让搜索结果和数量来自同一份筛选结果。 |
| [try、catch 与失败分支](courses/web/web-js-errors.md) | 捕获一个具体失败，明确选择之后的处理。 |
| [Promise 的完成与失败](courses/web/web-promise.md) | 观察立即执行的日志与Promise回调的顺序。 |
| [async、await 与错误处理](courses/web/web-async.md) | 在async函数中等待Promise，再用try/catch处理失败。 |
| [JavaScript 模块与导入导出](courses/web/web-modules.md) | 把函数放到另一个文件，明确import的路径和名称。 |
| [localStorage 与序列化](courses/web/web-storage.md) | 保存一个简单对象，刷新后读取，并处理坏JSON。 |
| [fetch、HTTP 状态与 JSON](courses/web/web-fetch.md) | 发起一次本地请求，区分HTTP失败与JSON解析失败。 |
| [加载、成功、空结果与失败](courses/web/web-request-states.md) | 让一次请求的结果对应清晰界面状态。 |
| [重叠请求与过期结果](courses/web/web-cancel-request.md) | 让较旧的请求不能覆盖较新的选择。 |
| [HTML 从哪里来：静态页、模板与 API](courses/web/web-rendering.md) | 观察初始 HTML 和请求后的页面变化，理解服务器返回 HTML 与返回 JSON 的区别。 |
| [Git 的工作区、暂存区与提交](courses/web/web-git.md) | 先检查差异，再提交一次能说明目的的源码变更。 |

阶段实战：活动搜索与请求状态。独立筛选、空结果、加载、失败与重试。

### 高级 组件与框架、类型、测试与全栈项目

| 章节 | 本节目标 |
| --- | --- |
| [Node、npm 与项目脚本](courses/web/web-npm.md) | 理解package.json和锁文件，运行一个已有前端项目。 |
| [为什么需要组件与框架](courses/web/web-frameworks.md) | 用一个小页面观察数据与 DOM 的同步责任，再理解组件库、框架和构建工具的区别。 |
| [TypeScript 注解与类型检查](courses/web/web-typescript.md) | 给函数输入输出加类型，区分编译检查和运行时校验。 |
| [联合类型与缩小范围](courses/web/web-narrowing.md) | 根据状态判断哪些字段存在，避免无意义的可选字段。 |
| [React 组件、Props 与 State](courses/web/web-react.md) | 先做一个计数按钮，再理解父子组件的输入和更新。 |
| [Vue 模板、Props 与响应式状态](courses/web/web-vue.md) | 用与React相同的计数目标理解Vue的写法。 |
| [组件生命周期与请求清理](courses/web/web-component-requests.md) | 只在合适时机请求，离开或参数变化时清理旧请求。 |
| [纯函数测试与失败实验](courses/web/web-testing.md) | 用独立期望值检测筛选函数，改错后看到失败。 |
| [键盘、资源与性能验证](courses/web/web-quality.md) | 分别检查能否操作、资源是否正确、优化是否有实测收益。 |
| [构建产物、静态发布与回滚](courses/web/web-deploy.md) | 分清开发服务器与发布文件，验证真实地址上的资源与操作。 |
| [前端与自己的 Go API 联调](courses/web/web-fullstack.md) | 让界面请求实际服务，用协议定位错误。 |

阶段实战：活动管理前端与全栈联调。组件、真实测试、CRUD与登录权限界面。

## 一节课如何写

例如Go程序结构只用package、import、main和一句Println，逐项解释后改一句文字；不提前出现自定义greeting、指针、接口、JSON或调试配置。变量、函数、数据结构分别成节，学完后才组合为项目。Web同样先学标签和CSS，再学语言运算、DOM与网络。

核心例子保持能一眼跟踪；完整文件与片段明确标注，片段指出所属函数、文件与前置变量。多个文件的项目给目录、启动、正常/失败验证和限制。不会把TODO、未配置数据库或未运行测试说成完成。

每节验收包含解释行为、预测一个变化、独立写一个变式；参考答案折叠。能打开、能编译和复制成功都不单独证明掌握。

## 原课程与学习记录

原Web14课、Go28课与12个后续阶段全部关联具体新章节。旧任务继续作为项目练习，原笔记、草稿和验收含义保留，不赋给不同的新章节。materials原教材保持原文，系统教程是补充重编内容。

## 教学依据

参考[Diátaxis教程组织](https://diataxis.fr/tutorials/)的具体行动与可观察结果，[MDN核心课程](https://developer.mozilla.org/en-US/curriculum/core/)的基础到扩展顺序，以及[Go官方起步](https://go.dev/doc/tutorial/getting-started)和[VS Code Go说明](https://code.visualstudio.com/docs/languages/go)。用户提供的[菜鸟VS Code教程](https://www.runoob.com/go/go-vscode.html)用于学习按功能拆分的说明方式；本仓库独立编写例子与正文。
