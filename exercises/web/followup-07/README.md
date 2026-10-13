# 全栈前端：React / TypeScript / Vite + HTTP mock

完整逐步讲义：[第07阶段](../../../docs/followups/web-07.md)。在 VS Code 打开本目录（package.json所在层），Node满足Vite要求，源码下载已有lockfile：

```powershell
node --version
npm ci
npm test
npm run build
```

两个终端分别 `npm run mock`、`npm run dev`。浏览器访问 http://127.0.0.1:5173/ 。保持两个进程运行，Ctrl+C分别停止。PowerShell限制npm.ps1时改用npm.cmd，不修改全局策略。

验证：列表一条图论训练；提交新活动POST201后GET显示新项；点击详情改变hash并可返回。mock终端设置 `$env:MOCK_MODE='empty'` / error / shape / slow 后重启，依次验证空、500、错误形状、5秒超时。macOS/Linux `MOCK_MODE=error npm run mock`。恢复清除该变量。

`npm run build`生成dist；`npm run preview`默认4173时mock需设置MOCK_ORIGIN=http://127.0.0.1:4173并重启。MOCK_PORT默认8777。前端公开地址用VITE_API_BASE，默认127.0.0.1:8777；连接第08课改.env为8768，重启Vite，同时Go开启精确5173来源。

边界：mock为受控HTTP教学服务，内存重启会丢新数据，无登录/权限/数据库。前端不能存真实秘密。列表详情仅在已加载列表中查id，正式大数据需独立详情请求。源码包内依赖/构建输出不提交，学习运行成功不自动更新课程完成。
