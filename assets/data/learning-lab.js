/* Original supplementary explanations and exercises. Materials and learning records remain separate. */
(() => {
  'use strict';
  const sources = [
    { id: 'mdn-curriculum', title: 'MDN · 前端知识体系', url: 'https://developer.mozilla.org/en-US/curriculum/', use: '先对照核心基础，掌握后再挑选框架、测试与性能扩展。' },
    { id: 'mdn-js', title: 'MDN · JavaScript 分主题练习', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Test_your_skills', use: '按数组、函数、事件等薄弱点补练，先预测结果，再运行。' },
    { id: 'mdn-fetch', title: 'MDN · 使用 Fetch', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch', use: '查请求、状态码和响应解析；重点检查 response.ok。' },
    { id: 'odin', title: 'The Odin Project · Foundations', url: 'https://www.theodinproject.com/paths/foundations/courses/foundations', use: '参考基础知识与阶段项目的衔接，完成自己的作品。' },
    { id: 'go-tour', title: 'Go 官方 · Tour', url: 'https://go.dev/tour/', use: '语言入门，阅读短例子，再做章节练习；无需先学 C++。' },
    { id: 'go-examples', title: 'Go by Example · 可运行短例子', url: 'https://gobyexample.com/', use: '需要某个语法或标准库例子时查一个主题，再改变输入。' },
    { id: 'go-test', title: 'Go 官方 · 添加测试', url: 'https://go.dev/doc/tutorial/add-a-test', use: '学习测试文件、testing.T 与 go test，把边界写成用例。' },
    { id: 'go-sql', title: 'Go 官方 · 数据库访问', url: 'https://go.dev/doc/tutorial/database-access', use: '理解 database/sql；官方例子用 MySQL，本课程项目用 PostgreSQL。' },
    { id: 'go-http', title: 'Go 标准库 · net/http', url: 'https://pkg.go.dev/net/http', use: '核对 Handler、ServeMux、请求和响应的实际 API。' },
    { id: 'go-context', title: 'Go 标准库 · context', url: 'https://pkg.go.dev/context', use: '核对取消、deadline 和资源释放，避免任务无限等待。' },
    { id: 'go-auth', title: 'OWASP · 权限检查', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html', use: '用两个用户验证每次读取、修改与删除的权限。' },
    { id: 'exercism-go', title: 'Exercism · Go 练习', url: 'https://exercism.org/tracks/go', use: '想继续专项练习时使用；站外账号、工具要求以其说明为准。' }
  ];
  const topics = [
    {
      id: 'web-files', track: 'web', group: '网页基础', level: 'foundation', title: '文件、地址与浏览器',
      summary: '网页是文件；浏览器按地址读取文件，再解析出页面。',
      why: '图片不显示、样式没加载、换目录后链接失效，都从这里排查。',
      points: [['入口文件', 'index.html 是常见入口名，保存修改后需要让浏览器重新读取。'], ['相对路径', './ 指当前目录，../ 指上一层；路径要相对于引用它的文件理解。'], ['查证据', '用 Network 查请求地址和状态，用 Elements 查最终出现的元素。']],
      language: 'html', example: '<link rel="stylesheet" href="./assets/style.css">\n<a href="./about.html">关于我们</a>\n<img src="./images/club.png" alt="社团成员一起练习">', expected: '页面加载时读取 CSS 和图片；about.html 通常在点击链接导航时才读取。文件路径都必须真实存在。',
      pitfall: '本机盘符路径只在自己的电脑有效；部署后也要检查大小写与目录。',
      recall: ['图片放在 images/logo.png，页面在根目录，src 应该怎样写？', './images/logo.png。若页面移到 pages/，通常要改成 ../images/logo.png。'],
      prerequisites: [], lessonIds: ['web-01', 'web-02', 'web-13'], sourceIds: ['mdn-curriculum', 'odin']
    },
    {
      id: 'web-html', track: 'web', group: '网页基础', level: 'foundation', title: 'HTML 语义与内容结构',
      summary: '标签表达内容是什么；样式决定内容长什么样。',
      why: '导航、标题和主要内容有了结构，键盘与辅助技术才更容易理解。',
      points: [['标题层级', '按内容关系使用 h1、h2；不要为了字号跳级。'], ['链接与按钮', '跳转用 a，触发操作用 button；它们自带不同的键盘行为。'], ['替代文字', '信息图片写有意义的 alt；纯装饰图片使用空 alt。']],
      language: 'html', example: '<header><nav aria-label="主导航"><a href="#events">活动</a></nav></header>\n<main>\n  <h1>周末编程社</h1>\n  <section id="events"><h2>本周活动</h2><p>一起做一个网页。</p></section>\n</main>', expected: '一个主标题，一个活动区域，导航可以定位到活动。',
      pitfall: '把所有元素都写成 div 再加点击事件，会丢失原生语义与键盘支持。',
      recall: ['“打开活动详情”和“收藏活动”分别用什么元素？', '详情跳转用链接；收藏是操作，用按钮，并反映当前收藏状态。'],
      prerequisites: ['web-files'], lessonIds: ['web-01', 'web-02', 'web-07'], sourceIds: ['mdn-curriculum', 'odin']
    },
    {
      id: 'web-css', track: 'web', group: '网页基础', level: 'foundation', title: '选择器、层叠与可读性',
      summary: '样式不生效时，先看规则有没有选中元素，以及最终哪条规则胜出。',
      why: '把样式冲突定位清楚，才能避免不断增加 !important。',
      points: [['类选择器', '用 .card 表达一类组件；一个元素可以组合多个类。'], ['层叠', '来源、层、重要性和优先级等一起决定结果；同条件下后写的规则胜出。'], ['文字层次', '先用字号、行高、留白区分信息；颜色对比要让正文容易读。']],
      language: 'css', example: '.card { color: #303030; line-height: 1.7; }\n.card-title { font-size: 1.4rem; }\n.card { color: #5b4439; }\na:focus-visible { outline: 3px solid #8b4b37; }', expected: '两条 .card 条件相同，最终文字颜色是后面的 #5b4439。',
      pitfall: '修改没选中元素的规则不会改变页面；先在 DevTools 看匹配与被划掉的样式。',
      recall: ['为什么同一个元素能用 card 和 featured 两个类？', '类是可组合的描述；公共样式与特殊样式可以分开，避免复制整套规则。'],
      prerequisites: ['web-html'], lessonIds: ['web-03', 'web-06', 'web-10', 'web-13'], sourceIds: ['mdn-curriculum']
    },
    {
      id: 'web-box', track: 'web', group: '布局与适配', level: 'foundation', title: '盒模型与尺寸计算',
      summary: 'content、padding、border、margin 分别负责内容、内距、边框与外距。',
      why: '解释卡片为什么比声明的 width 更宽，或两个元素为什么挤不进一行。',
      points: [['content-box', 'width 只算内容；padding 和 border 会增加实际边框尺寸。'], ['border-box', 'width 包含内容、padding 和 border；margin 始终在外面。'], ['查看尺寸', '用 DevTools 的盒模型图核对实际值，避免靠肉眼猜。']],
      language: 'css', example: '.card {\n  box-sizing: border-box;\n  width: 240px;\n  padding: 20px;\n  border: 2px solid #706c65;\n}', expected: '边框外宽 240px，内容宽 196px；若改成 content-box，边框外宽为 284px。',
      pitfall: 'border-box 不包含 margin，两个卡片的外距仍然会占空间。',
      recall: ['width 200px、左右 padding 各 12px、border 各 1px，content-box 的外宽是多少？', '226px；border-box 时是 200px。这里的外宽指边框外缘，不含 margin。'],
      prerequisites: ['web-css'], lessonIds: ['web-04', 'web-07'], sourceIds: ['mdn-curriculum']
    },
    {
      id: 'web-flex', track: 'web', group: '布局与适配', level: 'foundation', title: 'Flex：先判断两条轴',
      summary: 'Flex 适合沿一个主方向排列导航、工具栏和一组按钮。',
      why: '理解主轴与交叉轴后，对齐不再靠反复试属性。',
      points: [['主轴', '由 flex-direction 决定；row 通常横向，column 通常纵向。'], ['对齐', 'justify-content 管主轴，align-items 管交叉轴。'], ['可用空间', 'gap 控制间隔，flex-wrap 允许换行；子项的最小尺寸也影响收缩。']],
      language: 'css', example: '.nav {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  flex-wrap: wrap;\n  gap: 12px;\n}', expected: '同一行的项目沿交叉轴居中；空间不足时可以换行。',
      pitfall: '把方向改成 column 后，两条轴也变了；不是永远“justify 横向、align 纵向”。',
      recall: ['column 布局想横向居中，优先检查哪个属性？', 'align-items，因为此时交叉轴是横向。'],
      prerequisites: ['web-box'], lessonIds: ['web-05', 'web-06', 'web-07'], sourceIds: ['mdn-curriculum', 'odin']
    },
    {
      id: 'web-grid', track: 'web', group: '布局与适配', level: 'applied', title: 'Grid：同时安排行与列',
      summary: 'Grid 适合卡片目录或页面分区；先设计列，再让内容填入。',
      why: '同一组卡片要在手机一列、桌面多列时，不需要分别给每张卡写位置。',
      points: [['fr 单位', '分配可用空间，间隙与固定尺寸先参与计算。'], ['minmax', '描述列的最小与最大尺寸；minmax(0, 1fr) 可避免长内容撑开等分列。'], ['auto-fit', '在可用宽度内自动安排列，空列可以折叠。']],
      language: 'css', example: '.cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));\n  gap: 16px;\n}\n.card { min-width: 0; overflow-wrap: anywhere; }', expected: '容器宽时增加列，窄于 220px 时也不会因为列的最小宽度溢出。',
      pitfall: '把最小列宽写死为 300px，而手机可用宽只有 280px，仍会横向溢出。',
      recall: ['导航条和二维卡片目录，通常分别先考虑什么布局？', '导航条先考虑 Flex，卡片目录先考虑 Grid；根据实际内容选择，二者可以组合。'],
      prerequisites: ['web-flex'], lessonIds: ['web-08', 'web-14'], sourceIds: ['mdn-curriculum']
    },
    {
      id: 'web-responsive', track: 'web', group: '布局与适配', level: 'applied', title: '响应式与溢出定位',
      summary: '响应式是内容适应可用空间；断点应来自内容什么时候放不下。',
      why: '页面能在自己的屏幕显示，还要接受窄屏、长标题和缩放的检验。',
      points: [['视口', '声明 viewport，再使用流动宽度、max-width 和相对尺寸。'], ['内容优先', '先保证小屏能读，再在空间充足时增加列与横向布局。'], ['找根因', '固定宽度、图片、长链接、flex 子项最小宽度都可能导致溢出。']],
      language: 'css', example: '.page { width: min(100%, 960px); margin-inline: auto; padding: 16px; box-sizing: border-box; }\nimg { max-width: 100%; height: auto; }\n.content { min-width: 0; overflow-wrap: anywhere; }\n@media (min-width: 720px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }', expected: '缩窄后内容仍能阅读；添加超长单词再检查是否出现横向滚动。',
      pitfall: '直接 overflow-x:hidden 会遮掉问题；先定位超宽元素，再修它的尺寸。',
      recall: ['桌面上正常、手机上溢出，第一步该收集什么证据？', '记录溢出视口宽度，检查超出视口的元素及其 computed width、min-width 和内容。'],
      prerequisites: ['web-grid'], lessonIds: ['web-09', 'web-11', 'web-14'], followup: 0, sourceIds: ['mdn-curriculum']
    },
    {
      id: 'web-forms', track: 'web', group: '交互基础', level: 'applied', title: '表单、键盘与真实反馈',
      summary: '表单不仅是几个输入框，还包括标签、校验、提交与结果反馈。',
      why: '报名或登录时，用户需要知道填什么、哪里错了、数据是否真的提交。',
      points: [['可见标签', 'label 的 for 对应 input 的 id；placeholder 不能替代标签。'], ['原生行为', 'required 和 type=email 提供基础校验；服务端仍要重新验证。'], ['诚实反馈', '本地演示只能说通过本地检查；成功信息需要真实提交结果。']],
      language: 'html', example: '<form>\n  <label for="email">邮箱</label>\n  <input id="email" name="email" type="email" required>\n  <button type="submit">检查报名信息</button>\n</form>', expected: '空值或明显不合法的邮箱会被浏览器阻止提交；label 可以聚焦输入框。',
      pitfall: '表单内普通按钮默认可能提交；非提交按钮明确写 type="button"。',
      recall: ['浏览器校验通过，能证明账号已创建吗？', '不能。还需要服务端验证、保存与真实响应；客户端校验可以被绕过。'],
      prerequisites: ['web-html', 'web-css'], lessonIds: ['web-12', 'web-14'], sourceIds: ['mdn-curriculum']
    },
    {
      id: 'web-js', track: 'web', group: 'JavaScript 与接口', level: 'foundation', title: 'JavaScript：数据到结果',
      summary: '先把输入、处理、输出拆开，再把结果显示到页面。',
      why: '搜索、统计、排序的核心可以先用纯函数验证，再接按钮和输入框。',
      points: [['类型', '输入框的 value 是字符串；转换为数字后仍要检查是否有限、是否在范围内。'], ['数组处理', 'filter 挑选元素，map 转换元素；返回新数组，不等于克隆里面的对象。'], ['函数', '返回计算结果，尽量把 DOM 操作与计算分开，方便换输入验证。']],
      language: 'javascript', example: 'const records = [{ title: "HTML", minutes: 20 }, { title: "Go", minutes: 40 }];\nconst short = records.filter(item => item.minutes <= 30);\nconst titles = short.map(item => item.title);\nconsole.log(titles); // ["HTML"]', expected: '筛选保留第一项；原数组仍有两项。',
      pitfall: 'const 限制变量重新绑定，不禁止对象内部修改；不要把 const 当成深度不可变。',
      recall: ['输入框里写 12，value + 1 和 Number(value) + 1 会有什么区别？', '前者通常得到字符串 "121"，后者得到数字 13；空值与非法文本还需单独检查。'],
      prerequisites: ['web-html'], lessonIds: [], followup: 1, sourceIds: ['mdn-js', 'odin']
    },
    {
      id: 'web-dom', track: 'web', group: 'JavaScript 与接口', level: 'applied', title: 'DOM、事件与界面状态',
      summary: '事件改变数据，渲染把当前数据反映到界面。',
      why: '让搜索、筛选和数量提示同步，避免几个控件各自维护一套结果。',
      points: [['查找元素', 'querySelector 找第一个匹配项，可能返回 null；脚本执行时元素必须存在。'], ['监听事件', 'input 适合即时文本变化，submit 适合表单提交；需要时阻止默认行为。'], ['安全显示', '展示用户输入优先用 textContent；把它塞进 innerHTML 会让浏览器解析标签。']],
      language: 'javascript', example: 'const input = document.querySelector("#keyword");\nconst output = document.querySelector("#result");\ninput.addEventListener("input", () => {\n  output.textContent = input.value.trim() || "请输入关键词";\n});', expected: '输入改变时，输出同步改变；<b> 会作为普通文字显示。',
      pitfall: '重复绑定监听会让一次点击执行多次；把事件绑定和重复渲染分开。',
      recall: ['有数据、没有匹配结果、请求失败，为什么不都显示“暂无内容”？', '三种状态的原因不同，用户下一步也不同：换筛选、等待或重试。'],
      prerequisites: ['web-js', 'web-forms'], lessonIds: [], followup: 1, sourceIds: ['mdn-js', 'odin']
    },
    {
      id: 'web-fetch', track: 'web', group: 'JavaScript 与接口', level: 'applied', title: '请求、JSON 与四种状态',
      summary: '请求数据要处理加载、成功、空结果与失败，也要检查 HTTP 状态。',
      why: '断网、404、格式错误和慢请求，是联调时需要主动测试的输入。',
      points: [['响应状态', 'fetch 收到 404 仍可能正常返回 Response；检查 response.ok。'], ['解析与校验', 'json() 解析可能失败；合法 JSON 也可能不是接口约定的数组或对象。'], ['并发请求', '取消旧请求或只接受最新请求的结果，防止旧响应覆盖新筛选。']],
      language: 'javascript', example: 'async function loadItems() {\n  const response = await fetch("./items.json");\n  if (!response.ok) throw new Error(`HTTP ${response.status}`);\n  const items = await response.json();\n  if (!Array.isArray(items)) throw new Error("期待数组");\n  return items;\n}', expected: '返回数组或抛出错误；调用方仍需 try/catch 并更新加载与错误界面。',
      pitfall: 'file:// 下的 fetch 受浏览器限制；通过本地 HTTP 服务运行这个练习。',
      recall: ['接口返回 HTTP 500，为什么只写 catch 可能漏掉错误？', 'fetch 对 HTTP 错误状态通常不拒绝；要先检查 ok，再读取响应。'],
      prerequisites: ['web-dom'], lessonIds: [], followup: 1, sourceIds: ['mdn-fetch']
    },
    {
      id: 'web-quality', track: 'web', group: '工程与交付', level: 'project', title: '调试、Git 与上线验收',
      summary: '先复现，再收集证据；每次改动都要能解释，也要能恢复。',
      why: '把“我这里能用”变成别人按说明也能重现的作品。',
      points: [['调试路径', '结构看 Elements，运行错误看 Console，请求失败看 Network。'], ['版本记录', '一个提交表达一个明确改动；提交前看 diff，不把依赖和秘密放进仓库。'], ['交付证据', '记录启动命令、预期界面、手机截图和已知限制；线上地址也要重新检查。']],
      language: 'shell', example: 'git status\ngit diff\ngit add index.html assets/style.css\ngit commit -m "web: fix mobile navigation"', expected: '提交包含自己检查过的文件；这些命令不是网站自动执行的动作。',
      pitfall: '静态托管不能直接运行 Go 服务；前端与后端的部署位置、地址要分别写清。',
      recall: ['一次改了五处后页面坏了，怎样把排错范围缩小？', '先复现，查看 diff，把改动缩到一个可验证的假设；每次只改一处并回归原场景。'],
      prerequisites: ['web-responsive', 'web-forms'], lessonIds: ['web-07', 'web-13', 'web-14'], followup: 2, sourceIds: ['mdn-curriculum', 'odin']
    },
    {
      id: 'go-tools', track: 'go', group: '语言起步', level: 'foundation', title: '模块、包与工具链',
      summary: '模块记录依赖与 Go 要求；包组织同一目录里的代码。',
      why: '在正确的项目目录运行命令，才能解释为什么找不到 go.mod 或符号。',
      points: [['独立模块', '一个独立练习有自己的 go.mod，不在学习资料仓库根目录初始化。'], ['包与导出', '同目录的普通源码通常属于同一个包；大写开头的名字可被其他包访问。'], ['工具', 'go run . 运行当前包，go test ./... 检查子包，go fmt ./... 格式化。']],
      language: 'shell', example: '# 在新建的独立练习目录内\ngo mod init example.com/myexercise\ngo run .\ngo test ./...\ngo vet ./...', expected: '需要先有源码；已有 go.mod 的练习跳过 go mod init。',
      pitfall: 'Go 是起点本身，不需要先掌握 C++；比较语法是有经验者的可选辅助。',
      recall: ['module 名称与 package 名称必须相同吗？', '不必须。模块路径参与导入路径，package 名称是代码中引用包时使用的名字。'],
      prerequisites: [], lessonIds: ['go-01', 'go-06'], sourceIds: ['go-tour']
    },
    {
      id: 'go-control', track: 'go', group: '语言起步', level: 'foundation', title: '零值、控制流与函数',
      summary: '变量有类型与零值；函数明确输入、输出和可能的错误。',
      why: '从分数统计这样的小题开始，练习正常输入、空输入和非法输入。',
      points: [['零值', 'int 是 0、bool 是 false、string 是空字符串；零值不等于业务上一定有效。'], ['循环', 'Go 使用 for 表达不同循环；range 可取得索引和元素。'], ['多返回值', '计算结果与 error 分开返回，调用方先处理错误再使用结果。']],
      language: 'go', example: 'func SumTo(n int) (int, error) {\n    if n < 0 { return 0, fmt.Errorf("n不能为负数") }\n    total := 0\n    for i := 1; i <= n; i++ { total += i }\n    return total, nil\n}\n// 3得到6和nil；0得到0和nil；负数返回error', expected: '函数片段，需要 import "fmt" 和 main 或测试调用。先判断 err，再使用 total；有限 int 范围下的大数还需另行防溢出。',
      pitfall: '短变量声明 := 可能在内层作用域创建同名变量；检查更新的是哪一个变量。',
      recall: ['一个分数为 0，怎样区分合法零分和“没有输入”？', '需要单独的存在标记、长度判断或可选类型，不能只靠数值是否为 0。'],
      prerequisites: ['go-tools'], lessonIds: ['go-02'], sourceIds: ['go-tour', 'go-examples']
    },
    {
      id: 'go-collections', track: 'go', group: '语言起步', level: 'foundation', title: 'slice、map 与 Unicode',
      summary: '切片可能共享底层数组；map 负责按键查找，但遍历顺序不能依赖。',
      why: '统计词频、筛选记录、处理中文时，需要明确数据是否共享和排序规则。',
      points: [['共享', '从切片取子切片通常共享底层数组；修改元素可能影响原切片。'], ['map', '读取缺失键得到值类型的零值，可用第二个返回值判断键是否存在。'], ['字符串', 'len(string) 计算字节数；range 遍历 rune，不等于所有人眼看到的字符数。']],
      language: 'go', example: 'a := []int{1, 2, 3}\nb := a[:2]\nb[0] = 9 // a 也变成 [9 2 3]\nc := append([]int(nil), a...)\nc[0] = 7 // 对 int 元素而言，a 不变', expected: 'a[0] 为 9、c[0] 为 7；包含指针等元素时，复制切片仍可能共享被指向的数据。',
      pitfall: 'append 是否复用底层数组取决于容量，不能据一次运行就断言总会共享或总会复制。',
      recall: ['词频相同时，怎么保证每次输出顺序相同？', '把 map 转为切片，按次数降序，再用词的字典序打破并列。'],
      prerequisites: ['go-control'], lessonIds: ['go-03'], sourceIds: ['go-tour', 'go-examples', 'exercism-go']
    },
    {
      id: 'go-models', track: 'go', group: '语言起步', level: 'foundation', title: '结构体、方法与接口',
      summary: '结构体表达数据，方法表达操作，接口表达调用方需要的行为。',
      why: '一条题目从内存到 JSON、再到数据库，要保持字段与职责清楚。',
      points: [['接收者', '值接收者获得副本；要修改接收者本身，通常需要指针接收者。'], ['JSON', '编码默认处理导出字段，tag 可约定 JSON 键；内部字段不要直接成为请求权限。'], ['小接口', '由使用方按需要定义少量方法，测试可以提供替身实现。']],
      language: 'go', example: 'type Problem struct {\n    Title string `json:"title"`\n    Solved bool `json:"solved"`\n}\nfunc (p *Problem) MarkSolved() { p.Solved = true }', expected: '调用 MarkSolved 修改同一个 Problem；还需导入 encoding/json 才能编码。',
      pitfall: '接口不是“所有结构体方法的清单”；过大的接口会让替身和后续修改更困难。',
      recall: ['为什么修改接收者字段的方法常用 *Problem？', '指针让方法访问原对象；值接收者的字段赋值只改变副本。'],
      prerequisites: ['go-collections'], lessonIds: ['go-04', 'go-18'], sourceIds: ['go-tour']
    },
    {
      id: 'go-errors', track: 'go', group: '接口与数据', level: 'applied', title: 'error、JSON 与输入边界',
      summary: '解析成功只表示格式读懂了，还需要检查业务范围与输入契约。',
      why: '接口面对空标题、超大请求、未知字段或两个 JSON 值时，要明确接受什么。',
      points: [['错误处理', '先检查 err；用 %w 包装错误后，调用方可用 errors.Is 或 errors.As 判断。'], ['解码边界', '限制 Body 大小，检查未知字段；需要严格单值时，再解码一次确认 EOF。'], ['释放资源', 'defer 在函数返回时执行，不是每次循环结束时执行。']],
      language: 'go', example: 'var input struct { Title string `json:"title"` }\ndec := json.NewDecoder(strings.NewReader(`{"title":"练习"}`))\ndec.DisallowUnknownFields()\nif err := dec.Decode(&input); err != nil { return err }\nif strings.TrimSpace(input.Title) == "" { return fmt.Errorf("标题不能为空") }\nvar extra any\nif err := dec.Decode(&extra); err != io.EOF { return fmt.Errorf("只接受一个JSON值") }', expected: '返回 error 的解析函数内部片段，需要 encoding/json、strings、fmt、io；第5课从字符串解析开始。HTTP Body、大小限制和400响应在学过Handler后再练。完整程序见上方详细讲义。',
      pitfall: '“JSON 合法”不保证 title 非空，也不证明 owner_id 是可信用户身份。',
      recall: ['JSON 为 {"title":"   "}，解析没有报错，能创建记录吗？', '应根据契约拒绝空白标题；trim 后验证。返回错误之前也不要使用未验证的数据。'],
      prerequisites: ['go-models'], lessonIds: ['go-05', 'go-10', 'go-25'], sourceIds: ['go-examples', 'go-http']
    },
    {
      id: 'go-tests', track: 'go', group: '测试与工程', level: 'applied', title: '表驱动测试与 HTTP 测试',
      summary: '把输入与预期写成用例，区分纯函数测试、HTTP 测试和数据库集成测试。',
      why: '改动校验或路由时，用测试重放正常、失败与边界场景。',
      points: [['表驱动', '每个用例有名字、输入和期望；失败信息包含实际与预期。'], ['HTTP', 'httptest.NewRecorder 记录响应；通过 Handler 检查状态、header 和 body。'], ['集成', '真实数据库测试使用独立测试库并清理；fake 通过不能证明 SQL 正确。']],
      language: 'go', example: 'func TestSumTo(t *testing.T) {\n    for _, tc := range []struct{ n, want int }{{0, 0}, {3, 6}} {\n        if got := SumTo(tc.n); got != tc.want {\n            t.Errorf("SumTo(%d)=%d, want %d", tc.n, got, tc.want)\n        }\n    }\n}', expected: '放在 *_test.go 并 import "testing"；运行 go test ./...。',
      pitfall: '覆盖率高不等于边界已覆盖；缺失记录、非法输入和跨用户操作需要明确用例。',
      recall: ['Handler 的 fake 测试通过，能证明数据库约束工作了吗？', '不能。还需要真实测试数据库上的集成测试验证约束、查询和清理。'],
      prerequisites: ['go-control'], lessonIds: ['go-06', 'go-15', 'go-16', 'go-17'], sourceIds: ['go-test']
    },
    {
      id: 'go-http', track: 'go', group: '接口与数据', level: 'applied', title: 'HTTP 契约与响应',
      summary: '先约定方法、路径、输入与输出，再写 Handler。',
      why: '前端与后端靠契约合作；客户端不能只猜某个字符串表示成功。',
      points: [['输入来源', '路径参数定位资源，query 表示筛选，body 提交结构化内容。'], ['状态码', '400 表示请求不合约定，404 表示资源未找到；成功也按操作选择状态。'], ['响应顺序', '先设置 Header，再写状态与 Body；第一次写 Body 可能隐式发送 200。']],
      language: 'go', example: 'mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {\n    w.Header().Set("Content-Type", "application/json; charset=utf-8")\n    w.WriteHeader(http.StatusOK)\n    _ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})\n})', expected: 'Go 1.22+ 的 ServeMux 注册片段；mux 需先创建，GET /health 返回 200 JSON。',
      pitfall: '写完响应 Body 后才改 Header 已经太晚；记录编码错误也别再次发送另一份响应。',
      recall: ['200、空数组和 404 应怎样区分？', '成功的空列表可以是 200 []；请求不存在的单条资源则按契约返回 404。'],
      prerequisites: ['go-errors', 'go-tests'], lessonIds: ['go-07', 'go-08', 'go-09', 'go-10', 'go-11'], sourceIds: ['go-http']
    },
    {
      id: 'go-sql', track: 'go', group: '接口与数据', level: 'applied', title: 'SQL、参数绑定与事务',
      summary: '数据库用约束保护数据；应用用参数化查询和事务表达正确操作。',
      why: '数据重启后保留，还要避免重复值、错误引用和半完成的写入。',
      points: [['约束', '主键、NOT NULL、UNIQUE、外键与 CHECK 分别限制不同的数据错误。'], ['参数绑定', '把值通过参数传入；PostgreSQL 常用 $1，MySQL 常用 ?，要匹配驱动。'], ['事务', '相关写入要么一起提交、要么一起回滚；同一事务内用 tx 调用。']],
      language: 'go', example: 'err := db.QueryRowContext(ctx,\n    "SELECT title FROM problems WHERE id = $1", id,\n).Scan(&title)\nif errors.Is(err, sql.ErrNoRows) { /* 按契约处理不存在 */ }', expected: 'PostgreSQL 存储层片段，需要已连接的 db、ctx、id、title 及相关导入。',
      pitfall: 'sql.Open 创建数据库句柄，不等于连接已经验证；使用 PingContext 和合适的超时。',
      recall: ['为什么把用户输入拼接到 SQL 字符串里不合适？', '输入可能改变 SQL 结构。参数绑定把值与 SQL 结构分开；动态列名仍需固定白名单。'],
      prerequisites: ['go-http'], lessonIds: ['go-12', 'go-13', 'go-14', 'go-17', 'go-25'], sourceIds: ['go-sql']
    },
    {
      id: 'go-design', track: 'go', group: '测试与工程', level: 'applied', title: '职责、配置与稳定分页',
      summary: 'HTTP 层翻译请求，业务层处理规则，存储层处理数据读写。',
      why: '换存储、测业务和定位错误时，只需要修改对应的职责。',
      points: [['依赖', '通过构造函数传入小接口，不让 HTTP 到处依赖数据库全局变量。'], ['配置', '启动时校验必需配置；日志记录请求与原因，避免输出密码、令牌和完整连接串。'], ['分页', '限制 limit 范围，明确默认值，使用含唯一字段的稳定排序。']],
      language: 'sql', example: '-- PostgreSQL：参数分别是每页数量与跳过数量\nSELECT id, title FROM problems\nORDER BY created_at DESC, id DESC\nLIMIT $1 OFFSET $2;', expected: 'created_at 并列时再按 id 排序；并发新增下 offset 分页仍可能出现跳动。',
      pitfall: '分层是职责边界，不是为了文件夹更多；简单练习无需先搭复杂框架。',
      recall: ['页码参数不合法，是 HTTP 层还是存储层决定返回 400？', 'HTTP 层负责把输入错误映射为响应；存储层不应直接依赖 ResponseWriter。'],
      prerequisites: ['go-sql', 'go-models'], lessonIds: ['go-18', 'go-19', 'go-20', 'go-21'], sourceIds: ['go-http', 'go-sql']
    },
    {
      id: 'go-auth', track: 'go', group: '安全与交付', level: 'project', title: '认证、归属与对象权限',
      summary: '认证回答是谁；权限检查回答这个人能不能操作这条记录。',
      why: '登录成功后仍必须保护每个用户的私人记录。',
      points: [['可信身份', '从已验证会话取得用户身份，不能信任 body 或 query 里的 owner_id。'], ['逐项保护', '列表、详情、创建、修改、删除都检查归属，默认拒绝没有权限的操作。'], ['验证范围', '密码用成熟哈希库；cookie、CSRF、会话过期需要结合实际认证方式验证。']],
      language: 'sql', example: '-- userID 必须来自已验证的身份上下文\nSELECT id, title FROM problems\nWHERE id = $1 AND owner_id = $2;', expected: '授权查询片段，只返回属于该用户的记录；它不是完整登录实现。',
      pitfall: '隐藏前端按钮不能代替服务端权限；CORS 也不等于认证或授权。',
      recall: ['用户 B 知道用户 A 的记录 id，服务器应该怎样验证？', '从 B 的可信会话取用户 id，查询或变更时检查对象归属；按约定拒绝并确保 A 的数据未变化。'],
      prerequisites: ['go-design'], lessonIds: ['go-22', 'go-23', 'go-24', 'go-25'], sourceIds: ['go-auth']
    },
    {
      id: 'go-concurrency', track: 'go', group: '安全与交付', level: 'applied', title: '并发、锁与取消',
      summary: 'goroutine 让任务并发；共享数据需要同步，等待需要退出条件。',
      why: 'HTTP 服务同时处理请求，不能让并发写 map 或慢请求破坏服务。',
      points: [['共享状态', '普通 map 不能无同步地并发读写；锁要保护完整的读改写操作。'], ['context', 'deadline 与取消是信号；被调用的操作要主动观察信号才能退出。'], ['检查工具', 'go test -race 可帮助发现实际执行路径上的竞争，不证明所有情况都安全。']],
      language: 'go', example: 'select {\ncase <-ctx.Done():\n    return ctx.Err()\ncase item := <-jobs:\n    _ = item // 继续处理任务；也要考虑 channel 关闭\n}', expected: '函数片段；ctx 取消或任务可用时离开等待，不会自动终止任意 goroutine。',
      pitfall: '启动 goroutine 后不等待结果、没有取消或退出条件，可能泄漏任务或提前结束程序。',
      recall: ['检查到记录存在后再加锁删除，为什么仍可能出错？', '检查与删除之间其他请求可能修改数据；把需要原子的读改写放在同一临界区。'],
      prerequisites: ['go-http'], lessonIds: ['go-11', 'go-26'], sourceIds: ['go-context', 'go-examples']
    },
    {
      id: 'go-delivery', track: 'go', group: '安全与交付', level: 'project', title: '复现、容器与交付证据',
      summary: '交付包括源码、配置说明、启动方式、测试结果与已知限制。',
      why: '从干净环境跑通，才能知道是否依赖了自己机器上没写进说明的东西。',
      points: [['可复现', '记录 go.mod 的工具链要求、依赖和配置示例；不要提交真实秘密与数据库目录。'], ['容器', 'Compose 容器之间用服务名访问；容器里的 localhost 指容器自己。'], ['CI', '自动检查格式、vet 与测试；数据库集成测试需要明确准备条件。']],
      language: 'shell', example: 'go fmt ./...\ngo vet ./...\ngo test ./...\n# 环境支持时，再执行\ngo test -race ./...', expected: '每条命令的结果都要实际记录；race 检测需受支持的平台与工具链。',
      pitfall: '容器能启动不证明接口可用；还要检查健康、持久化、权限和失败恢复。',
      recall: ['别人怎样知道一份 README 是可复现的？', '按启动说明在干净环境执行，再用明确请求验证响应；标注版本、配置与还未实现的功能。'],
      prerequisites: ['go-tests', 'go-auth', 'go-concurrency'], lessonIds: ['go-21', 'go-27', 'go-28'], sourceIds: ['go-test', 'go-examples']
    }
  ];
  const demo = body => '<!doctype html>\n<html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>练习起点</title>\n' + body + '\n</html>';
  const exercises = [
    {
      id: 'web-semantic', track: 'web', level: 'foundation', title: '把介绍页写出结构', minutes: 20, topicIds: ['web-files', 'web-html'], lessonIds: ['web-01', 'web-02'],
      goal: '做一张社团介绍页，让链接能定位内容，标题能表达结构。',
      task: '保留一个 h1，增加“活动”和“联系我们”两个 section；导航用锚点链接，信息图片提供 alt。先只写 HTML。',
      steps: ['画出内容层级，不先挑颜色。', '从下面的起点加上两个区域和导航。', '点击链接、按 Tab，确认能找到对应内容。'],
      checks: ['页面有一个清楚的主标题和两个二级标题。', '导航跳到对应 id；键盘可以操作链接。', '能解释 main、section 与 h2 为什么放在这些位置。'],
      cases: [['点击“活动”', '跳到活动区域，URL 带 #events'], ['只用 Tab 与 Enter', '可到达并激活导航链接'], ['图片无法加载', '替代文字仍表达信息']],
      stretch: '增加第二张详情页，用相对路径互相导航，再搬动目录检查链接。',
      language: 'html', starter: demo('<main>\n  <h1>周末编程社</h1>\n  <p>我们每周一起动手练习。</p>\n  <!-- 在这里补上导航与两个区域 -->\n</main>'), preview: true,
      run: '把代码保存为自己的 index.html，双击打开。也可点击演示起点，查看当前片段。', limitations: '起点只有内容；图片和另一个页面需要自己创建，不包含报名服务。'
    },
    {
      id: 'web-box', track: 'web', level: 'foundation', title: '亲手算一次卡片宽度', minutes: 15, topicIds: ['web-box', 'web-css'], lessonIds: ['web-03', 'web-04'],
      goal: '预测 content-box 与 border-box 的差别，再用浏览器核对。',
      task: '给下面两张卡片设置 width:200px、padding:12px、border:1px。仅让第二张使用 border-box，先写下两张卡片的预期外宽。',
      steps: ['按盒模型手算尺寸。', '给 .border 改 box-sizing。', '用 DevTools 测量边框尺寸并记录。'],
      checks: ['第一张边框外宽 226px，第二张 200px。', '能区分 padding、border 与 margin。', '加大 padding 后，可以预测两张卡片会怎样变化。'],
      cases: [['padding:12px，border:1px', 'content-box 为 226px，border-box 为 200px'], ['padding:20px', 'content-box 为 242px，border-box 仍为 200px'], ['增加 margin:10px', '边框宽度不变，外部占用空间增加']],
      stretch: '让两张卡片在 320px 容器内布局，找出放不下一行的原因。',
      language: 'html', starter: demo('<style>.card{width:200px;padding:12px;border:1px solid #706c65;margin-bottom:12px}</style>\n<div class="card">默认 content-box</div>\n<div class="card border">请改为 border-box</div>'), preview: true,
      run: '保存为 index.html 打开，在开发者工具中检查计算后的盒模型。', limitations: '演示没有自动评分；测量的是边框外宽，不包含 margin。'
    },
    {
      id: 'web-layout', track: 'web', level: 'foundation', title: '导航用 Flex，目录用 Grid', minutes: 30, topicIds: ['web-flex', 'web-grid'], lessonIds: ['web-05', 'web-06', 'web-08'],
      goal: '把一维导航与二维卡片目录分别排好。',
      task: '导航横向排列且允许换行；卡片使用 Grid 自动分列。保留 gap，在每张卡里放长度不同的标题。',
      steps: ['先只改导航的 display:flex 与对齐。', '再给 cards 定义列与间隔。', '改变宽度与内容，观察收缩和换行。'],
      checks: ['导航有可解释的主轴与交叉轴。', '卡片列数能随可用宽度变化。', '长标题不把相邻列撑出容器。'],
      cases: [['宽度 320px', '导航可换行，卡片可以单列'], ['宽度 900px', '卡片可多列，间隔一致'], ['添加 60 个连续字符', '内容换行，页面不横向滚动']],
      stretch: '增加筛选工具栏，再解释哪些地方不需要 Grid。',
      language: 'html', starter: demo('<style>nav{display:flex;gap:12px;flex-wrap:wrap}.cards{margin-top:16px}.card{padding:16px;background:#f2f0e9;margin-bottom:8px}</style>\n<nav><a href="#cards">活动目录</a><a href="#cards">我的收藏</a></nav>\n<section id="cards" class="cards"><article class="card">HTML 入门</article><article class="card">第一次写 Go</article><article class="card">一起查一个布局错误</article></section>'), preview: true,
      run: '保存为 index.html，用开发者工具切换视口并调整样式。', limitations: '初始片段只给 Flex 导航；Grid 需要自己完成，链接是本页演示。'
    },
    {
      id: 'web-mobile', track: 'web', level: 'applied', title: '用长内容验收手机页面', minutes: 25, topicIds: ['web-responsive', 'web-grid'], lessonIds: ['web-09', 'web-11', 'web-14'],
      goal: '让布局接受小屏、长文字和缩放，而不只接受短示例。',
      task: '用自己的招新页，加入长活动名、长链接和多张卡片。分别检查 320、375、768px，定位每个超宽元素再修复。',
      steps: ['先截图记录哪个宽度出问题。', '检查固定宽度、图片与 min-width。', '修一处后重放全部视口。'],
      checks: ['三个视口都没有页面横向滚动。', '正文、链接与表单仍可阅读和操作。', '记录根因与具体修复，不靠隐藏内容完成验收。'],
      cases: [['320px + 超长链接', '链接可换行且内容完整'], ['200% 浏览器缩放', '主要内容与按钮仍可到达'], ['图片大于容器', '图片不撑开布局']],
      stretch: '补测 414px 和横屏；仅用键盘走完导航与表单。',
      language: 'html', starter: demo('<style>main{max-width:720px;padding:16px;box-sizing:border-box}p{overflow-wrap:anywhere}</style>\n<main><h1>活动目录</h1><p>加入你自己的长标题与长链接，然后缩窄窗口。</p></main>'), preview: true,
      run: '在自己的页面或这个起点上修改，用 DevTools 设备模拟与浏览器缩放验证。', limitations: '模拟视口不能替代所有真实设备；需要保留实际观察到的问题。'
    },
    {
      id: 'web-form', track: 'web', level: 'applied', title: '做一个可用键盘填写的表单', minutes: 25, topicIds: ['web-forms', 'web-dom'], lessonIds: ['web-12'],
      goal: '完成标签、校验与本地反馈，并明确数据还没有发送。',
      task: '增加姓名输入、邮箱输入与同意说明；用 label 关联控件。提交时先本地检查，结果区只说明“本地检查通过”。',
      steps: ['先写可见标签与原生输入类型。', '不碰鼠标，用 Tab、Space、Enter 操作。', '补上成功与无效输入的文字反馈。'],
      checks: ['空邮箱与明显无效格式不能通过。', '标签可以聚焦对应输入，焦点清楚可见。', '结果没有声称已报名或保存到服务器。'],
      cases: [['空邮箱提交', '浏览器提示必填'], ['输入 name@example.com', '本地检查通过，明确尚未发送'], ['只用键盘', '能填写、选择并提交']],
      stretch: '让错误文字与输入通过 aria-describedby 关联，再接真实接口时重新设计反馈。',
      language: 'html', starter: demo('<form id="signup"><label for="email">邮箱</label> <input id="email" type="email" required><button>本地检查</button></form>\n<p id="feedback" role="status"></p>\n<script>document.querySelector("#signup").addEventListener("submit",event=>{event.preventDefault();document.querySelector("#feedback").textContent="本地检查通过，尚未发送到服务器。"});</script>'), preview: true,
      run: '保存为 index.html 直接打开；不需要服务端，练习不发送输入。', limitations: '只有邮箱与本地反馈的演示；姓名、同意说明及可访问错误提示需要自己补。'
    },
    {
      id: 'web-data', track: 'web', level: 'foundation', title: '先写纯函数，再接页面', minutes: 25, topicIds: ['web-js'], lessonIds: [], followup: 1,
      goal: '筛选短练习，得到标题列表与总时长；把计算和显示分开。',
      task: '实现 selectShort(items, maxMinutes)，返回不超过上限的项目。再用返回结果统计总时长；明确等于上限、空数组与非法上限的规则。',
      steps: ['先写出三个输入与预期。', '实现过滤函数，保持原数组不变。', '把结果写进 pre 的 textContent。'],
      checks: ['20 和 30 分钟在上限 30 时都保留。', '空数组返回空列表，总时长为 0。', '原始数组不被排序或删除元素。'],
      cases: [['[20,30,40]，上限 30', '保留前两项，总时长 50'], ['[]，上限 30', '空列表，总时长 0'], ['上限 "abc"', '按自己写明的约定拒绝，不能默默当作 0']],
      stretch: '增加难度筛选与稳定排序，给每项分配 id 而不用标题当主键。',
      language: 'html', starter: demo('<pre id="result"></pre>\n<script>const items=[{title:"HTML",minutes:20},{title:"Go",minutes:40}];const titles=items.map(item=>item.title);document.querySelector("#result").textContent=JSON.stringify(titles,null,2);</script>'), preview: true,
      run: '保存为 index.html 打开，或把计算部分放到浏览器 Console。', limitations: '起点只演示 map 与显示，不包含筛选函数与输入校验。'
    },
    {
      id: 'web-filter', track: 'web', level: 'applied', title: '把搜索、筛选与数量连起来', minutes: 40, topicIds: ['web-js', 'web-dom'], lessonIds: [], followup: 1,
      goal: '从同一份数据推导活动列表、数量与空结果，让多个控件保持一致。',
      task: '使用配套活动搜索起点，先确认关键词搜索，再增加分类筛选与清空按钮。组合条件同时生效，空结果单独显示。',
      steps: ['先运行起点，读清数据、筛选函数和 render。', '把分类值作为第二个筛选条件。', '清空时同时更新控件、列表与数量。'],
      checks: ['关键词前后空格不会阻止匹配。', '关键词与分类同时筛选，数量等于可见项目数。', '无匹配时显示空结果，清空后恢复全部。'],
      cases: [['关键词 "  go  "', '只显示 Go 活动，忽略大小写与外部空格'], ['关键词 "火星"', '显示没有匹配活动，数量为 0'], ['输入 "<b>"', '按普通文字搜索，不解析成标签']],
      stretch: '用 URLSearchParams 保存筛选到地址栏，让刷新与分享还原筛选。',
      language: 'javascript', starter: 'function filterItems(items, keyword) {\n  const query = keyword.trim().toLowerCase();\n  return items.filter(item => item.title.toLowerCase().includes(query));\n}', preview: false, files: 'exercises/web/activity-filter/',
      run: '打开配套目录中的 index.html 即可运行；README 有完整操作与验收步骤。', limitations: '起点包含关键词搜索；分类与重置待练习，没有后端、账号或持久化。'
    },
    {
      id: 'web-request', track: 'web', level: 'applied', title: '把 404、空数据与坏 JSON 都跑一遍', minutes: 40, topicIds: ['web-fetch', 'web-dom'], lessonIds: [], followup: 1,
      goal: '通过真实本地请求验证加载、成功、空结果与失败。',
      task: '运行请求状态练习，分别请求活动数组、空数组、不存在文件与坏 JSON。观察四种界面，再补上数据字段校验和重试。',
      steps: ['在练习目录启动 HTTP 服务，不用 file://。', '逐个选择场景，记录状态码与页面反馈。', '断网后重试，比较网络失败与 HTTP 失败。'],
      checks: ['404 进入失败状态，不当成成功或空结果。', '[] 进入空结果，坏 JSON 进入解析失败。', '加载结束后控件恢复可用，不泄漏上一次的结果。'],
      cases: [['items.json', '200，显示活动标题'], ['empty.json', '200，显示空结果'], ['missing.json / invalid.json', '分别显示 HTTP 404 / JSON 解析错误']],
      stretch: '支持 AbortController 和最新请求标记；慢响应不能覆盖新选择。',
      language: 'javascript', starter: 'const response = await fetch("./items.json");\nif (!response.ok) throw new Error(`HTTP ${response.status}`);\nconst items = await response.json();\n// 放在 async 函数中；继续校验形状并更新界面。', preview: false, files: 'exercises/web/request-states/',
      run: '在配套练习目录执行 python -m http.server 8751，再访问 http://localhost:8751/。', limitations: '只请求同目录的演示数据，基础版暂不处理并行请求；静态服务也不保存数据。'
    },
    {
      id: 'web-go-project', track: 'web', level: 'project', title: '让页面与 Go API 使用同一份契约', minutes: 60, topicIds: ['web-fetch', 'web-quality'], lessonIds: ['web-14'], followup: 8,
      goal: '把已有网页接到自己的记录 API，并保存一次正常与一次失败联调的证据。',
      task: '先约定 GET /problems 的 JSON 字段、状态码与错误格式；用本机 Go 服务返回数据，让网页显示标题、数量、加载和失败。先做读取，不一次写完整全栈。',
      steps: ['用 curl 独立验证后端响应。', '决定同源代理或允许指定开发来源的 CORS 方案。', '页面连接后关闭后端，验收失败反馈。'],
      checks: ['契约、实际响应与页面字段一致。', '能解释前端地址、后端地址与跨来源条件。', '失败时保留错误反馈，README 写清启动两端的方法。'],
      cases: [['200 + 合法数组', '显示记录并正确统计'], ['200 + []', '显示空列表'], ['后端不可达', '显示失败与重试，不声称已加载']],
      stretch: '增加创建记录；只在真实收到成功响应后显示创建成功，并补服务端输入验证。',
      language: 'json', starter: '[{"id":1,"title":"两数之和","solved":false}]', preview: false,
      run: '按自己的 Go 项目 README 启动 API，网页通过本地 HTTP 服务访问；此处只提供契约例子。', limitations: '这是待实现的联调任务，不提供现成 CRUD 服务；站内隔离预览不能请求外部 API。'
    },
    {
      id: 'go-score', track: 'go', level: 'foundation', title: '给分数统计写明边界', minutes: 25, topicIds: ['go-tools', 'go-control', 'go-tests'], lessonIds: ['go-02', 'go-06'],
      goal: '用 Go 接受一组分数，返回平均值或错误，不把空输入当作零分。',
      task: '实现 Average(scores []int) (float64, error)，允许 0–100，拒绝空数组和越界分数。先把正常、零分与非法输入写成测试表。',
      steps: ['在独立目录建立 go.mod 与 main.go。', '先写循环求和，注意整数转浮点的时机。', '把无输入与越界规则加进测试。'],
      checks: ['[60,80] 得到 70；[0] 得到 0 且无错误。', '[]、[-1]、[101] 返回错误。', '能解释为什么用两个返回值。'],
      cases: [['[60,80]', '70，nil'], ['[0]', '0，nil'], ['[] / [-1] / [101]', '非 nil error']],
      stretch: '增加最大值、最小值与及格数量，不把空数组的统计伪装成有效结果。',
      language: 'go', starter: 'package main\n\nimport "fmt"\n\nfunc main() {\n    scores := []int{60, 80}\n    total := 0\n    for _, score := range scores { total += score }\n    fmt.Println(float64(total) / float64(len(scores)))\n}', preview: false,
      run: '在自己的独立练习目录初始化模块，保存 main.go 后 go run .；添加测试后 go test ./...。', limitations: '起点只计算固定的非空输入，没有 Average 与错误检查，不能直接用于任意输入。'
    },
    {
      id: 'go-wordfreq', track: 'go', level: 'foundation', title: '词频统计与确定的排序', minutes: 35, topicIds: ['go-collections', 'go-tests'], lessonIds: ['go-03', 'go-06'],
      goal: '用 map 计数、切片排序；次数并列时仍得到可重复的结果。',
      task: '运行配套词频例子和测试，解释每一步。再扩展为 TopN，处理 n=0、n 超过词数与负数，并补充测试。',
      steps: ['先跑 go run . 和 go test ./...。', '读 Count：Fields 分词、ToLower、map 计数、排序。', '合上参考，实现 TopN 并写并列与空输入用例。'],
      checks: ['空输入返回空列表。', '“Go go WEB”得到 go:2、web:1。', '相同次数按词的字典序排列，输出可重复。'],
      cases: [['Go go WEB', 'go:2 在 web:1 前'], ['b a', 'a:1 在 b:1 前'], ['空白字符串', '空列表']],
      stretch: '先写清标点与中文分词规则，再加入清洗；不能把按空白拆分称为中文分词。',
      language: 'go', starter: 'counts := make(map[string]int)\nfor _, word := range strings.Fields(text) {\n    counts[strings.ToLower(word)]++\n}\n// 转为切片；按次数降序、词典序升序排序。', preview: false, files: 'exercises/go/wordfreq/',
      run: '在配套目录执行 go run . 与 go test ./...，已有 go.mod 不需再次初始化。', limitations: '参考例子按空白分词，标点保留；只做大小写归一化，不做语言学分词。'
    },
    {
      id: 'go-model', track: 'go', level: 'foundation', title: '修改结构体，再看 JSON', minutes: 20, topicIds: ['go-models'], lessonIds: ['go-04'],
      goal: '区分副本修改与原对象修改，并让 JSON 字段符合约定。',
      task: '定义 Problem 的 Title 与 Solved，写指针方法 MarkSolved。分别在调用前后编码 JSON，再改成值接收者对照结果。',
      steps: ['先预测两个版本的 Solved。', '编码并实际比较输出。', '加入未导出字段，再解释为什么没有出现在 JSON。'],
      checks: ['指针方法能改变原对象的 Solved。', 'JSON 使用 title、solved 两个键。', '能解释值接收者的副本行为。'],
      cases: [['初始对象', 'solved 为 false'], ['指针方法后', 'solved 为 true'], ['只在值副本内赋值', '原对象仍为 false']],
      stretch: '分开创建请求 DTO 与输出模型，禁止客户端决定 owner_id。',
      language: 'go', starter: 'package main\nimport ("encoding/json"; "fmt")\ntype Problem struct { Title string `json:"title"`; Solved bool `json:"solved"` }\nfunc main() {\n    p := Problem{Title: "两数之和"}\n    data, err := json.Marshal(p)\n    if err != nil { panic(err) }\n    fmt.Println(string(data))\n}', preview: false,
      run: '在独立模块目录保存 main.go，执行 go fmt ./... 和 go run .。', limitations: '起点只有编码；MarkSolved 与对照验证需要自己添加。'
    },
    {
      id: 'go-json', track: 'go', level: 'applied', title: 'JSON 解析后还要验证什么', minutes: 30, topicIds: ['go-errors', 'go-http'], lessonIds: ['go-10'],
      goal: '为创建接口定义严格的输入边界，拒绝格式错误与业务错误。',
      task: '在已有 Handler 中限制 Body，拒绝未知字段、空白标题与第二个 JSON 值。正常输入才继续调用业务层。',
      steps: ['列出接受的字段和标题长度约定。', '分别测试坏语法、坏字段与坏业务值。', '检查失败路径没有创建任何记录。'],
      checks: ['坏 JSON、未知字段、连续两个 JSON 都返回约定的 400。', '超限请求按契约返回 413 或明确的错误状态。', '正常输入只创建一次，空白标题不写入存储。'],
      cases: [['{"title":"练习"}', '接受，创建一次'], ['{"title":"   "}', '400，不写入'], ['{"title":"a"} {"title":"b"}', '400，不写入']],
      stretch: '区分语法、类型与字段错误，返回稳定的错误格式，再写 HTTP 测试。',
      language: 'go', starter: 'r.Body = http.MaxBytesReader(w, r.Body, 4096)\ndec := json.NewDecoder(r.Body)\ndec.DisallowUnknownFields()\n// 第一次 Decode 到 DTO，验证字段，再确认第二次 Decode 是 io.EOF。', preview: false,
      run: '在自己已有 Go HTTP 项目中编写 Handler，用 httptest 或 curl 验证；片段不能单独 go run。', limitations: '这里只给边界骨架，需要补 DTO、状态映射与完整错误处理。'
    },
    {
      id: 'go-health', track: 'go', level: 'applied', title: '用测试读懂 /health 与 /add', minutes: 35, topicIds: ['go-http', 'go-tests'], lessonIds: ['go-07', 'go-09', 'go-16'],
      goal: '同时验证真实请求和 httptest，核对完整响应而不只看状态码。',
      task: '运行配套 HTTP 例子，检查 /health、/add?a=2&b=3 与非法参数。再增加 /multiply；先为它写契约和边界测试。',
      steps: ['go test ./...，读懂请求与响应断言。', 'go run .，用 curl.exe 访问两个接口。', '加新路由前先列缺参数、非数字与错误方法。'],
      checks: ['/health 返回 200 与 status=ok 的 JSON。', '/add 正常返回 sum=5，缺参数和非数字为 400。', '错误方法按约定拒绝；响应声明 JSON Content-Type。'],
      cases: [['GET /add?a=2&b=3', '200，{"sum":5}'], ['GET /add?a=x&b=3', '400，稳定 JSON 错误'], ['POST /add', '405']],
      stretch: '给错误方法也返回统一 JSON，为新增 /multiply 写负数、小数、结果溢出与重复参数的测试。',
      language: 'shell', starter: 'go test ./...\ngo run .\n# 另开终端\ncurl.exe http://127.0.0.1:8752/health\ncurl.exe "http://127.0.0.1:8752/add?a=2&b=3"', preview: false, files: 'exercises/go/http-basics/',
      run: '配套目录已有独立模块；执行 go run . 启动 127.0.0.1:8752，Ctrl+C 停止。', limitations: '参考例子只有健康和加法，无数据库、账号与 CRUD；405 使用标准库默认响应。'
    },
    {
      id: 'go-crud', track: 'go', level: 'applied', title: '给内存 CRUD 写一组契约测试', minutes: 50, topicIds: ['go-http', 'go-concurrency'], lessonIds: ['go-08', 'go-10', 'go-11', 'go-16'],
      goal: '用真实的创建、读取、修改、删除流程验证记录生命周期。',
      task: '在自己的 API 中完成 POST/GET/PATCH/DELETE /problems。用测试创建一条记录并使用返回 id，验证删除后读取为 404；把共享状态正确同步。',
      steps: ['写出每个方法的状态码、输入与输出。', '先让创建到读取跑通，再加修改与删除。', '每个测试重建自己的 handler 与 store。'],
      checks: ['创建返回新 id，读取内容与输入一致。', '修改只改变允许的字段；删除后无法读取。', '用例互不依赖执行顺序，缺失 id 和非法 body 有测试。'],
      cases: [['创建→读取→修改', '同一 id 的内容按约定改变'], ['删除→读取', '删除成功，读取为 404'], ['并发读写', '同步正确；受支持环境用 -race 验证']],
      stretch: '定义小存储接口并提供 fake，随后把实现替换成 PostgreSQL，复用 HTTP 契约测试。',
      language: 'json', starter: '{"title":"两数之和","solved":false}', preview: false,
      run: '在已有课程 API 中完成；先 go test ./...，环境支持时 go test -race ./...。', limitations: '这是待实现任务；内存数据重启会丢失，不能声称持久化。'
    },
    {
      id: 'go-database', track: 'go', level: 'applied', title: '让数据库拒绝错误的数据', minutes: 45, topicIds: ['go-sql', 'go-tests'], lessonIds: ['go-12', 'go-13', 'go-14', 'go-17'],
      goal: '让约束、参数化查询和事务在独立测试库中接受实际验证。',
      task: '建一个练习用表，验证空白标题、重复值与合法插入。用 Go 参数化查询读取；执行一次事务中途失败并检查没有半份结果。',
      steps: ['只使用专门的练习或测试数据库。', '先在 SQL 客户端验证约束，再写 Go 存储方法。', '测试回滚与重启读取，记录真实结果。'],
      checks: ['空白标题违反 CHECK，重复标题违反 UNIQUE。', '包含单引号的标题可作为参数正常保存。', '失败事务没有留下第一步的写入，测试可以重复运行。'],
      cases: [['title="   "', '约束拒绝'], ['title="Alice\'s note"', '参数绑定正常处理'], ['第二次同名插入', 'UNIQUE 拒绝；其他事务不受污染']],
      stretch: '把标题唯一规则改为 (owner_id,title)，并为两个用户同名记录写测试。',
      language: 'sql', starter: 'CREATE TABLE practice_problems (\n  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  title TEXT NOT NULL UNIQUE CHECK (length(trim(title)) > 0)\n);', preview: false,
      run: '在自己准备的 PostgreSQL 测试库运行建表；Go 项目配置对应驱动与测试连接，再执行集成测试。', limitations: '需要单独安装或启动 PostgreSQL；不提供数据库凭据，不自动创建或修改数据库。'
    },
    {
      id: 'go-ownership', track: 'go', level: 'project', title: '用 A / B 两个用户攻击自己的接口', minutes: 50, topicIds: ['go-auth', 'go-design'], lessonIds: ['go-22', 'go-23', 'go-24', 'go-25'],
      goal: '证明服务端逐个检查对象归属，而不是只让前端隐藏按钮。',
      task: '在自己的认证 API 中，用 A 创建记录，让 B 猜 id、伪造 owner_id 并尝试详情、修改、删除。写成测试并确认 A 的原数据不变。',
      steps: ['准备两个独立用户和已验证会话。', '分别测试列表、详情、修改、删除。', '注销或让会话过期，再重放请求。'],
      checks: ['B 不能读写 A 的私有记录，也不能在列表看到它。', 'body 中伪造 owner_id 不改变可信身份。', '失效会话被拒绝，A 的数据完整。'],
      cases: [['B GET /problems/{A的id}', '按契约拒绝且不泄露内容'], ['B PATCH /problems/{A的id}', '拒绝；A 的标题不变'], ['未登录请求私有数据', '401']],
      stretch: '对授权失败、会话过期和资源不存在分别记录证据，检查日志没有令牌或密码。',
      language: 'text', starter: 'A 创建 → 保存返回 id\nB 读取 / 修改 / 删除这个 id → 应被拒绝\nA 再读取 → 数据仍完整\nB 伪造 owner_id → 身份仍来自已验证会话', preview: false,
      run: '在已有认证项目的测试环境中执行，可使用 HTTP 测试或两个独立客户端；此处没有现成认证服务。', limitations: '完成这些用例不等于全面安全审计；密码、CSRF 和会话策略还需按实际实现验证。'
    },
    {
      id: 'go-cancel', track: 'go', level: 'project', title: '让等待响应取消，而不是一直卡住', minutes: 30, topicIds: ['go-concurrency', 'go-delivery'], lessonIds: ['go-26', 'go-28'],
      goal: '用实际取消信号结束等待，并在受支持的环境检查共享数据竞争。',
      task: '运行下面的完整例子，解释为什么先输出 deadline exceeded。再封装 Wait(ctx, delay) 并测试提前取消与正常完成。',
      steps: ['先预测 20ms deadline 与 1s 工作谁先结束。', '运行后将工作时间改为 1ms。', '测试用显式 cancel 触发取消，不用依赖紧张的时间阈值。'],
      checks: ['取消或超时返回 ctx.Err()，不会一直等待。', '正常完成分支可达；及时停止计时器。', '能说明 context 不会强制杀死任意 goroutine。'],
      cases: [['先调用 cancel()', '返回 context.Canceled'], ['工作先完成', '返回 nil'], ['deadline 先到', '返回 context.DeadlineExceeded']],
      stretch: '把 context 传到真实存储调用，并为 HTTP 服务加可验证的优雅退出。',
      language: 'go', starter: 'package main\nimport ("context"; "fmt"; "time")\nfunc main() {\n    ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)\n    defer cancel()\n    timer := time.NewTimer(time.Second)\n    defer timer.Stop()\n    select {\n    case <-ctx.Done(): fmt.Println(ctx.Err())\n    case <-timer.C: fmt.Println("完成")\n    }\n}', preview: false,
      run: '在独立模块目录保存 main.go，执行 go run .；实现 Wait 后增加 go test ./...。', limitations: '示例只演示可取消等待；没有启动 HTTP 服务，也没有实际数据库超时。'
    }
  ];
  const milestones = {
    'web-start': { outcome: '一张自己写的社团首页', evidence: '从空白重建；说明标题、路径、盒模型与 Flex 的选择。', exerciseIds: ['web-semantic', 'web-box', 'web-layout'] },
    'web-layout': { outcome: '手机可读、键盘可用的招新页', evidence: '留下多视口截图，完成表单、焦点与长内容检查。', exerciseIds: ['web-mobile', 'web-form'] },
    'go-language': { outcome: '小函数、测试与第一个 HTTP 响应', evidence: '正常与非法输入都有结果；解释请求怎样进入 Handler。', exerciseIds: ['go-score', 'go-wordfreq', 'go-health'] },
    'go-crud': { outcome: '重启后仍可读取的记录 API', evidence: '完成 CRUD 契约，实际验证持久化与失败事务。', exerciseIds: ['go-json', 'go-crud', 'go-database'] },
    'go-quality': { outcome: '别人按 README 也能运行的后端', evidence: '留下单元、HTTP、数据库测试结果，明确配置与分页边界。', exerciseIds: ['go-health', 'go-database'] },
    'go-delivery': { outcome: '有用户隔离与交付说明的项目', evidence: 'A / B 两用户测试、取消与退出检查、干净环境复现。', exerciseIds: ['go-ownership', 'go-cancel'] }
  };
  window.LEARNING_LAB = { version: 1, reviewedAt: '2026-10-13', sources, topics, exercises, milestones };
})();
