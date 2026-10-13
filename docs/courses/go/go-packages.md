# 包与模块的实际组织

建立两个文件，把函数放到可导入的calc包。

## 包是源码分组，模块是项目边界

包把同一个目录里的 Go 源码组织到一起；模块由 go.mod 标明项目路径、Go 版本要求和依赖。一个模块可以有多个包，本节用入口 main 包调用子目录 calc 包。

**目录里的文件不因出现在屏幕上就自动可调用；包外使用函数需要正确 import 和导出的名字。** 已学前置是 [函数](../../../index.html#/learn/go/go-functions) 与 [错误处理](../../../index.html#/learn/go/go-errors)。标准库 fmt 随 Go 安装，不用另外下载。

## 建立新的独立目录

新建 packages 文件夹，在 VS Code 打开它，终端核对正在这个目录。这个例子的导入路径与模块名字有关，不沿用别的课程模块名：

```sh
go mod init example.com/book/packages
```

创建 main.go，再创建 calc 子目录，在里面创建 add.go。最终结构应为：

```text
packages/
  go.mod
  main.go
  calc/
    add.go
```

本地模块路径是本练习的名称，不要求访问 example.com。若以前误用其他模块名，可以建立一个新的独立目录重试，避免边改 import 边猜路径。

## 两个完整源码文件

main.go：

```go
package main

import (
	"fmt"
	// 本模块路径加 calc 子目录，找到下面定义的包。
	"example.com/book/packages/calc"
)

func main() {
	fmt.Println(calc.Add(2, 3)) // 用包名找到导出的 Add 函数。
}
```

calc/add.go：

```go
// 同一个目录内的 Go 文件属于 calc 包。
package calc

// Add 的首字母大写，因此 main 包能够导入后调用它。
func Add(a, b int) int {
	return a + b
}
```

两份文件分别保存。`calc/add.go` 的 package calc 声明它属于 calc 包；main.go 的 import 使用“模块路径 + 子目录”，找到这份本地源码。实际调用用包名 calc，不用完整路径来写函数调用。

## 从入口运行与理解结果

终端回到 packages，也就是含 go.mod 和 main.go 的目录，执行：

```sh
go run .
```

终端预期为：

```output
5
```

执行入口 main → 调用 calc.Add(2,3) → calc 包中的函数计算并返回 5 → main 的 Println 显示 5。Go 会按 import 找到本地包，不能只运行 main.go 旁边某个不相关目录的文件。

## 验证导出与路径错误

先把 Add 的定义改成小写 add，并同步试写 calc.add。包外仍不能访问小写名字，编译应失败；首字母大写的名字才会导出供其他包使用。恢复 Add 后再运行得到 5。

再在 import 的 calc 后面误加一个不存在的目录名，运行应提示找不到对应包；恢复正确路径。这两类错误分别是“找到包但不能用名字”和“连包都没找到”，不能统一通过重装 Go 插件解决。

## 独立增加一项行为

在 calc/add.go 中增加导出的 Multiply(a,b int) int，main 调用它计算 2×3 并打印 6。保持文件仍在 calc 目录、仍声明 package calc。一个包可以有多个文件，但普通源码文件的 package 名称要一致。

### 参考答案

函数首字母大写、main 导入正确包、调用用 calc.Multiply，三个条件都满足才能从包外使用。第三方依赖留到需要时按项目 README 添加，go mod tidy 整理依赖，go.sum 记录下载内容校验；本例不需要外部依赖。

参考：[Go 官方模块教程](https://go.dev/doc/tutorial/create-module)。
