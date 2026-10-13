package main

import "fmt"

// TotalMinutes 将每天的分钟数和天数相乘，返回计划总分钟数。
func TotalMinutes(minutes, days int) int {
	return minutes * days
}

func main() {
	minutes := 20 // 输入：每天计划练习 20 分钟。
	days := 3     // 输入：计划练习 3 天。
	total := TotalMinutes(minutes, days)
	// %d 依次替换为 days 与 total，两个位置不要颠倒。
	fmt.Printf("%d 天共练习 %d 分钟\n", days, total)
	if total >= 60 {
		fmt.Println("已达到本次一小时目标")
	} else {
		fmt.Println("继续安排下一次练习")
	}
}
