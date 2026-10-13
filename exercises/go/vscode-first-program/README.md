# VS Code Go 起步练习

这是独立的标准库 Go 程序，不需要 Node、数据库或付费 AI。安装 Go 官网当前受支持的补丁版本及 VS Code Go 扩展（Go Team，golang.go）。

## 打开与运行

下载网站的 `vscode-go-starter.zip`，全部解压缩，VS Code 直接打开 `vscode-first-program` 文件夹；同层应有 `main.go`、`go.mod`、`.vscode`。源码已初始化模块，不再执行 `go mod init`。

按 Ctrl+Shift+P → Tasks: Run Task → `Go: 运行当前项目`，或在此目录终端运行 `go run .`。

```output
你好，Go
编译后的程序也能独立运行
```

Ctrl+Shift+B 只编译；Tasks: Run Task → `Go: 编译并运行` 会先编译再执行。Windows 手动启动用 PowerShell 的 `.\hello.exe`，cmd 的 `hello.exe`；macOS/Linux 编译 `go build -o hello .` 后用 `./hello`。

直接从仓库打开本目录时，将 `docs/tutorials/configs/go/` 四个 JSON 复制到本目录自己新建的 `.vscode/`（本机设置不提交）；ZIP 已带这四个配置。详细图文与完整配置见网站“安装 VS Code”第8–13节。

## 验证

把 name 的 Go 改为小林，保存再运行，应看到“你好，小林”。`go test ./...`（当前没有测试文件）和 `go vet ./...` 检查本例可编译；这不是学习完成记录。

安装 gopls 和 dlv 后，在 `fmt.Println(message)` 行按 F9，F5 选 `Go: 调试当前项目`。暂停时查看 name/message；F10 逐行，F5 继续，Shift+F5 停止。

## 限制

本例只有输出，不读取键盘、不访问网络、不保存数据。带 fmt.Scan 的程序改选 `Go: 调试需要输入的程序` 并在终端输入；Go 扩展目前将 integratedTerminal 调试列为实验能力，失败时先用运行任务验证输入程序。不要提交 hello.exe/hello 或调试构建产物。
