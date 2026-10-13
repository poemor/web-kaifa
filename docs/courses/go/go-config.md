# 环境配置与明确的默认值

从启动终端读取端口配置，区分缺省与错误输入，再决定能否启动。

## 同一份程序为什么需要配置

自己的电脑可能用8080，另一台练习机用9090，数据库账户也不同。配置是运行环境可以变化的值，代码是处理规则。把配置写死在源码里，每换环境都要改代码；把密码写进代码还会随提交泄漏。

**环境变量由启动程序的环境提供，不是Go变量，也不是自动读取的.env文件。** 在终端设置后，它只影响该终端后来启动的进程及其子进程，已启动的旧服务不会自行更新。

本节用独立变量BOOK_PORT观察读取和校验，没有真正监听端口。端口是0–65535范围的数，本演示只接受1–65535；0可用于让系统选临时端口，但不是本节配置规则。

## 完整程序

在独立练习目录替换main.go：

```go
package main

import (
	"fmt"
	"os"
	"strconv"
)

func main() {
	// ok表示这个环境变量是否存在，port仍是字符串。
	port, ok := os.LookupEnv("BOOK_PORT")
	if !ok {
		port = "8080" // 只有完全未提供时，才采用默认值。
	}
	n, err := strconv.Atoi(port)
	// 明确提供但非法的值要拒绝，不能用默认值悄悄掩盖配置错误。
	if err != nil || n < 1 || n > 65535 {
		fmt.Println("非法端口")
		return
	}
	fmt.Println(n) // 这里只打印校验后的值，尚未启动HTTP服务。
}
```

## 不设置时观察默认值

确认当前终端未设置BOOK_PORT，在练习目录运行：

```sh
go run .
```

输出：

```output
8080
```

`LookupEnv`返回文字与是否存在两个结果，`Getenv`只有文字，无法单独区分没设置和设置为空。`Atoi`及范围校验已经在 [查询参数](#/learn/go/go-http-query) 使用；配置同样需要校验。

## 设置后，重新运行程序

PowerShell：

```powershell
$env:BOOK_PORT='9090'
go run .
$env:BOOK_PORT='abc'
go run .
Remove-Item Env:BOOK_PORT
```

macOS/Linux：

```sh
export BOOK_PORT=9090
go run .
export BOOK_PORT=abc
go run .
unset BOOK_PORT
```

9090时输出9090，abc时输出“非法端口”。最后删除本次演示变量；如果原先有自己的值，应恢复原值。不要把PowerShell写法贴到cmd或反过来，cmd用 `set BOOK_PORT=9090`。

明确存在的空字符串也应拒绝。某些PowerShell版本设置空值等于删除变量；要验证这种差异，可以临时在main读取前加 `os.Setenv("BOOK_PORT", "")`，运行看“非法端口”，随后删去该实验行。别据终端行为误判LookupEnv。

## 与真实服务配置的关系

完整工程使用APP_ADDR等变量，而非BOOK_PORT。把校验后的值组装成监听地址再交给HTTP Server，是下一层工作。DATABASE_URL可能含凭据，Cookie和Token也是敏感配置；错误日志只说明缺哪个配置，不打印完整秘密。Compose会读取自己的.env用于配置替换，这不表示Go标准库也读取它。

**缺省值是明确选择，错误输入应明确失败，两者不能混为一谈。**

## 独立变式

将演示改为允许端口8000–9000，默认8080。先预测7999、8000、9000、9001的结果，再逐一设置运行并记录。给非法配置加一条说明允许范围的错误信息。

### 参考答案

只有8000和9000边界有效；7999与9001拒绝。范围变化时默认值也应继续满足规则。

参考：[Go os.LookupEnv](https://pkg.go.dev/os#LookupEnv)。
