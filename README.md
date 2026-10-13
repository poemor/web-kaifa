# 开发练习册：Web 与 Go

给第一次写代码的人，也给已经会一点编程、想转学 Web 或 Go 的人。选一节课，先动手；卡住时，用 AI 提问台把自己的目标、代码和报错整理清楚，再回到代码里验证。

**在线阅读：[打开开发练习册](https://zhouwu97.github.io/web-kaifa/)。**

**本机阅读**：下载或克隆仓库，双击 [index.html](index.html)。课程、提示模板和进度功能不需要安装依赖；官方资料入口需要联网。

## 网页里可以做什么

- 选择“第一次写代码”或“写过代码”，按自己的起点进入路线。
- 学习 Web 前 14 天与 Go 28 天，每节有任务、完整讲义、提示、验收与小测。Web 后续 12 个阶段提供直接展开的详细讲义和独立源码 ZIP：从布局、JavaScript、Git 到 TypeScript、React/Vue、测试、Go API、SQL、认证和备份恢复。
- 用知识地图阅读 24 个 Web / Go 详细主题：原理、前置概念、完整示例、VS Code 操作、预期结果、排错与变式练习；课内直接展示对应完整讲解，JavaScript、DOM 和请求专题衔接后续阶段。
- 在练习工坊挑选 18 个分层任务，按起步提示、独立实现和加练要求练习，用输入输出表验收；四套配套 Web / Go 例子可在本机运行。
- 修改 Web 示例，在隔离预览中看到真实效果；Go 和 SQL 按讲义在自己的电脑上运行。
- 带着当前课程、自己的代码和报错整理 AI 提问；也可以复制 10 个具体场景模板。
- 在同一工作台切换本课任务、代码、验收与笔记；AI 助教默认收起，可按需带入课程和代码；大屏打开后与正文并列，窄屏在正文后、页脚前排列，收起后返回原位置。
- 阅读“怎样用 AI 开发”，练习描述需求、拆小任务、带证据排错与自己验证。
- 保存课内笔记和代码草稿，导出 / 导入 JSON，或导出 Markdown 留在仓库。

本站不使用付费模型 API，不要求 API Key。未连接扩展时提问台整理可复制文字；连接扩展后可直接在右侧使用自己的 AI 官网对话。进度保存在当前浏览器，不会自动同步到 GitHub。原互动手册的记录与新网页分开保存。

另有可手动安装的 [官网对话桥接扩展原型](projects/web/ai-browser-bridge/README.md)：在自己的窗口中操作已登录的 AI 官网标签页，不使用付费模型 API。七家候选适配器的真实账号验证尚未完成；安装新版扩展后直接使用本站右侧的同一份聊天界面；未安装时保留本地提问工具。

网页使用方法见 [学习网站说明](docs/site-guide.md)。

内容参考了 MDN、The Odin Project、Go 官方教程、Go by Example 与 Exercism 的课程与练习组织方式。具体依据与改动范围见 [知识与练习优化记录](docs/learning-content-upgrade.md)。补充讲解由本仓库编写，原教材保持原样。

## 从这里开始

第一次准备环境可先打开网站的“安装与起步教程”：包含 VS Code 下载、Web / Go 环境检查、常见报错和六项 AI 提问练习。离线文字版：[安装 VS Code](docs/tutorials/vscode.md)、[Web 环境](docs/tutorials/web-environment.md)、[Go 环境](docs/tutorials/go-environment.md)、[学会问 AI](docs/tutorials/asking-ai.md)。

Go 的 VS Code 第8–13节有真实界面截图、Go 插件与 gopls/dlv 安装步骤、四个完整工作区配置、任务运行和 F5 断点调试。可直接 [下载带配置的 Go 起步包](assets/downloads/vscode-go-starter.zip)，解压后打开独立项目，按 README 验证。cmd、PowerShell 与 macOS/Linux 的命令分开说明；复制代码与配置后仍需保存并主动运行。

后续阶段的正文源在 [docs/followups](docs/followups)，配套在 `exercises/web/followup-00` 至 `followup-11`。每份 README 写明所需工具、启动、验证与边界；后端例子必须本机运行，静态学习网站不会替你启动数据库或服务器。素材制作、SVG/PNG 使用、响应式裁切与导出在第00阶段。[本轮完整审核](docs/followup-completion-review.md)

| 路线 | 互动手册 | Markdown 教材 | 学习进度 |
| --- | --- | --- | --- |
| Web 前端 / 全栈 | [Web 学习手册](materials/web/学习手册.html) | [Web 学习路线](materials/web/学习路线.md) | [Web 进度](progress/web.md) |
| Go 后端 | [28 天互动学习手册](materials/go/28天互动学习手册.html) | [完整学习清单](materials/go/完整学习清单.md) | [Go 进度](progress/go.md) |

上表是保留的原始教材。日常学习可从新网页开始；需要对照时再打开原手册。GitHub 仓库页面显示 HTML 源码，互动阅读请使用在线站点或本机文件。

**后续学习安排**：见 [学习计划](docs/study-plan.md)。先理解知识点，再写练习、保存验收结果，最后更新进度。

## 目录怎么用

```text
web-kaifa/
├── index.html            学习网站入口，支持本机打开
├── tokens.css            统一颜色、字体和间距
├── assets/               网页交互、课程、AI 模板和官方资料
├── materials/            教材原文、资料包和来源校验记录
│   ├── web/              Web 前端与全栈教材
│   ├── go/               Go 后端教材
│   └── archives/         原始 Web ZIP 资料包
├── docs/                 学习安排和仓库使用说明
├── notes/                自己写的知识总结与问题记录
│   ├── web/
│   └── go/
├── exercises/            按知识点或日期整理的小练习
│   ├── web/
│   └── go/
├── projects/             可以独立运行的阶段项目
│   ├── web/
│   └── go/problem-tracker/  刷题记录 API 的待实现计划
├── progress/             可提交到 Git 的学习进度和导出备份
├── templates/            每日笔记与项目 README 模板
└── scripts/              教材、课程结构和浏览器交互检查
```

教材已经整理入库；学习任务和项目实现均从未完成状态开始。`projects/go/problem-tracker` 目前只包含计划，后续学习时逐步实现。

## 每次学完怎么保存

1. 阅读手册，在 `exercises/web` 或 `exercises/go` 写当天练习。
2. 复制 [每日笔记模板](templates/daily-note.md)，保存到对应的 `notes` 目录。
3. 写下运行结果和仍未解决的问题，通过教材验收后再勾选 `progress` 中的任务。
4. 导出互动手册的勾选记录，按 [进度备份说明](progress/README.md) 保存。
5. 在仓库根目录提交并推送：

```powershell
git status
git add .
git commit -m "study: record today's learning"
git push
```

更详细的约定见 [仓库使用说明](docs/repository-guide.md)。教材来源见 [资料索引](materials/README.md)，整理与补充审核见 [课程审核](docs/curriculum-audit.md)、[官方资料核验](docs/research-notes.md) 和 [AI 学习依据](docs/ai-learning-notes.md)。

## 本地预览与检查

直接打开 `index.html` 可阅读。开发时也可以在根目录启动静态服务器：

```powershell
python -m http.server 8743
```

然后访问 `http://localhost:8743/`。检查教材完整性与课程数据：

```powershell
python scripts/check_materials.py
node scripts/check_site.cjs
node scripts/test_site.cjs
node scripts/test_workbench.cjs
node scripts/test_learning.cjs
node scripts/test_getting_started.cjs
node scripts/test_site_assets.cjs
node scripts/test_knowledge_guides.cjs
node scripts/test_followup.cjs
node scripts/test_vscode_starter.cjs
```

浏览器集成检查位于 `scripts/test_site.cjs`，需要 Playwright 和本机 Edge，测试前先启动上述服务器。它覆盖课程入口、代码预览、完成规则、AI 上下文、记录备份和移动端布局；不要求学习者运行这些开发检查。

起步教程以 `docs/tutorials/` 为源文件，修改后运行 `node scripts/build_getting_started.cjs` 同步离线网页数据。任何入口 JS/CSS 修改后运行 `node scripts/version_site_assets.cjs`，将内容哈希写入入口资源地址，避免旧路由脚本与新页面混用；`check_site.cjs` 会检查数据与版本是否同步。已有标签页需要刷新一次才能加载新代码，不会清除学习记录。`test_getting_started.cjs` 实际运行 HTML 交互、Go 编译/重建/输入示例，因此需要本机 Go 工具链；`test_site_assets.cjs` 覆盖旧脚本地址被缓存的故障。

修改后续阶段先运行 `python scripts/build_followup_examples.py` 构建源码 ZIP 与校验清单，再运行 `node scripts/build_knowledge_guides.cjs` 同步正文与下载哈希。Go 起步包用 `python scripts/build_vscode_starter.py` 重建；四个配置源在 `docs/tutorials/configs/go`。打包只含源码、锁文件和教学素材，不含依赖目录、构建产物、真实环境变量或数据库数据。下载包与正文完整文件应保持一致。

开发审核可用 `node scripts/test_vscode_starter.cjs` 真正执行下载包的任务/构建失败边界。`node scripts/test_vscode_starter_debug.cjs` 验证 Delve DAP 断点与变量，需先准备受支持的 Go 补丁版和 dlv；可用 `GO_TOOLCHAIN_EXE`、`VSCODE_QA_DLV` 指定独立工具路径。脚本不安装软件或修改全局设置，实际运行在忽略的 QA 目录中；初学者不需要运行这些网站维护检查。

知识讲义源文件位于 `docs/knowledge/web/` 与 `docs/knowledge/go/`，修改后先运行 `node scripts/build_knowledge_guides.cjs`，再更新入口资源版本。每个目录的 `examples.json` 记录完整示例与可核对结果；示例内容必须与讲义同步。`test_knowledge_guides.cjs` 检查全部主题、课时映射、显示/复制/离线/学习状态，并实际运行独立 Web 和 Go 例子；数据库、容器、认证服务等额外环境的边界见讲义及 [知识内容审核](docs/knowledge-content-audit-2026-10-13.md)。

工作台扩展检查位于 `scripts/test_workbench.cjs`，使用相同环境。设计与审核记录见 [工作台改版说明](docs/workbench-redesign.md)。AI 服务选择仅表示工具偏好，当前没有真实登录、API 调用或流式回答。

知识与练习检查位于 `scripts/test_learning.cjs`，使用同一服务和浏览器环境，覆盖 44 个新增内容路由、筛选地址恢复、跨内容搜索、复制清单、隔离演示与配套 Web 练习的真实失败场景。配套 Go 练习的 `go test ./...` 在各自模块目录执行。
