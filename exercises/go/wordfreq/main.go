package main

import (
	"fmt"
	"os"
	"sort"
	"strings"
)

// 一条排名记录同时保存词名和出现次数。
type Entry struct {
	Word  string
	Count int
}

// Count 按空白拆词并统一大小写；标点仍是单词的一部分。
func Count(text string) []Entry {
	counts := make(map[string]int) // 先用键值表累加每个词的次数。
	for _, word := range strings.Fields(text) {
		counts[strings.ToLower(word)]++
	}
	// 长度 0 表示还没有记录，容量只预留空间；后面用 append 添加。
	result := make([]Entry, 0, len(counts))
	// map的两个结果是单词键和次数值；把一对键值转成一条排名记录。
	for word, count := range counts {
		result = append(result, Entry{Word: word, Count: count})
	}
	// 把比较函数交给排序工具：i、j 是两项下标，true 表示 i 应在前面。
	sort.Slice(result, func(i, j int) bool {
		if result[i].Count != result[j].Count {
			return result[i].Count > result[j].Count // 次数多的排在前面。
		}
		return result[i].Word < result[j].Word // 并列时用词名决定顺序。
	})
	return result
}

func main() {
	text := "Go go WEB" // 没有命令行参数时使用这个默认短文本。
	if len(os.Args) > 1 {
		// 第 0 项是程序路径；这里只合并用户传入的后续参数。
		text = strings.Join(os.Args[1:], " ")
	}
	for _, item := range Count(text) {
		fmt.Printf("%s:%d\n", item.Word, item.Count) // 每项打印一行“词:次数”。
	}
}
