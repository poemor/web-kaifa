# 方法与接收者

为Problem增加MarkSolved，理解指针接收者。

## 方法与接收者是什么意思

方法是带接收者的函数。func(p *Problem) MarkSolved中的p是本次调用作用的对象。指针接收者让方法写入调用者的结构体字段。

## 方法告诉你“对哪条记录做什么”

普通函数可以写成 Change(&value)，方法则可以写成 `p.MarkSolved()`。两者都会调用一段代码，方法另外在定义中指定**接收者**，也就是这次操作所针对的值。

**想让方法修改原结构体，接收者需要能指向原值。** `func (p *Problem) MarkSolved()` 的接收者名是 p，类型是 *Problem。MarkSolved 后面的空括号表示没有额外参数；是否返回值，要看参数括号之后有没有返回类型。本例没有写返回类型，所以没有返回值。比如 `Solved() bool` 也没有额外参数，但会返回一个 bool。

方法里的 p 与 main 中的 p 属于不同范围，碰巧同名；可以把方法内的接收者名改成 problem 并同步改内部访问，行为不会变化。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import "fmt"

type Problem struct {
	Title  string
	Solved bool
}

// 函数名前的 (p *Problem) 是接收者，指定这次要修改哪条记录。
func (p *Problem) MarkSolved() {
	p.Solved = true // p 是指针，写入的是原记录的字段。
}

func main() {
	p := Problem{Title: "Two Sum"}
	p.MarkSolved() // 对可取地址的 p，Go 在这里自动使用它的地址。
	fmt.Println(p.Solved)
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
true
```

## 逐步读懂这个例子

p.MarkSolved()以p作为接收对象，方法更新它的状态。改成值接收者(p Problem)时，只更新结构体副本，原对象不会因此变成true。

main 先创建 Problem，Solved 默认 false；调用 `p.MarkSolved()` 时，这个可取地址的变量会提供自己的地址。方法写入 `p.Solved=true` 后返回，main 再读取就得到 true。

`p.Solved` 是字段读取，`p.MarkSolved()` 是方法调用。指针接收者里访问字段可直接写 p.Solved，Go 会找到指针指向的结构体，不要求每次手工写星号。

## 自己改一处再运行

改成值接收者再运行，比较结果，然后恢复指针接收者。

### 参考答案

值接收者输出false；指针接收者输出true。

## 本节容易混淆的地方

方法调用与字段访问都用点号，前者有括号，表示执行操作。

## 对比值接收者与指针接收者

把接收者由 `(p *Problem)` 改成 `(p Problem)`，保存运行，输出应从 true 变成 false，因为方法只修改收到的结构体副本。恢复星号后再运行，确认又是 true。

若把单独一行 `p.MarkSolved()` 改成 `p.MarkSolved`，Go 会先拒绝编译，提示函数值未使用：你取到了这个方法，却没有调用它，不能把结果单独放成一句无用途的语句。**这是编译失败，不是成功运行后悄悄忽略操作。** 恢复调用括号后再运行，确认状态改变。

## 合上参考，独立定义改标题的方法

从空白 main.go 重建本节的Problem数据格式，但独立写一个SetTitle(title string)方法，让它使用指针接收者只更新标题，保留Solved。自己安排接收者、额外参数和字段赋值，不调用MarkSolved来代替这个目标。

创建两条记录：第一条“原题”、false，第二条“另一题”、true。只对第一条调用改标题方法，传入“新题”，预期第一条为“新题 false”，第二条仍为“另一题 true”。再传空字符串，用%q显示标题，第一条应为 `"" false`，第二条不变。

**解释接收者表示哪条记录、title参数表示什么新数据，并核对未要求修改的字段仍保留。**

### 参考答案

指针接收者让方法写入原记录，普通字符串参数提供本次的新标题。空参数括号与返回类型是不同位置；本方法有一个额外参数，不要求返回值。两条记录及空标题能检查是否误改状态或其他记录。

参考：[Go 语言规范](https://go.dev/ref/spec)。
