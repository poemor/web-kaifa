# Go 起步：装工具链，运行自己的程序

Go 不要求先学 C++。先认识三件事：VS Code 负责编辑，Go 工具链负责编译运行，Go 扩展提供编辑提示；只装扩展不能代替工具链。

先完成“安装 VS Code”的打开文件夹步骤，再按本篇操作。你可以直接学 Go，不必先完成 Web 环境。代码写进 `main.go`，命令输进 VS Code 底部终端；每条命令按一次 Enter，查看结果后再继续。

**已经粘贴 main.go，但 F5 报 `go.mod file not found`？** 直接查看本文“F5 报 go.mod file not found”章节。新建文件夹不会自动初始化模块，安装 Go 插件或 dlv 也不会创建 go.mod。正常跟做顺序是：打开独立目录 → 初始化模块 → 保存源码 → `go run .` 成功 → 再配置 F5。

[直接定位缺模块的修复步骤](../../index.html#/setup?topic=go&step=missing-module) · [运行已成功，配置 VS Code 与调试](../../index.html#/setup?topic=editor&step=module)

## 1. 下载与验证 Go

从 [Go 官方下载页](https://go.dev/dl/) 选择稳定版、对应操作系统与处理器。Windows 用 MSI 安装程序，macOS 用对应安装包；Linux 按官方安装页的 Linux 标签操作。已有 Go 环境时先检查版本，再决定是否更新，不要直接删除已有安装。[Go 官方安装说明](https://go.dev/doc/install)

| 你的电脑 | 下载文件如何辨认 | 下载后做什么 |
| --- | --- | --- |
| Windows，系统类型是 x64 | `windows-amd64.msi`；amd64 也适用于 Intel 的 x64 电脑 | 在“下载”中双击，按安装向导完成；默认目录通常是 `C:\Program Files\Go` |
| Windows，系统类型是 ARM64 | `windows-arm64.msi` | 使用对应架构安装包；不要仅凭电脑品牌判断 |
| Mac，Apple M 系列芯片 | `darwin-arm64.pkg`；darwin 表示 macOS | 打开 pkg，按向导完成 |
| Mac，Intel 处理器 | `darwin-amd64.pkg` | 打开 pkg，按向导完成 |
| Linux | 按架构选 `linux-amd64.tar.gz` 或 `linux-arm64.tar.gz` | 按官方 Linux 安装页配置；已有安装先核实，勿照抄删除命令 |

系统类型的查看方式在“安装 VS Code”第 1 步。不要选择 Source（源码）或带 beta/rc 的预发布包。学校或单位电脑没有安装权限时，先向管理员确认；保留安装提示原文。

安装后重开 VS Code 与终端，在终端输入：

```sh
go version
```

预期：输出形如 `go version go1.x.y windows/amd64`；这里的版本和系统只是格式示意，以实际输出为准。不能正常输出时，先解决命令可用性，再创建程序。

## 2. 安装编辑器扩展

在 VS Code 左侧扩展入口（积木形图标，或菜单 View → Extensions）搜索 **Go**，核对发布者 **Go Team** 与扩展标识 **golang.go** 后点 Install（安装）。打开 `.go` 文件，按提示安装所需工具；也可按 `Ctrl+Shift+P`（Mac 为 `Cmd+Shift+P`）打开顶部命令面板，搜索并选择 `Go: Install/Update Tools`。它是编辑器操作，不要粘贴进终端。下载工具需要联网；`gopls` 提供语言分析，调试工具在调试时使用。[官方扩展](https://marketplace.visualstudio.com/items?itemName=golang.go) · [Go 编辑支持说明](https://code.visualstudio.com/docs/languages/go)

如果工具下载失败，先保留下载地址与报错；`go version` 和标准库小程序可分别检查。不要把“编辑提示没有出现”和“Go 程序不能运行”混为一个问题。

## 3. 在独立练习目录初始化

**动作一：打开你实际要运行的文件夹。** 已有本仓库时，在 `exercises/go` 下新建 `setup-check`。没有下载仓库也可以在“文档”中新建 `go-first-program`，用“文件 → 打开文件夹”直接打开它；不需要先建整套资料目录。已有自己创建的 `go` 文件夹和 main.go 时可以继续用，不要为了跟教程换名字而丢掉旧代码。

**动作二：在这个文件夹里打开终端。** 左侧资源管理器右键最上方项目文件夹 → **在集成终端中打开**。确认提示符对应这个目录。单独打开 main.go 标签不等于终端已进入它的目录。

| 当前终端 | 查看当前位置 | 查看目录中的文件 | 预期 |
| --- | --- | --- | --- |
| PowerShell，提示符通常有 PS | `Get-Location` 或 `pwd` | `Get-ChildItem` 或 `ls` | 指向你打开的独立练习目录 |
| cmd，提示符通常是 C:\某个目录> | `cd`（只输入这两个字母，不加路径） | `dir` | 同上；cmd 不用 pwd/ls |
| macOS/Linux zsh/bash | `pwd` | `ls` | 同上 |

位置不对时，重新右键正确文件夹打开终端；也可用 `cd "你实际的目录路径"` 切换，Windows cmd 跨盘符用 `cd /d "实际路径"`。这里的中文是占位说明，不是一条可照抄的路径。仓库用户的目录末尾应为 `exercises/go/setup-check`；自己建立其他文件夹的人按自己的名字核对，不要求所有人都在同一条路径。

**动作三：先确认是否已有模块。** 下面命令在三种终端里相同：

```sh
go env GOMOD
```

若输出当前项目的 go.mod 完整路径，已有模块，**跳过初始化**。如果输出的是上级项目的 go.mod，说明当前代码属于那个模块，先打开正确的项目根目录；不要随手在子目录再建一个模块。若输出 `NUL`（Windows）、`/dev/null`（Unix）或空值，表示此处未找到生效的模块文件；确认它是你准备独立练习的目录后再初始化。该命令只查看环境，不创建或删除文件。

**动作四：新项目初始化一次。** 只有当前目录还没有所属模块时，单独执行：

```sh
go mod init example.com/setup-check
```

预期终端提示：

```output
go: creating new go.mod: module example.com/setup-check
```

左侧练习目录新增 **go.mod**。点开它，第一行应为 `module example.com/setup-check`，Go 版本行由工具按你的环境生成，不需要手填；标准库小程序暂时没有 go.sum 也正常。再运行 `go env GOMOD`，应指向刚创建的文件。**看到了这个文件再进入下一步**。

若提示 `go.mod already exists`，确认现有模块所属后直接继续，不删除文件来消除提示。若报权限问题，先确认目录可写，不继续 F5。若不小心在错误目录运行，先保留报错和文件位置排查，不按“删整个文件夹”的建议操作。

`go.mod` 记录模块信息；`example.com/setup-check` 是练习用模块名，不要求购买域名。

## 4. 新建 main.go

右键刚才的 `setup-check`（或你自己的实际项目目录）→ 新建文件 → 输入 `main.go`。若之前已建空文件，直接打开。把下面代码完整放进文件，按 `Ctrl+S`（Mac 为 `Cmd+S`）保存；注意保留英文双引号、括号与大小写：

```go
package main

import "fmt"

func main() {
    fmt.Println("我能运行自己的 Go 程序")
}
```

确认左侧 `main.go` 和 `go.mod` 在**同一个** `setup-check` 文件夹中。终端仍在这个目录，先格式化代码（自动整理缩进）：

```sh
go fmt ./...
```

预期：可能显示 `main.go`，也可能没有输出；两种都正常。若出现错误，先看第 8 节，不继续堆叠命令。然后执行：

```sh
go run .
```

预期：在**终端**看到一行“我能运行自己的 Go 程序”，然后提示符重新出现。首次编译可能稍等片刻。运行成功不会自动弹出网页，也不需要点编辑器右上角的运行按钮。把双引号内文字改成“我今天运行了两次程序”，保存，重新执行 `go run .`，应看到新句子。[Go 官方起步教程](https://go.dev/doc/tutorial/getting-started)

先记住：`package main` 表示可执行程序的包，`main` 函数是入口，`fmt.Println` 在终端打印一行文字，双引号包围要打印的字符串。本次修改引号里的文字即可，后续课程再逐项学习语法。

`go run .` 中的点表示当前包。这里没有数据库、远程依赖或服务器；程序输出后退出是正常现象。

到这里的独立项目应是：

```text
setup-check/（或你自己的 go-first-program / go 文件夹）
  go.mod
  main.go
```

两个文件属于同一个项目，终端也在这里。**只有 go version 成功、go.mod 出现、保存后的 go run . 输出正确，才继续 F5 调试**。配置步骤见“安装 VS Code”第9–12节；不会因为创建一个 .vscode 文件夹而自动补上 go.mod。

## F5 报 go.mod file not found：按这四步恢复

如果调试控制台已经出现 `Starting ... dlv ...`、`DAP server listening ...`，随后是 `Build Error` 和 `go.mod file not found in current directory or any parent directory`，说明 **Delve 已启动，接下来构建当前项目时找不到模块**。此时优先检查项目目录和 go.mod；不需要先重装 Go 插件、dlv 或 fmt。

在已下载的 Git 资料仓库内，还可能显示 **`cannot find main module, but found .git/config`**，并建议去上级目录初始化。这也是缺模块的一种提示；本仓库是资料集合，**不要照提示在整套资料根建立模块**。下面只在自己的独立 Go 练习目录初始化。

1. 停止这次失败调试。左侧确认 main.go 在哪个文件夹，用“文件 → 打开文件夹”打开这个独立项目。右键它 → 在集成终端中打开。cmd 用 `cd`/`dir`，PowerShell 用 `Get-Location`/`Get-ChildItem` 核对；别把调试控制台当作终端。若源码放在整套教材资料根目录，先把这份源码复制到新建的独立练习文件夹，并直接打开那层；保留原文件，不在资料根初始化模块。
2. 执行 `go env GOMOD`。若已给出路径，打开该模块根目录再运行；若未找到模块，确认没有上级项目要沿用，单独输入以下初始化命令。它保留你的 main.go，不重写源码。

```sh
go mod init example.com/learn/hello
```

3. 确认项目里出现 go.mod，再在**同一个终端**运行：

```sh
go run .
```

看到你 main.go 实际的打印文字才算运行验证成功。例如 Go 第1课的问候源码应输出“你好，Go”和“编译后的程序也能独立运行”；本篇最小例子则输出“我能运行自己的 Go 程序”。报错时停在这一步，保留错误原文。

4. 已有配置时回到 `.vscode/launch.json`；没有这份文件的人按下方“配置 VS Code”入口创建。本教程的 program/cwd 是 `${workspaceFolder}`：F5 调试**当前打开的项目目录**。确保该工作区就是刚运行成功的模块目录，再按 F5。main.go 的编辑标签开着，不代表调试目标也指向这个文件夹。

**为什么 go run main.go 有时能跑，F5 却失败？** `go run main.go` 可以直接构建指定的标准库单文件；本教程的 `go run .` 和 F5 按项目包运行，需要识别模块。单文件成功不能代替项目准备。保留模块设置，按目录初始化和验证，不用关闭模块模式或反复更换运行插件绕过错误。[Go 官方起步：先初始化模块，再运行当前包](https://go.dev/doc/tutorial/getting-started)

**下一步去哪？** 已跑出结果但还没创建编辑器配置，先 [配置 VS Code](../../index.html#/setup?topic=editor&step=module)；已有 launch.json 的人可 [继续设置 F5 断点](../../index.html#/setup?topic=editor&step=debug)。若仍失败，到“学会问 AI”提供工作区文件树、实际终端类型、go env GOMOD 输出、执行动作和完整错误。个人路径可打码，但保留文件夹层级。

## 5. 逐行看懂自己的第一个程序

先不用背术语，把执行过程说成一句话：Go 找到程序入口，调用打印功能，把双引号里的文字显示到终端，执行结束。各行承担不同任务：

| 代码 | 为什么要写 | 初学时容易混淆的地方 |
| --- | --- | --- |
| `package main` | 声明这个文件属于 main 包；构建可执行程序使用 main 包 | package 不是目录命令，不在终端输入 |
| `import "fmt"` | 引入标准库 fmt，使用格式化输入输出功能 | fmt 随 Go 提供，本例不需要另装一个 fmt 插件 |
| `func main() {` | 定义名为 main 的入口函数，花括号开始函数体 | `func` 表示函数；这里只是在写程序入口，不是点击后执行的网页事件 |
| `fmt.Println("…")` | 调用 fmt 包的 Println，打印内容并换行 | P 大写；引号内是文字，引号本身不输出 |
| `}` | 结束函数体 | 括号成对，漏掉时编译器会提示语法问题 |

程序按入口函数里的语句依次执行。比如再加一行打印语句，就会多输出一行。把第一份程序中 `main` 函数改成下面这样，其他部分原样保留：

```go
func main() {
    fmt.Println("第一步：保存文件")
    fmt.Println("第二步：运行并检查结果")
}
```

保存后，在 VS Code 的**终端**运行 `go run .`，应看到两行，顺序与源码相同：

```output
第一步：保存文件
第二步：运行并检查结果
```

这段是**替换函数的片段**，不是让你在原文件末尾再加一个 `main`。一个包里不能重复声明两个同名 main 函数。想保留旧版本，可以先复制到笔记或保存成 `.txt`；不要在同一个目录放多份都含 main 的 `.go` 文件，否则 `go run .` 会把它们一起编译而产生冲突。

### 用数字理解变量与表达式

继续只替换 `main` 函数，先猜输出，再运行：

```go
func main() {
    minutes := 20
    days := 3
    total := minutes * days
    fmt.Println("每天分钟数：", minutes)
    fmt.Println("累计分钟数：", total)
}
```

`minutes`、`days`、`total` 是变量名，可以理解为给一个值起名字，后面通过名字使用它。函数内的 `:=` 声明变量并赋初值；`20` 是数字，`"20"` 是文字，它们不是一回事。`*` 表示乘法，因此 total 得到 60。`Println` 的逗号分隔多个参数，输出时会在参数之间留空格。

```output
每天分钟数： 20
累计分钟数： 60
```

把 days 改成 5，预测 total 是多少，保存运行验证。若你声明了变量却从未使用，Go 会报 `declared and not used`；这个规则是在提醒你检查是否漏用了数据，不是要求随便删掉报错行。先明确变量要做什么。

## 6. 在 VS Code 编译，并启动生成的程序

**编译**是把源码检查并转换成可执行程序；**运行**是让这个程序真正执行。`go run .` 把编译和运行连起来，适合频繁练习；`go build` 构建出保留在磁盘上的程序，成功后不会自动打印你的学习目标。[Go 命令说明](https://pkg.go.dev/cmd/go)

先保存文件，右键自己的项目目录 → 在集成终端中打开，按第3节的终端表核对路径：cmd 用 `cd`/`dir`，PowerShell 用 `Get-Location`/`Get-ChildItem`，macOS/Linux 用 `pwd`/`ls`。下面按系统选择一组，每次只运行一条。

### Windows PowerShell

第一条在当前目录生成 `hello.exe`，`-o` 后面是指定的输出文件名：

```powershell
go build -o hello.exe .
```

**应看到**：没有错误时提示符重新出现，左侧文件列表新增 `hello.exe`；终端没有打印学习目标也正常，因为这里只编译。然后运行：

```powershell
.\hello.exe
```

这时才应该显示当前程序的打印结果。`.\` 表示“当前目录中的”，PowerShell 通常不会仅凭 `hello.exe` 就自动从当前目录寻找程序。不要在 VS Code 中打开 exe 当文本编辑，也不建议双击观察输出：短程序执行结束后窗口可能马上关闭。

### Windows cmd（提示符是 C:\某个目录>）

cmd 不支持上文的 `pwd`/`ls`：用 `cd`（不带参数）查看当前位置，用 `dir` 列出文件。先运行 `go build -o hello.exe .`，成功后输入：

```bat
hello.exe
```

也可输入 `.\hello.exe`。**不要在 cmd 中输入 `./hello.exe`**，它会把点误当成命令，出现“`.` 不是内部或外部命令”。这个错误与 Go 源码无关；先检查文件存在，再按实际终端选择写法。切换终端必须新开一个 PowerShell，旧 cmd 不会因为改了默认设置就自动变成 PowerShell。

### macOS / Linux

先编译生成当前目录中的 `hello`：

```sh
go build -o hello .
```

再运行，`./` 同样表示当前目录：

```sh
./hello
```

### 改了源码，旧程序为什么没变化

做一个对照实验：先编译，再修改源码里的打印文字并保存，只运行现有 `hello.exe` / `hello`。你会看到旧输出，因为磁盘上的可执行程序是**上一次编译的结果**。重新执行构建命令，再启动，才能看到新输出。`go run .` 每次按当前保存的源码编译运行，因此这两种操作的结果可能暂时不同。

| 你做了什么 | 源码是否更新 | 可执行程序是否更新 | 会不会执行程序 |
| --- | --- | --- | --- |
| 在 VS Code 改字但没保存 | 仅编辑区变化 | 不会 | 不会 |
| 保存 `main.go` | 磁盘源码更新 | 不会 | 不会 |
| `go run .` | 读取已保存源码 | 构建供本次运行使用，不在这里保留指定的 hello 文件 | 会 |
| `go build -o … .` | 读取已保存源码 | 会，成功后写入指定文件 | 不会 |
| 启动 hello 程序 | 不读取你刚改的源码 | 不会重新编译 | 会 |

**小验收**：留下构建命令、生成的文件名、启动命令、实际输出；然后改一句话，重新构建，证明输出变化。编译产物不作为学习笔记提交到仓库，源码和结果记录才是需要保留的内容。

## 7. 再写一个需要你输入的程序

前面的程序只输出固定文字。这次让它先问你的称呼，再使用你输入的数据。先备份旧源码到自己的笔记，然后用下面**完整内容替换** `main.go`，不要追加到文件末尾：

```go
package main

import "fmt"

func main() {
    var name string
    fmt.Println("请输入一个不含空格的称呼，再按回车：")
    _, err := fmt.Scan(&name)
    if err != nil {
        fmt.Println("没有读到称呼，请重新运行后输入。")
        return
    }
    fmt.Println("你好，" + name + "！今天也来写一点代码。")
}
```

保存，在 VS Code 底部终端运行 `go run .`。看到提示后，**点击终端**输入 `小林` 并按 Enter，预期看到下面的对话。中间“小林”那行是你输入的，不是程序自己打印出来的：

```output
请输入一个不含空格的称呼，再按回车：
小林
你好，小林！今天也来写一点代码。
```

`var name string` 声明一个存放文字的变量，`fmt.Scan(&name)` 等待并把输入放入 name。`&name` 告诉函数往哪个变量里存；本节只需理解“把输入放进去”，后续再系统学习地址与指针。`err` 用来检查有没有读到有效输入，`if err != nil` 表示发生错误时进入这一分支，`return` 提前结束函数。双引号中的文字与 name 通过 `+` 连接。

**它一直不结束怎么办？** 如果停在“请输入……”后面，程序通常是在等输入，不是卡死。把文字输进终端，不是源码或“输出”面板；按回车后继续。这里只读取一个不含空白的词，带空格的完整姓名不是本例支持的输入。想取消运行可按 `Ctrl+C`；重来再执行 `go run .`。

试着换一个称呼，预测它如何出现在结果中。然后自己把问候句改成“欢迎开始 Go 练习”，再运行验证。你现在接触了输入、变量、处理和输出这四个程序基本环节。

## 8. 插件、配置与 F5 调试，从哪里继续

已经能运行 `go run .` 后，继续 [VS Code 插件与配置图文教程](../../index.html#/setup?topic=editor) 第8–13节：安装 Go Team 的 Go 扩展，安装 gopls/dlv，在**独立 Go 项目**的 `.vscode` 中保存 settings/tasks/launch/extensions 四个配置，再实际运行任务、设置断点、F5 看变量。也可 [下载带配置的完整 Go 起步包](../../assets/downloads/vscode-go-starter.zip)，解压后打开 `vscode-first-program`，按 README 操作。

配置是给编辑器明确运行位置与操作方式；`go run .` 本身不依赖这些 JSON。不要因为发现缺一个配置文件就重装已经能工作的 Go。已有源码先保留，用下载包的独立目录跟着做，再把确认适合自己的配置复制回去。

## 9. 常见问题：先定位到哪一层

| 完整报错或现象 | 含义与下一步 |
| --- | --- |
| `go` 不是命令 / command not found | 重开终端再试；Windows PowerShell 用 `Get-Command go`、macOS/Linux 用 `command -v go` 检查命令路径，记录输出 |
| `go.mod file not found` | 按第3节终端表核对目录（cmd 用 cd/dir），再看 [缺模块修复步骤](../../index.html#/setup?topic=go&step=missing-module)；已有模块先找正确项目，不随处反复初始化 |
| `go.mod already exists` | 通常已有模块；查看目录和模块文件后直接运行，不删除文件来消除提示 |
| `no Go files` | 当前目录是否正确、文件是否保存、是否误写成 `main.go.txt` |
| `main redeclared in this block` | 同一个包出现了多个 main；检查是否把替换片段追加了进去，或目录里保留了另一份带 main 的 `.go` 文件 |
| `expected 'package', found 'EOF'` | `main.go` 可能还是空文件或没保存；核对完整示例和磁盘上的文件 |
| `undefined: fmt.printLn` 等 | Go 区分大小写；示例是 `fmt.Println`，不要逐字照抄 AI 猜测的名称 |
| `declared and not used` | 查看报错行；Go 不允许未使用的局部变量，决定使用它还是去掉多余声明 |
| 扩展下载超时 / gopls 缺失 | 保存工具名、下载错误、`go version`；检查网络和扩展输出，不盲改全局代理或关闭校验 |

如果确实需要修复 PATH，先核对 Go 安装位置；只添加实际工具目录，不覆盖整条 PATH。已有多版本环境或学校电脑权限限制时，先带证据确认再调整。

**小排错练习**：仅在刚建的练习中，把 `fmt.Println` 暂时改为 `fmt.printLn`，保存并运行 `go run .`，观察报错；复制自己的错误原文，再改回 `fmt.Println`，保存重跑。记录“改前错误 → 修改一处 → 实际恢复”的证据，可以带到“学会问 AI”练习。不要把示例错误冒充自己遇到的结果。

### 不认识报错，也能先拆成三部分

错误格式可能类似下面这样，行号随你的文件变化：

```output
./main.go:6:9: undefined: fmt.printLn
```

`main.go` 是文件名，`6:9` 指第 6 行附近的第 9 列，后面是工具的判断。“undefined”表示没有找到这个名称。先点开该文件，查看左侧行号，或用“转到行”（Windows/Linux 为 `Ctrl+G`，Mac 为 `Ctrl+G`）输入报错行号，核对拼写。不要把行号当成必须删除的行数。

红色波浪线是编辑器的提示，终端编译报错是编译器的结果，程序打印了错误答案则是运行后发现逻辑问题。它们发生的阶段不同：编译成功只能说明代码能构建，不能证明计算结果满足你的要求。例如把乘法误写成加法，可能仍能运行，却得不到你预期的累计时间。

**自查结果**：你能运行 `go version`，能在独立模块里运行并修改程序，能解释编辑器、扩展和工具链的区别。再进入 Go 第 1 课完成正式练习；教程本身不计入完成课时。

官方链接核对日期：2026-10-13。本节不固定版本号；若某个后续项目有版本要求，以其 README 与 Go 官方支持情况为准。
