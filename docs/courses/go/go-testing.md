# 第一份单元测试

比较真实结果与自己手算的期望，改错后看到失败。

## 测试是可重复的结果比较

之前运行程序后用眼睛看结果。单元测试则调用一个函数，把实际结果与事先确定的期望比较，不同就报告失败。**测试的期望来自需求或独立手算，不能拿同一个函数再算一遍当答案。**

本课只验证整数加法。前置是 [函数返回值](../../../index.html#/learn/go/go-functions)、[条件](../../../index.html#/learn/go/go-if) 和 [独立模块](../../../index.html#/learn/go/go-packages)。不需要网页、服务器、数据库或第三方测试框架。

## 准备两个文件

在自己的独立、已经有 go.mod 的测试练习目录，保存下面两个完整文件，使用 Go 1.22 及以上版本。main.go 是被测代码：

```go
package main

// Add 是被测试的计算函数；测试要检查它的返回值。
func Add(a, b int) int {
	return a + b
}

func main() {} // 保留可运行程序入口；测试由 go test 启动。
```

main_test.go 是测试代码：

```go
package main

import "testing" // 标准库提供测试运行和失败报告功能。

// 名字以 Test 开头，参数类型为 *testing.T，go test 才能识别。
func TestAdd(t *testing.T) {
	got := Add(2, 3) // 实际调用被测函数，保存真实结果。
	if got != 5 {    // 期望 5 来自手算，不能再次调用 Add 当“答案”。
		t.Fatalf("got %d, want 5", got) // 报告实际值，并判定本测试失败。
	}
}
```

`_test.go` 后缀让 Go 识别这是测试文件。测试函数名从 Test 开始，后续名字用大写开头；参数 `t *testing.T` 交给测试运行器管理。t 是一个指针，用 `t.Fatalf` 可以报告当前测试失败，不用自己创建 t。

## 运行测试，在终端观察

终端在包含两个文件和 go.mod 的目录，保存后执行：

```sh
go test ./...
```

`./...` 表示当前目录及其子目录的包；此例只有一个包。TestAdd 先调用 Add(2,3)，got 保存实际结果；if 比较 got 与手算的 5。如果不相同，Fatalf 的 %d 替换为实际数字，并结束这个测试、报告失败。

成功输出包含 ok、你的模块路径和时间，例如：

```output
ok  example.com/learn/addtest  0.002s
```

模块路径和耗时取决于你初始化的目录，可能还出现 `(cached)`。**成功依据是测试退出成功并显示 ok，不是复制出完全相同的耗时。** `go run .` 只执行空 main，不会运行 TestAdd。

## 故意改错，确认测试会失败

把 main.go 中的 `a + b` 改成 `a - b`，保存后再运行测试。实际结果为 -1，错误报告应包含：

```output
got -1, want 5
```

整个输出还会带 FAIL、文件行号与模块信息。若错误版仍成功，检查保存、工作目录、文件名和 if 条件。恢复加法后第三次运行，应再次通过。

## 独立加三项测试

分别建立 TestAddZero、TestAddNegative、TestAddMixed，调用 Add(0,0)、Add(-2,3)、Add(10,-4)，期望为 0、1、6。沿用本课“保存 got → if 不同 → t.Fatalf”的做法，不需要先学习表驱动或子测试语法。

### 参考答案

每项都要真的调用函数、比较独立期望并能报告失败。只打印结果而不比较，或把期待值写成 Add 的再次调用，都不能有效发现算法错误。例子测试成功是验证代码的证据，不会自动更新你的学习完成状态。

参考：[Go 官方 testing 文档](https://pkg.go.dev/testing@go1.22.0)。
