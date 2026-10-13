# Go 环境教程补充记录

2026-10-13。补充源文件为 `docs/tutorials/go-environment.md`，生成后的网页正文为 `assets/data/getting-started.js`。原始 `materials` 教材与学习进度未改动。

## 本次补齐

- 按当前卡点选择起点，下载、Windows、macOS、Linux、PATH 五个章节支持 URL 直达。
- 系统与处理器查看方法，amd64 / arm64 / darwin / msi / pkg / tar.gz / Source 的解释。
- Windows 安装向导、重新打开终端、命令位置与 PATH 的检查；macOS 安装和 Linux 安装方式边界。
- GOROOT、GOPATH、GOMOD 与练习目录的区别，现代模块练习不要求放进 GOPATH/src。
- 大屏随正文保留章节目录，小屏按原顺序显示；复制与阅读不执行代码、不写学习完成状态。

## 截图来源

`assets/images/tutorials/go-downloads.png` 是通过本机 Edge 的 Playwright 浏览器从 [Go 官方下载页](https://go.dev/dl/) 截取的真实页面，拍摄日期2026-10-13，1280 × 900像素。没有替换版本号或修改网页内容；截图只帮助辨认推荐下载与稳定版本表，实际文件名、版本、系统支持要求以官网下载页为准。图片在网页中可点击查看原图，离线阅读使用本地文件。

操作说明根据 [Go 官方安装说明](https://go.dev/doc/install)、[系统要求](https://go.dev/wiki/MinimumRequirements)、[Go 命令环境变量文档](https://pkg.go.dev/cmd/go#hdr-Environment_variables) 及 [VS Code Go 文档](https://code.visualstudio.com/docs/languages/go) 核对。用户的菜鸟教程截图用于确认说明粒度，没有搬运正文或截图。

## 验证与边界

运行 `node scripts/check_site.cjs` 检查生成正文、资源哈希与内容引用，运行 `node scripts/test_getting_started.cjs` 实际验证 Go 示例、保存/构建/重建/输入/错误恢复与四篇教程布局。`node scripts/test_go_start_path.cjs` 检查新增安装直达、搜索、刷新、图片加载、章节目录与进度保留；`node scripts/test_site.cjs` 验证全站交互和备份恢复。

没有在这台已经安装 Go 的电脑上重复执行三种操作系统的全新安装；安装向导、macOS 与 Linux 部分是依据官方资料编写的操作说明。本机运行验收使用现有的 Go 工具链。Linux 需要按实际发行版、权限和既有安装方式选择步骤，不提供自动删除旧安装的命令。
