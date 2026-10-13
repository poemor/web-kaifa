# 活动前端阶段 03 可运行参考

配套详细讲解：[web-03](../../../docs/followups/web-03.md)。全部活动为本地固定演示数据，不提供账号、服务器报名或云同步。

## 环境与启动

Node 24 LTS（至少24.15.0）及随官方安装器提供的npm；使用现代浏览器。Windows PowerShell在本目录执行（macOS/Linux把npm.cmd/npx.cmd改为npm/npx）：

```powershell
npm.cmd ci
npm.cmd run dev
```

打开 http://127.0.0.1:8803/ ，Ctrl+C停止。手建版缺lock时先npm install生成lock，下载源码已有完整lock。8800系列为dev，8900系列为构建preview，避免打开错项目。

## 验证

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

preview为 http://127.0.0.1:8903/ 。搜索图论只显示一项，不存在词显示空结果；依次验证正常/空数据/字段错误/HTTP404/JSON错误/业务失败。固定fixtures的时间只是展示字符串，没有实现时区和日期有效性检查。Vite mpa配置防不存在的JSON被SPA首页回退伪装200，前端路由使用hash。

## 文件与协作

保留package.json/package-lock.json，勿提交node_modules、dist、真实.env.local、测试产物。依赖固定在已验证组合，升级后重跑全部命令。模板来自本仓库编写的自制教学例，不包含真实用户资料。
