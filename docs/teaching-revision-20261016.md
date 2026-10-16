# 教学内容补全记录

本次以“读者能独立写出并解释程序”为目标，重新检查系统教程。历史记录中的“审核通过”不能替代这次的内容复读。参考 [GoLang 文档的章节组织](https://www.golangdev.cn/zh-cn/guide/get-started.html)，具体语言行为以 [Go 规范](https://go.dev/ref/spec) 和 [Go 官方教程](https://go.dev/doc/tutorial/) 为准；补充讲解和题解由本仓库编写。

## 保存与当前范围

上游基线为 `33d24b9898517b8ec1cde3f9ec6933911d6e4a5c`，保留在 fork 的 `backup/before-teaching-rewrite-20261016` 分支。后续按批提交到 fork 的 main，不改写上游历史。材料原文和学习进度不因整理而更新。

| 批次 | 实际改动 | 验证 |
| --- | --- | --- |
| Go 入门 15 节 | 补充多文件入口、声明与交换、整数类型和转换、iota、位运算、分支顺序、switch、循环形式、函数值、闭包与递归开销；移除重复的词典式开头，重写针对具体错误的提示；参考答案提供完整程序和推导 | 23 份新增 Go 答案实际运行并核对输出；课程构建、站点检查、原教材哈希检查通过 |

答案检查清单在 `docs/courses/answer-checks.json`。运行 `GO_TOOLCHAIN_EXE=/path/to/go python3 scripts/check_course_answers.py` 会从正文直接提取答案代码并核对结果，默认使用 PATH 中的 go。原示例、交互和需要数据库的工程另按各自验证脚本检查；本表没有把未执行的检查记成通过。

Linux 检查时发现旧下载包的换行和排序依赖制作平台。本次让源码 ZIP 检查接受等价的 CRLF/LF，打包顺序固定按文件名排序，并固定 VS Code 包的平台元数据；没有删除源码或替换原教材。
