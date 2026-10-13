# Web 后续03–06：独立交叉审查

日期：2026-10-13。审查者负责00–02，本轮只读检查另一作者的03–06，不直接修改其源码。原知识清单实际共42项（9+12+11+10），不是39项；下面按原项逐一记录教学解释、实物与验证。

## 可运行性与教学是否一致

在.qa为四个项目复制独立源码，复用已安装依赖；不对作者目录运行安装/格式化，红绿实验只改隔离副本。四组lint、tsc --noEmit、Vitest、Vite build均退出0：03为8条单元测试，04/05/06各14条，总50条。额外亲手把03筛选传参改42，tsc退出2并报TS2345；恢复后退出0。把筛选条件改true，Vitest出现3失败/5通过；恢复后8通过。初轮20次进程检查的结果符合预期。随后在05本身复现筛选改true：4失败/10通过，恢复后14通过（含组件测试），并在焦点修补后重跑04–06的lint/typecheck/测试/build均退出0。

把构建产物放到真实静态HTTP子路径/stage/03..06，而非仅用Vite dev。最终独立浏览器57项检查全部通过：正常与搜索、03各失败夹具、React详情刷新、未知路由/不存在ID、表单只检查与编辑失效、HTTP404恢复、真实离线/上线重试、键盘跳正文保留路由、各360/768/1440无横向溢出、Vue入口、Radix Escape归还焦点、分页收藏刷新与搜索复位、坏收藏原文保留、自制SVG真实响应192195→188字节。另实际用键盘验证04/05/06重试后焦点都是H1、06取消最后收藏后焦点是筛选INPUT，再Space关闭收藏筛选可以继续看活动。没有未捕获pageerror。初轮发现的两个焦点问题已由作者修复并独立复验，不将初轮失败隐藏为一直通过。

完整文件正文比对131块：03有17、04有38、05有37、06有39，均与磁盘源文件逐字一致。lock按教程明确由手建版npm install生成、下载版附带，不要求手敲数千行；README随配套提供。05/06大SVG由predev/prebuild/prepreview生成，不把未预先提交这些产物误报为源码缺失。

证据位于.qa/front-peer-build-results.json、.qa/front-peer-browser-results.json、.qa/front-peer-fences-results.json、.qa/front-peer-05-redgreen.json与.qa/front-peer-focus-rebuild-results.json。独立脚本为.qa/check-front-peer-build.cjs与.qa/check-front-peer-browser.cjs，本机Node26.7.0、Edge；没有声称已测试所有Node LTS/浏览器/辅助技术或真实远程账号发布。作者另报告四组npm ci与自带E2E通过，独立审查不将其混作本审查亲自执行的命令。

## 发现并要求修复的具体问题

1. 03初稿正文说missing.json得到HTTP404，但初始Vite配置只有base，默认SPA可能返回200首页。作者已改appType:'mpa'并同步正文/README；隔离最终副本与静态产物实际HTTP404、错误分类正确，关闭。
2. 04新增library.html与Radix源码，而初稿“全部文件”未给library.html/library-main.tsx/dialog-demo.css，手建者build会缺入口。作者已补完整三文件、实际URL、依赖与Root/Trigger/asChild/Portal等含义。131块最终正文比对无差异；独立生产library入口与Escape焦点归还可运行，关闭。
3. 06只看收藏仅剩一项时，键盘Space取消该项，按钮DOM被移除，activeElement落到BODY。用户继续Tab会失去原操作位置。作者已在取消前focus仍存在的筛选checkbox，新增Space取消/恢复过滤回归并同步正文；独立生产副本activeElement为INPUT，Space关闭过滤后图论卡片恢复，关闭。
4. 04–06错误重试按钮在error→loading时移除，键盘Enter重试成功后焦点都落BODY。作者已在retry回调先focus稳定h1再setAttempt并加回归，三组源码/正文同步；独立副本逐组确认重试成功后activeElement为H1，关闭。

## 03：原9项覆盖

| 原知识点 | 正文如何教与可执行例子 | 独立证据 |
| --- | --- | --- |
| 模块化 | “模块到底解决什么问题”说明作用域、export/import与type导入，画events→api→main，Ctrl点击与错误导入实验 | 完整三模块build实际成功，文件结构与正文一致 |
| Vite | 安装Node24.15+、终端目录、ci/install区别、dev持续运行、8803地址、preview8903与TS不能双击 | 隔离Vite构建成功、构建网页真实可搜索；不伪称安装程序已亲测 |
| TypeScript基础 | string/number、数组与函数参数返回值、interface/type用途；42传字符串参数的实际失败 | 独立TS2345退出2→修复退出0 |
| 类型建模 | EventItem、可选location、Scenario字符串联合、状态标签；前后端字段协议区别 | 实际领域校验8条测试、四固定记录展示 |
| 类型收窄 | typeof/Array/in、unknown与any/as不同、null对象陷阱、非空标题和重复ID | 缺字段/重复编号测试；错误字段场景拒绝 |
| 异步数据类型 | Promise<EventItem[]>不保证服务数据，unknown经过校验；网络/HTTP/JSON/业务分层 | 404/坏JSON/缺字段/业务失败页面结果与分类一致 |
| 格式与静态检查 | format/lint/tsc/test各职责，Vite转码不等于类型检查，build先typecheck | lint/类型/8单测/build独立实际通过，行为红绿不是模拟结论 |
| 配置和环境变量 | .env.example→.env.local、重启、VITE_公开、路径末尾斜线、不能放秘密 | 公开fixtures实际从子目录读取，源文件围栏一致 |
| 构建产物 | dist来源、哈希JS/CSS、public复制、preview与生产边界、base相对路径/hash路线区别 | 产物真正在/stage/03/读取，四类失败都可运行 |

## 04：原12项覆盖

| 原知识点 | 正文如何教与可执行例子 | 独立证据 |
| --- | --- | --- |
| 框架选择 | 明确React主路线与理由，Vue为基础输入/列表对照、不假称完整Vue课程 | React完整首页/列表/详情，Vue实际构建与搜索运行 |
| 组件拆分 | App/StateView/EventResults/SearchBox/EventCard/Form树与责任，改卡片验证两页一致 | 完整组件可运行，首页/列表复用源码一致 |
| Props | 父数据/回调，事件名字分原生与props，自输入到App到结果的数据链 | 真输入图论结果正确，不绕事件直接调用setter |
| 状态与视图 | useState快照、受控输入、派生found不重复存、ref只保存引用、函数更新 | 搜索/回退与路由焦点工作，14条组件/纯逻辑测试 |
| 事件通信 | SearchBox调用onChange，上移状态是因为多页共享；破坏空回调实验 | 独立正常输入真实反映视图，变式给只线上筛选答案 |
| 列表与条件渲染 | 稳定id/key与索引风险、loading/error/success及数据空vs筛选空 | 不存在ID/空结果/真实404的视图各自正确 |
| 副作用 | 不在render请求、依赖scenario/attempt、Abort清理、StrictMode额外检查、自定义Hook复用 | 离线/重试真实恢复；作者已有延迟旧请求E2E，独立未冒称重复跑其全部套件 |
| 表单 | 受控字段、preventDefault、trim/邮箱教学规则、真实服务器职责、编辑清旧反馈 | 空姓名→合法虚构值只本地检查→修改旧成功消失；无假报名 |
| 路由 | hash不随HTTP发出、parseRoute/hashchange、详情刷新、History静态服务器边界、跳正文拦截 | 子路径详情刷新、未知路由/ID、键盘跳正文都通过 |
| 复用逻辑 | useEvents组织外部同步，App调用一次共享数据而非每卡请求；组件边界由需求决定 | useEvents实现和解释一致，多入口共享请求状态 |
| UI组件库 | 新补Radix实物，重点模态焦点复杂性、各原语API、独立入口资源与依赖成本 | library真构建并打开，Escape焦点回Trigger；作者自带测试还验Tab环绕 |
| 调试 | 官方React DevTools入口、props/state/Profiler与Console/Network分工，常见空白/输入不动排查 | 源码未用忽略类型逃避错误，生产运行无未捕获异常 |

## 05：原11项覆盖

| 原知识点 | 正文如何教与可执行例子 | 独立证据 |
| --- | --- | --- |
| API交互 | useEvents→api→HTTP→unknown→业务→parseEvents→view全链，非直接as信任 | API分类测试与实际HTTP404/离线恢复都成立 |
| 状态边界 | 初始化自动loading、成功空与无匹配区别、error不变空、等待旧请求清理 | 实际正常/失败/空视图，作者延迟取消E2E有真实断言 |
| 错误恢复 | Offline后明确重新加载，恢复不等于仅切网络在线，场景取消不红报 | 独立setOffline→错误→Online→重试得到真实结果 |
| 输入校验 | 姓名空格、邮箱格式、修改撤销旧结论；服务器仍需要再次验证 | 实际表单正常与失败，不伪造已发送 |
| 组件测试 | Harness真实useState、按role找控件、userEvent驱动、expect具体ID/消失；jsdom边界 | 独立14单元/组件通过，本课筛选逻辑故意改坏，真实4失败/10通过，含组件失败；恢复14通过 |
| 端到端测试 | install chromium/Edge渠道、服务端口冲突、7项测试各流程、trace解释 | 配套脚本完整；独立用产物走相同核心搜索详情失败恢复，并未冒称已跑全部自带命令 |
| 无障碍 | Tab/Enter、标题焦点、label、alert/status、focus-visible/对比度/装饰图、人工阅读器边界 | keyboard skip不破路由、表单label与语义搜索工作；阅读器/200%人工未宣称已跑 |
| 响应式回归 | 360/768/1440以及长内容、缩放、scrollWidth只证尺寸不是阅读体验 | 三尺寸子目录产物无横向溢出 |
| 性能测量 | 明确自制注释SVG实验与字节/压缩/时间不同，Network实量、LCP/CLS三次中位数且不能编分 | 两SVGHTTP body实192195→188，图自然640宽；未伪造Lighthouse成绩 |
| 数据与视图分离 | api/parseEvents集中协议与start_time适配，卡片只用EventItem | 外部错误字段被拒，正确地点显示，与标准化模型一致 |
| 错误日志 | 版本/URL/hash/症状/证据/改动/回归六类信息，禁止记秘密 | 教学提问与Bug记录具体，不只有“请问报错怎么办” |

## 06：原10项覆盖

| 原知识点 | 正文如何教与可执行例子 | 独立证据 |
| --- | --- | --- |
| 需求说明 | 八条需求同时列操作和预期，不用“高级”空形容词 | 搜索/详情/分页/收藏/失败/尺寸都有实物入口 |
| 信息架构 | 首页→列表→详情与返回，资料/未知链接/缺ID，渐进实施顺序 | 未知路由/缺ID/刷新真实正常 |
| 组件规划 | 共享请求与关键词放App，页码/筛选在结果，Card/Box/State复用 | 源码责任与解释一致，生产多入口工作 |
| 设计一致性 | tokens统一颜色间距/按钮、长标题、200%与各尺寸；不加摆设功能 | tokens编译实际生效、三尺寸不溢出；取消最后收藏键盘焦点已修并验证 |
| 真实数据策略 | 受控fixtures出处明确，非实时报名/云账号，真实API需协议和服务器 | JSON实际从HTTP读，不假随机成功回执 |
| 错误与空态 | 数据空/过滤空/HTTP/网络/损坏本地记录，明确恢复与保存范围 | 全部实际核心失败恢复与原损坏字符串保留 |
| 单元与E2E | 14单元/组件、9浏览器，三条交付证据；不把CI/线上/读屏混进本机范围 | 14独立通过，核心产物流程独立跑；暴露的最后收藏/重试焦点边界已补回归 |
| 部署与回滚 | build/preview、Pages Actions完整YAML、自己的独立仓库、真实URL核对，两次发布revert | 静态子路径实物正常；实际用户远程Pages/回滚未自动执行，文档诚实注明 |
| 作品集陈述 | README用户/需求/技术理由/本人负责/真实bug/限制/地址，禁止宣传不存在的云能力 | 配套README可运行，不写虚假在线成绩 |
| 演示与复盘 | 三分钟按查找→操作→失败→实现→bug/限制组织，独立排序变式与答案 | 路线有可演示真实功能，分页筛选与收藏归属可验证 |

## 最终结论与证明范围

四阶段已经从清单变成有完整源码、术语因果、真实命令、正常/失败与独立变式的教学单元。主要编译/运行/路径条件成立，发现的两个同步问题与两个键盘焦点问题均修复并独立复验，最终57项浏览器检查与131段完整文件核对通过。本站总路由、下载包与线上部署由root另行检查，不能从这份报告推出12阶段全部完结。
