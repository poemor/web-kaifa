# context 取消与 select

把取消信号传到具体工作里，让工作自己检查并停止。

## 请求放弃后，后台工作该怎么办

浏览器关闭请求或操作超过期限，继续耗时查询可能浪费资源。context是Go标准库的一种对象，用来沿调用关系传递取消、期限等信息。它不是goroutine，也不是系统强行终止线程的开关。

**调用cancel只发出取消信号，工作函数必须检查信号或把ctx传给支持取消的操作。** 数据库的QueryContext以及HTTP请求上下文都使用这条机制；仅创建ctx却不传下去没有效果。

## select 怎样观察通道

前面学会 `<-ch` 接收。select可以列出多个通道操作，执行当前可进行的一项。ctx.Done返回一个用于取消通知的通道；取消时它关闭，因此接收立刻可进行。default表示没有可进行分支时立刻走这里；没有default则等待。

如果多个分支同时可进行，不保证总选你希望的某个分支。不能拿select当按源代码先后排序的if。

## 完整程序：取消传入求和函数

在独立Go练习目录替换main.go：

```go
package main

import (
	"context"
	"fmt"
)

func sum(ctx context.Context, values []int) (int, error) {
	total := 0
	for _, value := range values {
		select {
		case <-ctx.Done(): // 取消通道已关闭时，停止本函数而不是继续计算。
			return 0, ctx.Err()
		default:
			total += value // 没有取消信号，继续这一小步工作。
		}
	}
	return total, nil
}

func main() {
	// Background创建没有取消期限的根上下文，WithCancel派生可取消的一份。
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel() // 正常离开也释放关联资源，多次调用cancel是安全的。
	cancel() // 故意先取消，让本例结果确定，不靠Sleep猜时机。
	value, err := sum(ctx, []int{1, 2, 3})
	if err != nil {
		fmt.Println("已取消")
		return
	}
	fmt.Println(value)
}
```

```sh
go run .
```

输出：

```output
已取消
```

ctx由main传到sum，sum每一步都观察Done。`ctx.Err()` 返回取消原因，本例为context.Canceled。sum返回错误，main不把0当作计算成功。**工作停止是sum里return的效果，不是cancel替它执行return。**

## 期限是另一种取消来源

在已有函数里，可以导入time后派生有期限的上下文：

```go
// 片段：parent是已有请求上下文；将ctx传给后续实际工作。
ctx, cancel := context.WithTimeout(parent, 5*time.Second)
defer cancel()
```

期限到后Done关闭，Err通常是context.DeadlineExceeded。cancel仍要释放计时资源。请求处理里使用r.Context作为parent，能继承客户端取消；若改用Background，可能切断原请求的取消关系。

调用支持ctx的数据库方法可以让操作观察取消；某个不支持取消的慢函数、CPU循环或阻塞调用，并不会因为外面有ctx就自动停止。检查间隔与依赖实现决定响应速度。

## 预测再改动

删去main中显式提前cancel，保留defer，再运行应输出6。随后仅在自己的实验副本里删掉sum的取消检查、恢复提前cancel，预测仍会输出6：这正说明工作没观察信号。还原后通过。

只有 `<-ctx.Done()`、没有其他可推进任务而且没有取消者的纯程序，可能报deadlock，不要把它统一描述成“等待后一定能继续”。

### 参考答案

取消信号、观察信号、return或依赖停止，三个环节缺一不可。WithTimeout也不是保证所有任意代码在5秒内终止。

## 独立变式

编写接收ctx的查找函数，每项检查取消。使用提前取消与未取消两种输入，分别检查错误和实际查找结果，不使用Sleep判断完成。

参考：[Go context](https://pkg.go.dev/context)、[select语句](https://go.dev/ref/spec#Select_statements)。
