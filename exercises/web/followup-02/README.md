# 社团活动展示站：本机到发布的练习

已实现：静态JSON读取、关键词筛选、加载/空结果/失败重试、键盘操作；另有本机GET API用于查看HTTP合同。无账号、报名、数据库。Node服务仅监听127.0.0.1，不用于公网生产。

环境：Node.js 22或更新的受支持LTS，使用Node自带npm；`node --version`、`npm --version`应显示版本。VS Code打开本目录，终端运行`npm ci`（无第三方依赖），`npm test`，`npm start`，访问 http://127.0.0.1:8762/ 。Ctrl+C停止。若PowerShell拦截npm.ps1，使用`npm.cmd ci`、`npm.cmd test`、`npm.cmd start`，不要为此关闭系统执行策略。

验证：初次3条；搜索算法1条；搜索不存在0条；全空格给错误；离线后重新读取给失败，恢复网络后能重试。360/768/1440px检查布局，Tab/Enter操作。`npm test`断言200/400/404/405、筛选与静态资源限制。它不替代真实浏览器/手机验收。

API（本机）：GET /api/events?keyword=算法 返回`{"items":[{"id":1,"title":"算法入门"}],"count":1}`；关键词41字返回400；POST返回405。GitHub Pages不运行此API，所以网页读取`./events.json`。

静态发布：把index.html、style.css、app.js、events.json、README.md、.gitignore、package.json与package-lock.json放到自己独立练习仓库的根目录（Node文件只用于本机验证），按[完整Git/Pages讲义](../../../docs/followups/web-02.md)操作。网址通常含仓库名，所有资源用`./`相对路径。不要把真实密钥提交；不要推送node_modules。课堂代码不会替用户建立远程仓库或创建PR。

调试记录例：模拟events.json 404 → Network确认GET地址和404 → 核对大小写与发布目录 → 恢复正确路径 → 刷新后3条且无请求错误。截图请自己测试后保存，未附伪造运行截图。
