# 查询参数与输入校验

把网址中的文字转换为有范围的整数，再计算；错误输入先返回 400。

## URL 中的数字仍然是文字

上一节的 `/health` 总是回复同一内容。现在请求 `/add?a=10&b=20`，希望得到两个数的和。`/add` 是路径；`a=10` 和 `b=20` 是查询参数，`&` 分开它们。

**客户端提供的内容必须先验证，不能因为看起来像数字就直接运算。**`r.URL.Query().Get("a")` 返回字符串；缺少 a 时会得到空字符串。`strconv.Atoi` 把十进制字符串转成 `int`，同时返回 error，转换失败时不能继续用这个结果。

本例限制每个输入为 0–10000，让支持范围清楚，避免两个任意大整数相加时溢出。支持负数或大数的接口可以有不同规则，但应明确制定。

## 完整程序：先读入，再转换，再校验

在独立练习目录替换 `main.go`：

```go
package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
)

func add(w http.ResponseWriter, r *http.Request) {
	// 查询参数来源是请求 URL，不是服务器终端输入。
	aText := r.URL.Query().Get("a")
	bText := r.URL.Query().Get("b")
	a, errA := strconv.Atoi(aText)
	b, errB := strconv.Atoi(bText)
	// 缺失、非整数或超出接口范围都走错误分支，且不写成功结果。
	if errA != nil || errB != nil || a < 0 || a > 10000 || b < 0 || b > 10000 {
		http.Error(w, "a and b must be integers from 0 to 10000", http.StatusBadRequest)
		return
	}
	// Fprint 写响应正文；最后 main 再把记录器中的正文打印到终端。
	if _, err := fmt.Fprint(w, a+b); err != nil {
		fmt.Println("写响应失败：", err)
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /add", add)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/add?a=10&b=20", nil)
	mux.ServeHTTP(rec, req)
	fmt.Println(rec.Code, rec.Body.String())
}
```

```sh
go run .
```

输出：

```output
200 30
```

此程序仍用内存模拟。若要在浏览器验证，把上一节的真实监听部分应用到 mux，主动运行监听；不能直接访问本例从未启动的端口。

## 按数据流读四步

1. `Query().Get` 取字符串 `"10"` 和 `"20"`。
2. `Atoi` 分别得到整数和错误，检查两个 error。
3. 检查业务范围。`http.StatusBadRequest` 是常量 400；`http.Error` 写状态和文字错误正文。`return` 立刻结束这个 Handler。
4. 两个数都合法才相加，把 `30` 写进响应。

`||` 表示“有一项成立就拒绝”。转换有错误时不要只打印错误后往下算。**错误响应写完要结束当前处理分支，否则可能在错误文字后继续写成功数据。**

## 逐项检查失败结果

每次只替换 `NewRequest` 的 URL，重新运行：

| 请求 | 预期状态 | 原因 |
| --- | --- | --- |
| `/add?a=10&b=20` | 200，正文30 | 两个值合法 |
| `/add?a=abc&b=20` | 400 | a不是整数 |
| `/add?b=20` | 400 | a缺失，空文字转整数失败 |
| `/add?a=-1&b=20` | 400 | 数字能转换，但违反本接口范围 |
| `/add?a=10001&b=20` | 400 | 超出上限 |

`http.Error` 的正文末尾带换行，输出多一空行不表示成功。这个例子使用 Get，若同一参数传多次只取一个值；需要严格接口时还应明确拒绝重复参数的规则。

## 自己改一处再运行

把单个输入上限改为 100，测试 100、101、缺失和小数 `1.5`。说明“格式合法”和“业务范围合法”的区别。

### 参考答案

100符合新的范围，101虽能转换仍应400。缺失和1.5都不能按本例转为整数。扩大范围时也要重新考虑求和溢出与接口约定。

参考：[Go strconv.Atoi](https://pkg.go.dev/strconv#Atoi)、[Go http.Error](https://pkg.go.dev/net/http#Error)。
