# 模块、包与工具链：让代码真的跑起来

你要做的是一个能重复运行的小程序，而不是在编辑器里存一段看起来像代码的文字。VS Code 负责编辑文件；Go 工具链负责检查语法、编译和执行。安装 Go 扩展可以得到补全和诊断，但扩展不能替代 Go 安装。先在 VS Code 的“终端 → 新建终端”输入 `go version`，看到版本再继续；找不到命令时回到安装与起步教程检查 PATH，并完全关闭、重开 VS Code。

## 先认清三个名字

**文件**是 `main.go` 这样的文本，保存后才成为磁盘上的源码。**包**把同一目录中的普通 Go 文件组织起来；它们通常写相同的 `package` 声明。可执行程序使用 `package main`，启动入口是 `func main()`。**模块**是一个带 `go.mod` 的项目单位，它记录模块路径、Go 要求和依赖。一个模块可以包含多个目录、多个包；模块路径与包名不必相同。

模块路径 `example.com/learn/go-tools` 在这份本地练习中是标识，不表示你需要购买域名或先部署网站。自己建立练习时，在独立目录初始化模块；不要把整个教材仓库变成一个 Go 项目。已有 `go.mod` 的练习不用再次初始化。标准库如 `fmt` 随 Go 提供，不需要 `go get fmt`。

## 在 VS Code 建立独立练习

1. 建立 `exercises/go/go-tools` 文件夹，在 VS Code 选择“文件 → 打开文件夹”，打开这个目录。
2. 左侧资源管理器点“新建文件”，命名为 `main.go`，贴入下面**完整程序**，按 `Ctrl+S`。
3. 新建终端，Windows PowerShell 输入 `Get-Location`，cmd 输入 `cd`（不带参数），macOS/Linux 输入 `pwd`。最后目录必须是 `go-tools`，而不是上一级 `go`。提示符以 `PS` 开头通常是 PowerShell；`C:\...>` 通常是 cmd，启动 exe 的写法不同。
4. 首次执行 `go mod init example.com/learn/go-tools`。左侧应出现 `go.mod`。再逐行输入下面命令；命令不写进 `main.go`。

```powershell
go fmt ./...
go run .
go test ./...
go vet ./...
```

这些 Go 命令在三种终端中相同。构建和启动则按下面选择，**不要把不同终端的启动命令混用**：

| 终端 | 先编译 | 再启动 | 查看文件 |
| --- | --- | --- | --- |
| Windows PowerShell | `go build -o hello.exe .` | `.\hello.exe` | `Get-ChildItem` |
| Windows cmd | `go build -o hello.exe .` | `hello.exe` 或 `.\hello.exe` | `dir` |
| macOS/Linux zsh/bash | `go build -o hello .` | `./hello` | `ls` |

cmd 中输入 `./hello.exe` 可能报“`.` 不是内部或外部命令”。这首先是终端写法问题，不需要重装 Go；确认编译成功、目录有 hello.exe，再输入上表的 cmd 命令。想固定使用 PowerShell、用菜单运行或 F5 逐行调试，到 [安装 VS Code 的插件与配置教程](../../../index.html#/setup?topic=editor)，按第8–13节配置；里面有真实截图、完整 JSON 和独立练习下载。

`go fmt` 整理缩进，成功时可能显示被修改文件名。`go run .` 编译当前包并运行临时程序。`go build` 生成独立程序，编译成功通常不打印消息；旧程序不会随源文件自动更新。`go test` 运行测试；本例没有测试时会显示 `[no test files]`，这不是失败。`go vet` 做静态检查，未发现问题时通常安静结束，也不等于全面正确。

## 完整程序：main.go

```go
package main

import "fmt"

func greeting(name string) string {
	return "你好，" + name
}

func main() {
	fmt.Println(greeting("Go"))
	fmt.Println("编译后的程序也能独立运行")
}
```

`import "fmt"` 使用标准库的格式化输入输出包。`greeting` 接受一个字符串参数并返回一个字符串；它不负责打印。`main` 调用函数取得返回值，再交给 `fmt.Println`，所以结果出现在**终端**，不会自动变成浏览器网页。两个 `Println` 各写一行，预期输出为：

```output
你好，Go
编译后的程序也能独立运行
```

## 包如何影响名字可见性

在同一包内可以调用小写名字 `greeting`；其他包不能直接访问它。若设计给其他包调用，可命名 `Greeting`。首字母大写表示导出，不表示函数一定安全或正确。不要在同一目录放两个都包含 `func main()` 的演示文件，否则 `go run .` 会报入口重复；每个独立演示放自己的目录。`go run main.go` 只使用你列出的文件，多文件项目通常使用 `go run .`，避免漏掉同包辅助源码。

## 改一个条件，再看结果

把 `greeting("Go")` 改成 `greeting("小林")`，保存后先直接运行旧 `hello.exe`，再用 `go run .`。参考答案：旧程序仍输出“你好，Go”，`go run .` 输出“你好，小林”。重新 `go build` 后独立程序才更新。这个对照能解释“我明明改了代码，结果为何没变”。不要把已经在运行的程序输出当成新源码的验证。

## 常见问题与自查

- `go.mod file not found`：先确认终端目录，再判断这个独立练习是否尚未初始化；不要在错误目录为了消除报错随手建模块。
- `declared and not used` 或 `imported and not used`：变量/导入没有被使用，删除无用代码或实际使用它，Go 将此视为编译错误。
- `undefined: fmt`：检查是否导入 `fmt`，以及拼写大小写；`Println` 与 `println` 不是同一个符号。
- `package ... is not a main package`：检查此演示是否是库包；库通过测试或其他程序调用，不必每个包都能独立运行。

自查：你能指出终端当前目录、`go.mod` 的位置、程序入口和输出位置吗？能解释编辑器扩展、Go 编译器、源码、可执行文件的四个角色吗？运行成功只是环境证据；合上例子独立写出一个问候函数，才是掌握证据。

## 可选：用 Git 留下源码，先检查再提交

Git 用来记录文件的版本，不负责让 Go 程序运行。还没安装 Git 时，先保存 `main.go`、`go.mod` 和自己的运行记录，代码练习可以继续；需要版本管理时再安装、学习 Git。已经在资料仓库内练习时，应沿用仓库已有的 Git，不在练习目录再建一套嵌套仓库。

`go build -o hello.exe .` 会留下编译产物。若随后直接执行 `git add .`，这个程序也可能进入暂存区；“我知道不能提交 exe”不会让 Git 自动排除它。暂存区是下次提交的候选文件，不是已经推送到网上。先在本练习目录新建 `.gitignore`，保存以下内容：

```gitignore
hello.exe
hello
*.exe
.env
```

这份规则保护本例指定名称的构建产物与本机配置；换了输出文件名要同步加规则，不要误以为它覆盖所有项目。`.gitignore` 本身应保存进版本管理，`go.mod` 是源码依赖信息，也应保存。当前标准库示例不一定生成 `go.sum`；引入外部依赖后，存在的 `go.sum` 同样应保存。

在 VS Code 集成终端、当前练习目录内执行：

```powershell
git --version
git rev-parse --show-toplevel
```

第二条显示现有仓库根目录，说明这里已处在仓库中；不要再执行 `git init`。若它明确提示 `not a git repository`，且你准备把这个独立练习作为自己的仓库，再执行 `git init`。下面只暂存明确的源码文件：

```powershell
git add .gitignore main.go go.mod
git diff --cached --name-only
```

预期暂存列表只有 `.gitignore`、`main.go`、`go.mod`，不应包含 `hello.exe` 或 `hello`。存在 `go.sum` 时，再用 `git add go.sum` 添加它。`git diff --cached` 可以检查将要记录的内容；确认后才执行自己的提交命令。不要为运行第一个程序而先解决远程登录、推送或发布。

**如果编译产物已被暂存**，先运行 `git status`，然后在这个目录用 `git rm --cached -- hello.exe` 把它从 Git 候选记录中移除；`--cached` 表示保留磁盘文件。macOS/Linux 本例用 `git rm --cached -- hello`。随后重新查看暂存列表。若它已经在较早的提交中，`.gitignore` 不会自动停止跟踪，仍需要明确移除跟踪并检查差异。不要用删除整个目录来处理一个暂存问题。

这里完成的是保存源码的准备，尚未替你提交或推送。参考：[Git 暂存](https://git-scm.com/docs/git-add)、[忽略规则](https://git-scm.com/docs/gitignore)。

官方参考：[Go 起步教程](https://go.dev/doc/tutorial/getting-started)、[依赖管理](https://go.dev/doc/modules/managing-dependencies)、[go 命令说明](https://pkg.go.dev/cmd/go)。
