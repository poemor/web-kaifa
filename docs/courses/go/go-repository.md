# Repository 与依赖注入

把需要的读取行为传给业务对象，先用内存实现看清依赖，再考虑数据库实现。

## 为什么不让每个 Handler 自己写 SQL

前面的Handler负责请求、参数和响应，数据库代码负责连接、SQL和存储。若全部塞进一个函数，修改输出格式会碰到SQL，测试HTTP又必须启动数据库。把职责分开能让变化和测试更清楚。

**Repository是封装存储行为的一层；业务对象依赖它提供的行为，而不直接知道存储细节。** 它不一定叫Repository，也不是必须创建很多目录。本节的Store只有GetTitle，故意缩小到一个可理解的行为。

“依赖”指一个对象要调用另一个对象才能完成工作；“注入”指外部创建那个对象并传进去。不是后台自动发现数据库，也不是Go内置机制。

## 完整例子：同一业务，换一个存储

在已初始化的独立Go练习目录替换main.go：

```go
package main

import "fmt"

// 使用者只需要这个读取行为，不要求对方用什么字段或数据库。
type Store interface {
	GetTitle() string
}

type Memory struct {
	Title string
}

// 方法签名符合Store，所以Memory可以作为Store传入，无需implements声明。
func (m Memory) GetTitle() string {
	return m.Title
}

type Service struct {
	store Store // 持有接口，业务方法不读取Memory的具体字段。
}

func (s Service) Title() string {
	return s.store.GetTitle()
}

func main() {
	// 在组装位置选择实际实现，并传入Service；这一步就是依赖注入。
	service := Service{store: Memory{Title: "Go"}}
	fmt.Println(service.Title())
}
```

```sh
go run .
```

输出：

```output
Go
```

## 从输出往回追踪

main先创建Memory，再把它放进Service.store。调用service.Title后，Service只调用接口方法GetTitle；Memory提供实现，返回自己保存的标题，最后打印Go。

这里使用 [结构体](#/learn/go/go-structs)、[方法](#/learn/go/go-methods)、[接口](#/learn/go/go-interfaces) 的已有写法。`Store`是行为要求，`Memory`是具体实现，`Service`是使用者。接口字段若未初始化为可用实现，调用它可能panic，所以组装时必须提供所需依赖。

## 从最小演示回到 HTTP 工程

[数据库项目](assets/downloads/web-followup-09.zip) 中Store还有List、Get、Create、Update、Delete，SQLStore在repository.go实现这些行为，API在api.go使用它们。启动main.go选择SQLStore；测试可注入MemoryStore或故意返回错误的实现。

**假存储只替换外部依赖，测试仍应调用真实Handler或Service。** 另写一份假业务函数来返回期望值，无法验证正在交付的业务逻辑。这里的Memory是完整演示实现，不等于已经测试PostgreSQL。

## 预测，再换实现

自己增加 `Fixed` 类型，让GetTitle返回“Web”，把main里注入的Memory换为Fixed，Service保持不改。然后故意删掉Fixed的GetTitle方法，预测能否编译。

### 参考答案

有方法时输出Web；缺方法时编译器拒绝将Fixed当Store。接口帮忙在编译时检查行为契约，不能替你判断行为返回的值是否正确。

## 独立变式

把接口改为 `GetTitle() (string, error)`，给一个实现返回错误，让Service或调用者显式处理。说明新签名为什么要同步修改实现，不应只在Handler里吞错。

参考：[Go接口规范](https://go.dev/ref/spec#Interface_types)。
