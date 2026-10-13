# 分页参数与稳定排序

先定义每页和第几页，再校验范围，计算跳过数量并固定数据顺序。

## 分页是在一份列表中取一段

假设有60条记录，一次只展示20条。page表示页码，limit表示每页最多几条，offset表示从开头跳过多少条。这里页码从1开始，偏移从0开始。

| page | limit | offset | 静态列表中的位置 |
| --- | --- | --- | --- |
| 1 | 20 | 0 | 第1–20项 |
| 2 | 20 | 20 | 第21–40项 |
| 3 | 20 | 40 | 第41–60项 |

所以 `offset = (page - 1) * limit`。不足一页返回剩余项，超出数据末尾返回空列表；空结果与非法参数是不同情况。

**分页参数来自外部输入，应先转整数并验证，再计算和查询。** 本例先固定整数演示公式；真实HTTP读取用前面Query/Atoi的步骤。

## 完整计算程序

在独立Go练习目录替换main.go：

```go
package main

import "fmt"

func main() {
	page, limit := 2, 20
	// 给page上限，避免任意巨大整数在后面乘法中溢出。
	if page < 1 || page > 1000000 || limit < 1 || limit > 100 {
		fmt.Println("非法分页")
		return
	}
	offset := (page - 1) * limit // 本规则下最大不足一亿，在32位int范围内。
	fmt.Println(offset)
}
```

```sh
go run .
```

输出：

```output
20
```

上限是本示例的接口选择，不是SQL强制值。生产项目可选择更小页码限制或游标分页；先明确合同。**此处只计算，尚未读取数据库。**

## 为什么还要 ORDER BY

下面是已有Repository查询片段，需要db、ctx及已校验limit/offset。SQL的参数按位置对应：

```go
// ORDER BY固定顺序，id唯一，避免相同标题让排序不确定。
rows, err := db.QueryContext(ctx,
	"SELECT id, title FROM practice_problems ORDER BY id LIMIT $1 OFFSET $2",
	limit, offset,
)
```

QueryContext返回多行结果，调用者检查err，成功后defer rows.Close，循环rows.Next/Scan，最后检查rows.Err。这些实际步骤见 [数据库项目](assets/downloads/web-followup-09.zip) repository.go的List；不要只复制片段就当数据已经读完。

没有ORDER BY，数据库不承诺固定行顺序；按非唯一时间排序时还应加id作平局规则。**排序稳定只解决相同数据的顺序；翻页期间新增或删除记录，offset分页仍可能重复或漏项。** 游标分页使用上一页末尾的排序键，属于后续扩展，不是假装本例已解决动态列表。

## 先预测边界，再运行

将固定值改为page=1、page=0、limit=0、limit=101、page=1000001，分别运行。第一页应0，其余拒绝。若请求里page是abc，应该在Atoi步骤拒绝，不能默认解释为第一页。

### 参考答案

默认参数只用于没有提供且合同允许的情况；明确错误值不能偷偷覆盖。工程followup-08/09的列表接口直接接受limit/offset，不是自动接受page；前端使用页码时应按合同转换。

## 独立变式

用1到12的整数切片，每页5项，实现前三页与第四页空结果。先写预期分段，再处理最后页的上界，避免直接切片越界；再将同样概念应用到SQL。

参考：[PostgreSQL LIMIT与OFFSET](https://www.postgresql.org/docs/current/queries-limit.html)。
