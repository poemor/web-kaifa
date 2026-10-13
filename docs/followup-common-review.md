# Web 后续共同基础 00–02：内容与运行自审

日期：2026-10-13。审查对象为新补充的 docs/followups/web-00.md、web-01.md、web-02.md 与 exercises/web/followup-00、01、02。材料原文未修改；本报告不更新用户学习进度。

## 先说明实际验证范围

Playwright / Edge独立上下文实跑66项通过；Node npm ci与npm test实际通过，测试1项内包含静态200、API搜索与空结果、400、404、405、文件白名单断言；在.qa独立新建的临时Git仓库实跑4项通过。没有安装系统Git/Node/Figma，没有使用真实账号创建PR或新Pages站；远程步骤依据2026-10-13官方文档核验，本课配套中的远程命令是教学，不是自动操作。

66项检查包括00–02各320/360/768/1440px无溢出；00四卡实际1/1/1/3列、横竖图加载、label关联、全空格校验、表单不导航；素材页所有图片实际加载，PNG实际下载，PNG头96×96且RGBA、解码后角落alpha=0；01未请求/加载中/成功/空数据/失败、搜索2项/分类1项、收藏刷新保留、安全文本显示、404/坏JSON/错误JSON结构、坏localStorage逐字保留、重建撤销精确恢复、网络失败重试、存储被禁仍可阅读及内存收藏；02真实本机API200/POST405、搜索Enter与失败恢复。26个完整文件代码块与磁盘文件逐字一致；01四组独立Console例子的实际输出全部核对，包括闭包与异步A/B/C顺序。浏览器无未捕获pageerror。

Git4项是在独立临时目录执行init/add/commit、工作区与暂存区不同版本diff、分支与快进合并、revert恢复文件且保留历史。未修改本仓库Git身份、分支或远程地址，也没有为课堂演示上传内容。运行时Node版本26.7.0；教程建议受支持LTS，未声称已逐个测试所有LTS版本。

临时证据：.qa/followup-common-test-results.json、.qa/followup-common-git-results.json与透明PNG。复跑入口（本机项目依赖已有Playwright，静态服务器8743从仓库根启动）为node .qa/test-followup-common.cjs和node .qa/test-followup-common-git.cjs；这些是本次工程QA，不要求零基础学习者安装Playwright。持久配套自身的运行与验证见各自README，02实际测试文件server.test.cjs已随配套保留。

## 00：原11项逐点覆盖

| 原知识点 | 具体正文与可执行操作 | 证据与边界 |
| --- | --- | --- |
| Flexbox进阶 | “Flex处理一排”解释主/交叉轴、grow/shrink/basis，给600px分配数值；表单字段伸缩与按钮固定 | 320–1440表单无溢出；换wrap、grow实验是用户跟做步骤 |
| Grid双维布局 | “Grid处理行列”从里读repeat/auto-fit/minmax/min/fr，算952px容器三列，第四/五卡不手调 | 真实computed列数1/1/1/3，正文修正为与实际16rem一致 |
| 定位与层级 | “定位与z-index”逐项解释流、参照、sticky容器、fixed与嵌套上下文；角标、页眉、回顶部 | 源码实际包含四类定位；层级改值实验写清恢复，未宣称跨全部浏览器实测 |
| 媒体查询 | “断点、图片、变量与阅读”移动优先48rem并排，说明依据内容不是型号；独立断点练习 | 实际360/768/1440与320布局可用 |
| 图片呈现 | 横竖本地SVG，aspect-ratio/cover/contain/object-position、尺寸属性与网络大小分别解释 | 两种比例所有img自然尺寸实际非0，无拉伸算法设置 |
| CSS变量 | root变量作用域与继承、三区域复用、主题色变换后检查对比 | 源码var复用并真实渲染，颜色替换为教学实验 |
| 交互状态 | hover/focus-visible/disabled区别，报名按钮真实disabled，键盘巡检 | 源码可见轮廓与真实禁用；不伪造报名 |
| 表单与语义 | label/input关联、button默认行为、required与trim、preventDefault和旧反馈失效 | 点击label聚焦，合法表单不导航，全空格被拒 |
| 无障碍基础 | 标题层级、语义区域、alt、details/summary、键盘焦点、状态文本、200%检查步骤 | 程序采用原生控件；200%与真实辅助技术留作人工验收，不虚报已完成 |
| 开发者工具调试 | 1200px溢出、图片大小写404、label错配三种故意失败，Elements/Computed/Network定位 | 代码结构与路径已实跑；故障步骤不掩盖为overflow隐藏 |
| 网页可读性 | 65ch并非严格65个汉字、1rem与1.7行高、段/行、长标题/英文与缩放 | 真实长标题及英文四宽无横向溢出 |

用户新增素材教学另设主章节：正确HTML img与SVG image/href；CSS/矢量/像素格式选择；viewBox坐标、rect/path/circle、fill/stroke、透明背景；原图→统一配色/圆角/留白的两份自绘插画；外部SVG与内联currentColor区别；PNG2x导出完整可运行页面；分辨率/cover/alt/路径/404；本地许可来源记录；Figma可选导出官方步骤。配套有wide.svg、tall.svg、calendar.svg、poster-before.svg、poster-after.svg五份自绘SVG和assets.html。没有引用授权未知照片或外部图床。

## 01：原12项逐点覆盖

| 原知识点 | 具体正文与可执行操作 | 证据与边界 |
| --- | --- | --- |
| JS与C++区别 | “变量、类型与比较”不设C++前提，let/const可改对象、undefined/null、真值、==/===、Number/字符串 | Console四组比较/拼接/空值实际输出核对 |
| 对象与数组 | “对象、数组与纯函数”filter/map/find/sort及不改变原始顺序 | 独立Console返回标题、未找到与排序前后id；主搜索算法2项Web1项 |
| 函数与作用域 | “函数、作用域与闭包”return与日志不同、局部与回调访问、两个计数器 | 1/2/1输出实际核对，纯函数练习含null/错误类型 |
| DOM查询和更新 | “DOM与事件”对象树、null/defer、createElement/textContent/append/replaceChildren | 3项由JS建立；不可信标题无b节点 |
| 事件机制 | 同章target/冒泡/closest/contains/data-id，父列表委托；渲染后焦点恢复 | 收藏切换与刷新恢复真实通过；span变式给解释 |
| 表单处理 | 字符串trim与最大长度、空关键词/全空格不同、submit防导航、改条件后提示尚未应用 | 空格错误、正常应用筛选与空结果通过 |
| JSON | “JSON与存储”对象vs文本、parse语法vs结构、合法错误对象/重复id/字段类型 | broken.json语法错与wrong.json结构错都能恢复 |
| 本地持久化 | 收藏ID版本记录、同源端口隔离、坏记录保留、导出/明确重建/一次撤销 | 刷新收藏保留；坏值未自动覆盖；重建撤销逐字相同；被禁降级可用 |
| 异步的原因 | “Promise、async和请求五状态”未来结果、await不冻结、try/catch必须await、A/B/C42 | Console实际顺序A/B/C42 |
| fetch与状态 | idle/loading/success/empty/error，筛选无结果独立表达；response.ok、解析、8秒Abort、finally/请求编号 | 加载disabled、3数据、空数组、HTTP404、结构/语法失败、连接失败恢复通过；8秒超时有实现，未单独等待实测 |
| 错误定位 | Sources断点变量、拼写ReferenceError、Network路径404与200坏JSON三故障 | 故障教学逐层定位，真实失败夹具运行通过 |
| 基础安全习惯 | 外部标题仅textContent、编号/结构白名单，存储不放密码，AI问题不贴隐私 | 尖括号原样显示，没有可执行b/HTML节点 |

## 02：原12项逐点覆盖

| 原知识点 | 具体正文与可执行操作 | 证据与边界 |
| --- | --- | --- |
| 终端基础 | “安装与路径”pwd/ls与cmd cd/dir、cd ..、含空格路径、绝对/相对、ENOENT核对目录 | 所有本机命令在独立练习目录执行；一次QA错目录已修正后重跑，不混作产品故障 |
| Git三层概念 | “Git工作区/暂存区/提交”保存≠提交，status/add/commit/log/diff/cached、v2/v3实验 | 本地临时Git库实际快照差异通过 |
| GitHub合作 | “分支、PR与合并”建立自己空仓库、核对origin、浏览器认证、功能分支、base/compare/Files changed、合并/pull | 分支/快进合并本地实跑；PR界面按官方步骤核验，未远程操作 |
| README | “性能、手测、README与交接”用途/环境/启动/功能/截图/边界/在线地址/故障记录 | 配套README运行命令可用，未伪造同学/手机截图 |
| npm和package.json | 字段/scripts/dependencies/devDependencies/private与Git可见性不同、锁文件、ci/install、PowerShell npm.cmd | npm ci、npm test实际通过；无node_modules提交 |
| API与数据流 | “Network”逐部分拆URL/查询/方法/头/体/Response；静态数组vsAPI对象；GET与POST405 | 真实API200/筛选及POST405；npm test含400/404；完整ConsolePOST实跑 |
| 基础浏览器测试 | 输入/点击/刷新/键盘/多个宽度的验收表，不以一条绿色替代用户流程 | 4宽度、Enter搜索、网络恢复实际通过；真实手机留人工 |
| 边界与异常 | 空数组、150字标题、全空格、Offline/恢复、HTTP状态与500服务器失败解释 | 全空格/空结果/请求失败恢复运行；服务器捕获本地文件错，未伪装成功 |
| 性能常识 | Network Size/Transferred/Duration、原图像素与CSS宽度不同、避免每按键请求、本地内存筛选 | 静态作品无重型依赖；不宣称真实性能基准提速 |
| 静态部署 | Pages Source main root真实步骤，Actions日志、真实URL、./vs/、大小写、静态不运行Node/DB | 网页只fetch相对JSON，本机API不写入生产路径；用户新练习站未发布 |
| 版本与回退 | practice分支坏提交、revert --no-edit HEAD、diff/log核对，与reset/强推风险区别 | revert实际恢复文件、历史仍含坏提交与Revert |
| 调试记录 | 路径404/空数据/Offline三故障，六要素Bug与具体Pages根路径例子 | 网络错误重試可恢复，记录与症状对应，不只写“刷新正常” |

## 自审后修正与还需交叉审查的点

自审把00卡片最小宽度改16rem并核对正文数值，明确768px“整体两列、活动单列”；资料不会把auto-fit列数写成固定设备结论。02教学服务器补捕获本地资源异常，避免JSON改坏后直接进程崩溃。参考答案改独立标题，方便网站只折叠答案而不藏任务。26个完整文件与正文同步后重新核对通过。

接下来由另一代理交叉检查学习步骤与作品；Root负责学习网站的章节目录、复制、配套下载包与部署。此报告只能证明上述实物与知识覆盖，不能单独代表整个线上网站或12个后续阶段全部验收。


## 素材导出交叉审查后的修复（最终补验）

另一代理发现初版PNG导出错误地克隆了单独的内联图标，漏了calendar.svg的日期点，编辑源文件也不影响PNG。已经修复为读取实际calendar.svg：HTTP通过no-store重新读取；file:双击模式不能直接导出跨文件画布（已实际复现Tainted canvases），因此明确让用户选择自己保存的SVG，再经数据URL导出，不以另一张图冒充结果。正文、完整assets.html围栏与README同步。

5项独立补验通过：HTTP原始/编辑后、本地文件原始/编辑后、file模式未选文件时明确提示并聚焦选择入口而不假下载。PNG均真实96×96，角落透明；日期点(32,60)alpha=255，原色RGB(23,98,75)，编辑后RGB(100,54,138)，轮廓同样反映修改。修改了线宽/圆角/配色的源文本真实进入导出，未固定重写颜色。证据.qa/svg-export-source-results.json；完整00–02原66项与26文件一致性又全部通过。最终为66项原检查加5项导出来源补验，不将初版误导出隐藏为一直正确。


02静态资源错误补验：交叉审查发现先写200再读文件会在已知资源缺失时回200空body；已改为读文件成功后再写头。仅在QA副本省略style.css，真实HTTP GET与HEAD均500，GET返回明确错误JSON，HEAD没有响应体，之后首页仍200（进程未崩溃）。原66项与26围栏重新通过。证据.qa/followup02-missing-resource-results.json；没有移走真实配套文件。
