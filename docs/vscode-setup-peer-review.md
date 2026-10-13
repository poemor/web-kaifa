# VS Code Go 起步配置：独立运行与调试验收

日期：2026-10-13。对象为VS Code教程第8–13节、Go环境/工具链补充、四份配置、vscode-first-program及源码ZIP。审核过程不修改教程/配置源文件，不改用户全局VS Code/Go设置，不通过Windows UI输入命令，也不附着到用户进程。

## 结论

用户截图的cmd问题已真实复现，并验证对应正确写法；最终ZIP解压到含空格的独立目录，运行/编译/顺序依赖、修改输出与失败阻断成立。Delve DAP实际命中断点、读取变量与watch、next逐行、继续输出均成功。完整四份JSON、main.go正文围栏与最终ZIP一致，两个launch配置符合官方属性与Go扩展0.56.1配置schema。

本次使用隔离Go1.26.9 windows/amd64，绝对路径来自已校验toolchain；独立安装Delve1.27.2到.qa/vscode-setup-peer/bin，未使用旧系统Go1.26.2、未改全局PATH/GOBIN/VSCode配置。PATH与GOTOOLCHAIN等仅传给测试子进程。DAP服务仅绑定127.0.0.1随机端口，结束时关闭自己启动的服务和目标，不操作已有用户进程。

## 1. cmd报错与正确启动方式

从最终ZIP运行编译任务生成hello.exe，在同一实际cmd.exe子进程目录分别执行三种写法：

| 输入 | 实际退出码/结果 |
| --- | --- |
| ./hello.exe | 1；`.`被解释成命令，失败 |
| hello.exe | 0；两行正确输出 |
| .\hello.exe | 0；两行正确输出 |

本机cmd错误原文为英语，与用户中文错误含义相同：

```output
'.' is not recognized as an internal or external command,
operable program or batch file.
```

两种成功写法的真实输出：

```output
你好，Go
编译后的程序也能独立运行
```

说明首先修终端启动语法与目录，不能把这个报错归咎Go函数或要求重装编辑器。教程已经区分cmd/PowerShell/Unix、新默认终端不替换旧终端、编译不等于执行、exe不当文本编辑。

## 2. ZIP与process任务实跑

源码包共7项：README/main.go/go.mod和.vscode下settings/tasks/launch/extensions四JSON。逐项与canonical源比对；无exe/dll/node_modules。python scripts/build_vscode_starter.py --check通过，UTF-8/LF内容和固定ZIP时间戳保证可重建。

实际解压到.qa/vscode-setup-peer/final ZIP space/vscode-first-program，保留路径含空格，解析每条任务的command/args/options.cwd中workspaceFolder，使用process方式直接启动，不拼接shell。按dependsOn顺序执行真正Go命令，在非零退出时阻断依赖者。这里实测的是配置指定的命令及依赖条件；没有把模拟任务菜单说成已操作了VS Code GUI。

13项任务/终端检查通过，其中最后2项只是Linux/osx覆盖字段与目标名核对，不是跨系统实跑：

| 验收 | 实际结果 |
| --- | --- |
| 选中隔离工具链 | go version为go1.26.9 windows/amd64 |
| 运行当前项目 | go run .返回0，两行输出一致 |
| 默认编译任务 | group=build/isDefault，go build生成hello.exe，不执行/不打印问候 |
| 修改姓名并保存 | Go改小林，go run输出你好，小林 |
| 编译并运行顺序 | trace先Go编译任务，再绝对exe命令，输出小林 |
| 故意坏源码 | missingGreeting导致编译退出非零、stderr含undefined，trace只有编译，不运行旧exe |
| 旧产物仍存在 | SHA256保持不变，证明阻断不是因为把旧exe删了 |
| 修回源码后重试 | 重新构建并运行恢复两行Go输出 |
| cmd三种语法 | ./错误；直接名与.\成功 |
| Linux/osx覆盖 | 输出/命令都指hello，cwd仍当前项目；未在对应系统执行 |

workspaceFolder的变量位置和process类型符合[VS Code变量说明](https://code.visualstudio.com/docs/reference/variables-reference)与[任务schema](https://code.visualstudio.com/docs/reference/tasks-appendix)。$go是VS Code内建Go编译错误matcher，不要求扩展额外注册同名matcher。[官方任务说明](https://code.visualstudio.com/docs/debugtest/tasks)。

## 3. 真正通过Delve DAP调试

独立QA启动dlv dap，发送最终launch.json第一个配置的实际字段，workspaceFolder只替换成独立目录绝对路径。没有改mode为exec偷用旧二进制，没有关闭Go版本兼容检查。

真实协议结果：initialize/launch成功；setBreakpoints指定main.go第12行fmt.Println(message)，断点verified=true；configurationDone后stopped.reason=breakpoint。stackTrace顶帧main.main、line12；scopes/variables返回：

```output
name = "Go" (string)
message = "你好，Go" (string)
```

evaluate(expression=message, context=watch)返回"你好，Go"。next后再次stopped，顶帧变成line13，说明执行了第一条输出并停在第二条前。continue后terminated，目标实际打印两行问候/编译程序说明，未仅凭变量值推测输出。

原配置outputMode默认local，原生Delve将目标stdout送自身输出流而非全部通过DAP output event。本审核同时采集DAP消息与自己启动的Delve stdout，确认实际程序输出；不把自己裸协议客户端当作完整VS Code UI，也不把首轮仅查DAP事件未见stdout误报为程序失败。

launch的type=go/request=launch/mode=debug/program/cwd/internalConsole，与[Go扩展官方调试属性](https://github.com/golang/vscode-go/blob/master/docs/debugging.md)一致。安装包Go扩展0.56.1的configurationAttributes逐键核对两个配置，mode与console均在enum中。integratedTerminal官方明确列为实验功能，教程已经说明fmt.Scan需要终端输入、失败可先用运行任务；本轮没有声称实际验证了VSCode GUI中的第二个交互式终端配置。

## 4. 正文与配置完整性

当前正文四个完整JSON均可JSON.parse，分别精确匹配settings/tasks/launch/extensions源；第9节完整Go代码精确匹配main.go；最终ZIP也匹配四配置。settings的默认profile是PowerShell，源定义同名source，未留下旧“教程”命名的不一致。

第8节给扩展唯一ID/发布者/安装成功判据，区分SDK、扩展、gopls与dlv；第9节解释独立项目、.vscode层级、已有模块不再init、工作区与用户设置；第10节逐键解释终端/保存/格式化；第11节实际任务入口、修改→保存→重跑、compile/run区别与失败定位；第12节断点/变量/F10/F11/继续/停止、输出面板与输入终端区别；第13节证据提问模板。四种角色不会混写成“安装一个插件即可运行所有代码”。

截图内容与真实UI操作另由主代理采集；本报告验证源码/配置/CLI/DAP，不冒称已人工点击安装、重开窗口、安装gopls或按过原生VSCode F5。全文和下载包一致性已经独立证明，主站图片链接、复制、布局与部署仍由站点总测验证。

## 保存的运行证据

### 同日继续修复：缺模块与教程操作顺序

用户再次提供F5截图：Delve已经监听，但构建报go.mod file not found；目录只有main.go。本次把Go第1课顶部改成常驻四步起步说明，单独复制初始化命令；Go环境/工具链讲义用动作、文件与输出逐步验收。cmd的目录检查使用cd/dir，已有项目用go env GOMOD核对所属模块，不覆盖源码或在资料根初始化。错误入口和搜索可直接定位章节，刷新/返回保留URL中的步骤。

独立QA实际复现只有main.go时的缺模块错误；go run main.go可成功却不会创建模块，init后go run .与调试构建成功，重复init拒绝且源码/mod不变。若QA目录位于Git资料仓库内，Go会给cannot find main module并建议向上级初始化，教程明确只在独立练习目录建模块。保留的scripts/test_vscode_starter.cjs加入这条恢复回归；scripts/test_go_start_path.cjs验证入口、复制、步骤跳转、搜索、刷新/返回、未知参数、7宽度和原学习记录保留。

子代理额外实际启动Delve DAP：缺模块时能监听但launch失败；同目录按教程init后，在原Go第1课fmt.Println(greeting("Go"))处命中断点，F11进入greeting并读到参数name=Go，stepOut/continue实际输出两行。VS Code教程因此区分A保留Go01原源码的断点/参数与B第9节name/message变量示例，不让新手寻找自己文件里不存在的语句。独立浏览器148项检查与原Go01默认源码对应验证通过，未改变完成/check/quiz/notes/drafts。

本次也未操作用户桌面、全局编辑器设置或原生F5界面；DAP实测与浏览器验收的边界保留。证据位于.qa/go-module-recovery-results.json、.qa/go-module-dap-results.json及.qa/go-module-path-peer/results.json。

临时QA证据均在.qa/vscode-setup-peer：task-results.json（完整命令/cwd/退出码/输出）、dap-results.json（断点/variables/evaluate/next/输出与协议记录）、schema-results.json（正文/ZIP/schema）。复跑脚本test-tasks.cjs与test-dap.cjs不触碰真正练习目录，安装的dlv.exe及hello/__debug_bin只在忽略的QA目录，未提交产物。

本组未发现待修的源码/配置问题；已具备清楚且实跑过的cmd错误定位、菜单任务、构建失败阻断和断点观察证据。跨系统GUI与fmt.Scan交互式调试仍按报告边界人工验证，不把说明文本当成实际验收。


已保留可重复的真实DAP回归：scripts/test_vscode_starter_debug.cjs。它自己从最终ZIP解压7个文件到.qa独立目录，GO_TOOLCHAIN_EXE可指定隔离Go、VSCODE_QA_DLV可指定独立Delve、VSCODE_QA_PYTHON可选Python路径；不自动安装工具、不改全局设置。默认使用PATH内已有工具，检查SDK至少1.26.9。独立脚本已实际运行通过断点/变量/watch/next/输出与结束。当前版本要求依据本次2026-10-13验证，未来升级工具须重跑。最终证据写.qa/vscode-debug-peer/dap-results.json。任务回归由root保留scripts/test_vscode_starter.cjs，不重复提交第二份tasks脚本。
