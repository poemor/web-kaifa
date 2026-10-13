package main

import "fmt"

func greeting(name string) string {
	return "你好，" + name
}

func main() {
	name := "Go"
	message := greeting(name)
	fmt.Println(message)
	fmt.Println("编译后的程序也能独立运行")
}
