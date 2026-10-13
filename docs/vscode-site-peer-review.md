# 主站VS Code与阶段集成独立审核（2026-10-13）

目标是当前本地主站 http://127.0.0.1:8743/#/setup?topic=editor 与Go第1课、12后续阶段。此次只读审核，不修改站点源码，不重复React工程CI。实际安装器、VSCode任务与F5界面没有在本轮重新执行；普通网页自动检查、读取原图与ZIP检查不能当成F5验收。用户停止ComputerUse后没有再操作原生UI或拍新截图。

## 文字与操作顺序

教程区分Go SDK、Go扩展、gopls、dlv，先go version→核对golang.go→工具安装→独立项目→四JSON→任务运行/编译→调试断点→向AI提供证据。给出工作区应打开的层级、四配置各负责什么、`${workspaceFolder}`不是文件夹名、终端与源码/输出面板区别；提供PowerShell/cmd/Unix不同启动命令，避免把cmd的./hello.exe错误当Go源码问题。

Go第1课的详细go-tools表已经给cmd cd/dir/hello.exe与PowerShellGet-Location/Get-ChildItem/.\hello.exe；内部链接实际转换为#/setup?topic=editor，并真实点击进入教程，不再跳到不存在的相对index路径。

F5讲解明确Go扩展/Delve、运行前暂停、Variables/Locals、F10/F11/ShiftF11与输出位置；internalConsole无stdin，fmt.Scan使用第二配置，integratedTerminal实验限制与go run回退写明。这是可跟做说明，不被标成当前审核已经真实F5成功。

新dlv缺失小节定位正确：Install提示或GoInstallTools、CLI go install、GOBIN/GOPATH实际目录、GoLocateConfiguredTools、完整安装输出与SDK版本；fmt红线先悬停/Problems、模块/保存/gopls、实际go run区分编译错误，语言服务重启作为后续。无需为了fmt去安装同名包或混装Code Runner。

## 发现、反馈与复核

真实tasks截图的默认高亮是Rerun All Running Tasks，而准确Tasks:RunTask为第4项，初版搜索后直接Enter会误导。已反馈root；保留原图并在步骤、alt和邻接解释明确选准确名称再Enter、第一项是相似命令。最新站点实际DOM已显示该说明，不伪造选中状态。

另发现下载web-followup-02.zip的server.cjs比当前源旧，其他12包全部文件对应正常；已反馈root；root最终重生成12包后，独立重新HTTP下载02包，server.cjs与冻结源精确一致，此项已关闭。

## 普通浏览器与下载检查

独立Edge、1440×1000与360×900完成56项检查：13个h2章节、四图实际200/PNG解码/原像素、四JSON可解析、目录跳转、tasks整段复制（保留变量/反斜杠，LF/CRLF标准化）、桌面/手机无页面横向溢出、手机图片不超过视口、Go第1课链接实际导航、12阶段正文默认展开/源码目录对应/ZIP200及PK头。全过程无pageerror。标签页学习记录为独立新上下文，没有更改用户真实记录。

starter通过真实浏览器download事件保存，不只是检查链接存在。实际解压共7文件：main.go、go.mod、README、.vscode下settings/tasks/launch/extensions四JSON，四份JSON与docs/tutorials/configs/go源逐字段一致；目录为vscode-first-program，既有模块明确不重复init。

12阶段下载分别10/8/10/19/40/39/42/17/14/16/17/34个文件，均只有正确followup-XX根、README/必要源码/lock，无node_modules、dist、test-results、playwright-report、exe、dump、个人.env.local。全部可解压。阶段02快照更新后已重新下载精确比对关闭，最终13包均对应正确源。

原图独立目视读取：Go扩展ID/发布者/已安装状态与JSON可辨识，工具图正确展示GoInstallTools；任务图按现在文字准确定位第4项，不宣称图是任务已运行终端结果。手机截图需点击放大读细节，主站提供可点击原图；页面bounds检查只能证明尺寸，不代替真人手机或辅助技术阅读。

## 官方与本机 metadata核对

本机golang.go0.56.1 package贡献列表确认Go:Install/UpdateTools、Go:LocateConfiguredGoTools与Go:RestartLanguageServer这些命令真实存在。官方[Go扩展调试说明](https://github.com/golang/vscode-go/blob/master/docs/debugging.md)支持F5启动并构建、Delve安装、InternalConsole与实验集成终端边界；[当前macOS安装说明](https://code.visualstudio.com/docs/setup/mac)确实使用.dmg（不按过往zip记忆改错）。此处仅核对文档/schema/声明，未安装或升级用户工具。

自动检查脚本与原始数据保存于.qa/vscode_site_peer.cjs、.qa/vscode-site-peer/results.json、archive-results.json；测试临时文件不提交。网站实际推送/Pages发布及线上资产核对由root执行，这份本地报告不冒充线上验收。
