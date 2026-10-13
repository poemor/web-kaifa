# 基准、性能剖析与证据

先守住正确性，再固定输入测量耗时与分配，用剖析寻找真正花资源的地方。

## 说“慢”需要先指出哪一步

一次请求可能慢在数据库、网络、锁等待或程序计算，页面慢不代表每个Go函数都慢。基准测试重复执行指定代码，估计每次操作时间与分配；性能剖析收集执行样本，帮助定位CPU或内存开销。

**先定义要测的操作和输入，不能凭代码风格声称优化。** 基准不是HTTP负载测试，pprof也不是自动修复性能问题的工具。

## 使用已经实现的词频函数

打开独立模块exercises/go/wordfreq，完整源码与启动见 [词频项目](#/learn/go/go-project-wordfreq)。main.go中Count按空白分词、转小写、统计并排序；先运行go test确认正确性。

在同目录新建benchmark_test.go，把以下完整文件保存进去，不覆盖原main_test.go：

```go
package main

import "testing"

// 保存结果，避免基准工作仅成为无意义的可消除表达式。
var benchmarkResult []Entry

func BenchmarkCount(b *testing.B) {
	text := "Go go Web" // 固定输入，这个基准不测文件读取或HTTP。
	for i := 0; i < b.N; i++ {
		benchmarkResult = Count(text) // 重复调用已有真实函数，不另写一份假Count。
	}
}
```

Benchmark名字和 `*testing.B`是测试工具规定的入口。b.N由工具调整，让测量持续足够时间；它不是你写死的业务数据量。Entry与Count来自同包的已有源码，不能把此文件单独go run。

## 运行并读懂指标

在wordfreq模块终端：

```sh
go test ./...
go test -run='^$' -bench=Count -benchmem -count=5
```

`-run='^$'`不执行普通测试（普通测试已先单独跑），`-bench=Count`选择基准，benchmem显示分配，count=5重复五次。Shell中的引号包住正则，Windows PowerShell同样可用。

典型结果包含BenchmarkCount、次数、ns/op、B/op、allocs/op，具体数字以实际运行而定：ns/op是每次操作纳秒，B/op是每次分配字节数，allocs/op是每次分配次数。次数不是总输入词数。记录Go版本、机器、输入长度、测试命令与五次结果，先看波动。

## 剖析怎样补充“哪里慢”

对同一基准生成CPU与内存样本：

```sh
go test -run='^$' -bench=Count -cpuprofile=cpu.out -memprofile=mem.out
go tool pprof -top cpu.out
```

这会产生本机profile文件及测试可执行产物；属于测量产物，不进Git。top按采样开销展示函数，flat是函数自身采样，cum包括调用的下层。小输入短运行可能样本很少，不应从空或稀疏样本推出结论。CPU样本不是直接的数据库等待时间。

内存可用 `go tool pprof -top mem.out` 查看，采样选项不同回答的指标不同。内置pprof网页服务和图形依赖可后续选学，不为读本章就开放生产诊断接口。

## 预测再比较一个改动

在自己的词频副本只改一项分配策略，保持分词、大小写和并列排序合同不变。先跑所有正确性测试，再同输入重复基准并比较时间与分配。**一次更小数字不证明优化稳定；改变正确结果的“更快”不能保留。**

故障实验：故意让Count不处理空输入或排序颠倒，正确性测试应先失败；不能因为基准还能运行就称质量通过。还原后再测。

### 参考答案

测量方法、输入规模和环境要可比较。完整请求慢时需要另外检查真实请求链与数据库，不能把微基准的改善数字直接当网页提速。

## 独立变式

添加较大固定输入的BenchmarkCountLarge，与原小输入分开报告。写下是否包含输入构造时间，确保前后版本使用相同测量边界，再解释差异。

参考：[Go诊断文档](https://go.dev/doc/diagnostics)、[testing基准](https://pkg.go.dev/testing#hdr-Benchmarks)。
