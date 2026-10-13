# 结构体与字段

把题目标题和完成状态放进同一个值。

## 结构体与字段是什么意思

结构体把有关联的不同类型数据放在一起。type声明类型，struct列出字段与类型，点号访问字段。先学数据表示，下一节给类型增加方法。

## 一条记录里的不同数据

一个问题记录既有标题，又有完成状态。切片的一组元素要求同一类型，而结构体让这些有关联的不同类型字段放在同一个值里。**结构体类型是记录格式；结构体值才是一条实际记录。**

`type Problem struct` 定义名为 Problem 的新类型。花括号内的每行是一个“字段名 + 字段类型”：Title 保存 string，Solved 保存 bool。`Problem{Title:"Two Sum"}` 创建一条值并按字段名填入数据；没有填入的字段使用自己的零值。

## 先运行一个小例子

在已初始化的独立 Go 练习目录中，把下面完整代码保存为 main.go。本节替换原文件，不在文件末尾追加另一份 main 函数。

```go
package main

import "fmt"

// 声明一种记录类型；每条记录都有文字标题和布尔完成状态。
type Problem struct {
	Title  string
	Solved bool
}

func main() {
	p := Problem{Title: "Two Sum"} // 没填写 Solved，它得到零值 false。
	fmt.Println(p.Title, p.Solved) // 点号选中这条记录的某个字段。
	p.Solved = true                // 只修改 p 的完成状态。
	fmt.Println(p.Solved)
}
```

在这个目录的终端运行：

```sh
go run .
```

预期输出：

```output
Two Sum false
true
```

## 逐步读懂这个例子

Problem有Title字符串和Solved布尔字段。字面量只写Title，Solved使用零值false。p.Solved=true修改这一条记录。字段大写会影响跨包访问，JSON一节会用到它。

读取 `p.Title` 先选中变量 p 的这条记录，再取 Title 字段。`p.Solved=true` 只更新这条记录的一个字段，标题不变。两个实际值可以使用同一种 Problem 类型，但它们的标题和状态各自保存。

字段名大写使字段能够被包外代码访问，小写字段只在本包内可见；JSON 编码也会使用导出的字段。现在先理解记录与字段，后面再用包和 JSON 验证可见性。

## 自己改一处再运行

再创建另一条Problem，修改第一条Title，确认另一条标题不变。

### 参考答案

两个独立结构体值各自保存字段，修改第一条不会自动改变第二条。

## 本节容易混淆的地方

type Problem是类型声明，p是一个实际值，两者不是同一个层次。

## 创建、复制并修改两条记录

在 p 后面写 `other := p`，再修改 p.Title，然后同时打印两条标题。这里的字段都是 string/bool，other 仍保存原标题。也可创建另一条 `Problem{Title:"Valid Parentheses"}`，它初始 Solved 仍为 false。

把 `p.Solved = true` 改成 `p.Solved = "true"`，应报类型错误；恢复布尔值后重新运行。数据放入结构体并没有消除字段类型约束。

## 合上参考，独立声明学习记录

从空白 main.go 声明新类型 StudyRecord，包含标题、分钟数、是否完成三项，由你命名字段并选择类型。创建两条不同记录：第一条只填标题“Go笔记”，第二条填“Web练习”、25分钟、true。

按“标题、分钟、完成”读取字段并打印，第一条应为“Go笔记 0 false”，第二条应为“Web练习 25 true”。再只把第一条改成10分钟并完成，核对它变为“Go笔记 10 true”，第二条仍为“Web练习 25 true”。

**要自己写出类型声明与两条实际值，不能继续使用Problem换一个标题来代替新记录格式。**

### 参考答案

标题需要string，分钟需要int，完成需要bool；未提供的分钟和完成状态使用对应零值。两条值属于同一类型，却各自保存字段，更新第一条不会自动改第二条。

参考：[Go 语言规范](https://go.dev/ref/spec)。
