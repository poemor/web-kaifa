# 接口与行为约定

用一个只要求Name方法的接口接受具体类型。

## 接口与行为约定是什么意思

接口列出行为要求。类型拥有接口要求的方法，就能作为接口使用，无需implements声明。先用一个方法的接口，避免一开始设计巨大接口。

## 先问“能做什么”，再看具体类型

前面的方法挂在 Problem 上。现在想让多个类型都能提供一个名字，不必固定它们内部有哪些字段。**接口列出所需方法；具体类型拥有准确匹配的方法，就满足接口。**

`Name() string` 表示方法叫 Name、没有参数、返回 string。Named 接口不规定 Title 或 NameText 字段，也不提供方法的具体实现；User 的 Name 方法才实际读取 NameText 并返回它。Go 不要求另外写 implements 关键字。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import "fmt"

// Named 只要求一种行为：Name 方法无参数，返回 string。
type Named interface {
	Name() string
}

type User struct {
	NameText string
}

// User 拥有准确匹配接口要求的方法，所以可以作为 Named 使用。
func (u User) Name() string {
	return u.NameText
}

func main() {
	var named Named = User{NameText: "小林"}
	// 通过接口调用实际存入的 User 的方法，不直接访问其字段。
	fmt.Println(named.Name())
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
小林
```

## 逐步读懂这个例子

Named要求Name() string。User有这个方法，所以可赋给Named变量。调用named.Name()执行User的方法。使用者依赖一个行为，无需固定User的所有字段。

`User{NameText:"小林"}` 创建具体 User 值。赋给 named 时，接口变量保存这个具体值及其类型信息。`named.Name()` 按接口约定调用，实际执行 User 的 Name 方法，然后 Println 显示返回文字。

如果 named 的声明类型是 Named，能直接使用的是接口列出的 Name 方法；不能写 `named.NameText` 来随意读取 User 的字段，因为另一个实现可能根本没有这个字段。

## 自己改一处再运行

另写Team类型，实现Name方法，把named改成Team并输出组名。

### 参考答案

Team拥有Name() string就可以使用。返回类型不同则不满足接口。

## 本节容易混淆的地方

接口的nil与内部保存nil指针是不同情况；不要为了形式给每个结构体配一个接口。

## 用第二个类型验证行为约定

创建 `type Team struct { Label string }`，为它写 `Name() string` 返回 Label，再把赋给 named 的值换成 `Team{Label:"学习组"}`。原来的 named.Name() 调用应继续工作并输出学习组。

把这个方法返回类型改成 int，会在赋给 Named 时产生接口不匹配错误；恢复 string。**同名方法还不够，参数和返回类型也必须匹配。**

没有存入任何具体值的接口变量零值为 nil，不能直接调用其方法。接口里存入 nil 指针则是后续的类型断言课要细分的问题，本课只使用实际 User/Team 值。

参考：[Go 语言规范](https://go.dev/ref/spec)。
