# slice、map 与 Unicode：数据怎样被保存和遍历

词频统计看起来只是加一，但实际上要决定：怎样拆词、大小写是否算同一个词、并列怎么排序、中文字符串怎样计数。数组、切片、map 和字符串分别承担不同职责。先学会预测共享和缺失值，再写完整统计；否则“这次打印正常”可能只是偶然。

## 数组与切片：长度和容量不是同一件事

`[3]int{1,2,3}` 是固定长度数组；`[]int{1,2,3}` 是切片。切片描述一段底层数组，包含起点、长度和容量。`len` 是当前可访问的元素数，`cap` 是从起点到该底层数组末尾能容纳的元素数。`a[:2]` 取前两个元素，右边界不包含在结果中。它通常共享底层数组，因此 `b[0]=9` 可以改变 `a[0]`。

`append` 必须接住返回值，例如 `a = append(a, 4)`。容量足够时可能复用旧数组，不足时会分配新数组，因此不能用一个例子断言 append 总共享或总复制。为了独立保存整数切片，用 `make` 后 `copy`。这复制的是元素值；若元素是指针、map 或切片，内部引用的对象仍可能共享，这是浅复制。

这段是**独立观察片段**，放进 main 后运行：`items := make([]int, 2, 5)`，接着 `fmt.Println(len(items), cap(items), items)`，预期 `2 5 [0 0]`。make 的第二参数创建两个当前元素，第三参数预留容量五；不能因为 cap=5 就访问 items[4]，可访问索引必须小于 len=2。执行 `items = append(items, 7)` 后再打印，预期 `3 5 [0 0 7]`。容量是追加能力，不是已经存在的长度。

## map：按键读取，以及“没有”与“为零”

`make(map[string]int)` 创建可写的 map，键是字符串，值是整数。`counts[word]++` 读到缺失键的零值，再加一并保存，所以适合计数。读取 `value, ok := counts["rust"]` 的第二个结果说明键是否存在；单看 `value==0` 无法区分缺失与明确存了零。nil map 可以读取和取长度，但向它赋值会 panic；先 `make` 或使用字面量初始化。

map 遍历顺序未规定。稳定排行榜应收集键，再排序；不能通过多运行几次看到同样结果就依赖它。相同次数时加字典序作为第二规则，使验收可重现。`delete` 删除键；删除不存在键不会出错。map 也不会自动给多个 goroutine 同步，进入并发课时必须处理共享访问。

## 字节、rune 和人眼看到的字符

UTF-8 字符串存字节。`len("Go你好")` 是 8：两个 ASCII 字节，加两个汉字各三个字节。`[]rune` 或 `utf8.RuneCountInString` 对有效字符串数 Unicode 码点，这里是 4。`range` 字符串返回的索引是**字节偏移**，值是 rune。它不是数组里第几个汉字。某些表情、组合音标由多个码点组成，所以 rune 数仍不是所有场景的人眼字符数；这份练习不实现字形簇分割。

## 在 VS Code 运行：main.go 完整程序

打开 `exercises/go/go-collections`，新建 `main.go` 保存下面代码。首次在该目录执行 `go mod init example.com/learn/go-collections`，然后 `go fmt ./...`、`go run .`。输出在终端；不用安装第三方依赖。

```go
package main

import (
	"fmt"
	"sort"
	"strings"
	"unicode/utf8"
)

func main() {
	a := []int{1, 2, 3}
	b := a[:2]
	b[0] = 9
	c := make([]int, len(a))
	copy(c, a)
	c[0] = 7
	fmt.Println("共享：", a, b)
	fmt.Println("复制：", a, c)
	counts := make(map[string]int)
	for _, word := range strings.Fields("Go go WEB") {
		counts[strings.ToLower(word)]++
	}
	keys := make([]string, 0, len(counts))
	for word := range counts {
		keys = append(keys, word)
	}
	sort.Slice(keys, func(i, j int) bool {
		if counts[keys[i]] != counts[keys[j]] {
			return counts[keys[i]] > counts[keys[j]]
		}
		return keys[i] < keys[j]
	})
	for _, word := range keys {
		fmt.Printf("%s:%d\n", word, counts[word])
	}
	value, exists := counts["rust"]
	fmt.Printf("rust：%d，存在=%t\n", value, exists)
	text := "Go你好"
	fmt.Printf("字节=%d，码点=%d\n", len(text), utf8.RuneCountInString(text))
	for offset, ch := range text {
		fmt.Printf("偏移 %d：%c\n", offset, ch)
	}
}
```

```output
共享： [9 2 3] [9 2]
复制： [9 2 3] [7 2 3]
go:2
web:1
rust：0，存在=false
字节=8，码点=4
偏移 0：G
偏移 1：o
偏移 2：你
偏移 5：好
```

关键的执行链是 `Fields` 按空白拆分 → `ToLower` 归一化 → map 累加 → 收集键 → 按规则排序 → 输出。`Fields` 不做中文分词，也不会自动剔除标点；`go,` 与 `go` 是不同键。说明限制是数据处理的一部分，不要悄悄修改输入后声称支持所有自然语言。

## 改一个输入

1. 把词频输入改成 `b a`，相同次数时输出谁在前？
2. 把词频输入改成三个空格，应有几行词频输出？
3. 在读取rust前加入 `counts["rust"] = 0`，value和exists分别是什么？
4. 合上例子，实现只返回次数至少为二的词，并保证稳定顺序。

### 参考答案

把输入改成 `b a`，参考输出顺序是 `a:1`、`b:1`，验证并列排序。改成三个空格，词频输出没有任何行，缺失键仍得到 `0,false`。把 `counts["rust"] = 0` 放到读取前，得到 `0,true`，解释存在标记。合上代码实现“只返回次数至少为二的词”，不要一边遍历未排序的 map 一边把输出顺序当成答案。

自查：你能指出何时共享、何时复制，解释 len 与 cap，说明 nil map 为什么可读不可写吗？能预测中文的字节偏移，而不把它当字数吗？遇到 panic 先查看访问下标是否小于 len，不要随手增加容量来掩盖越界。

官方参考：[切片](https://go.dev/tour/moretypes/7)、[map](https://go.dev/tour/moretypes/19)、[Go 字符串、字节与 rune](https://go.dev/blog/strings)、[sort](https://pkg.go.dev/sort)。
