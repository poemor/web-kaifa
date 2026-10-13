# 活动前端阶段 06 可运行参考

配套详细讲解：[web-06](../../../docs/followups/web-06.md)。全部活动为本地固定演示数据，不提供账号、服务器报名或云同步。

## 环境与启动

Node 24 LTS（至少24.15.0）及随官方安装器提供的npm；使用现代浏览器。Windows PowerShell在本目录执行（macOS/Linux把npm.cmd/npx.cmd改为npm/npx）：

```powershell
npm.cmd ci
npm.cmd run dev
```

打开 http://127.0.0.1:8806/ ，Ctrl+C停止。手建版缺lock时先npm install生成lock，下载源码已有完整lock。8800系列为dev，8900系列为构建preview，避免打开错项目。

## 验证

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

preview为 http://127.0.0.1:8906/ 。搜索图论只显示一项，不存在词显示空结果；依次验证正常/空数据/字段错误/HTTP404/JSON错误/业务失败。固定fixtures的时间只是展示字符串，没有实现时区和日期有效性检查。Vite mpa配置防不存在的JSON被SPA首页回退伪装200，前端路由使用hash。

## 浏览器流程测试与Vue比较入口

先停止自己的dev服务，测试会自动启动独立端口：

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

已有Edge可用 `$env:PW_CHANNEL='msedge'` 后执行test:e2e（Shell为PW_CHANNEL=msedge npm run test:e2e）；实际需安装Edge。Linux按Playwright文档安装浏览器依赖。测试覆盖真实浏览器搜索、详情刷新、错误、断网重试、过期请求、360/768/1440；trace/screenshot仅保存在忽略的test-results。

Vue基础可选入口是同端口 `/vue.html`，可搜索两条固定活动，构建也包含vue.html。本课主路线为React；Vue入口不提供React路线的所有功能，tsc只检查TS/TSX，未执行vue-tsc完整SFC类型检查。基础输入/列表由实际浏览器验收。

## 资源体积实验

npm的predev/prebuild/prepreview执行scripts/make-performance-assets.mjs，生成同图原/优化SVG；它们是可重建实验资源，不进源码提交。资源页可切换，真实HTTP响应body为192195与188bytes。原版人为添加大量注释，实验不代表整体网站性能速度提升，Lighthouse成绩须自己相同设置实际测量。

## 分页、收藏、部署与已知限制

页大小2，先筛选再切片；收藏只在当前浏览器localStorage，不上传、不同设备不互通、不自动同步多标签。异常记录保留且警告，仅暂存新收藏；源码没有清空学习状态的行为。只看收藏与页码为当前界面状态，刷新不保留这两项。

`.github/workflows/pages.yml` 是给自己的独立作品仓库使用的示例，将本目录内容放在那个仓库根目录才执行。它未在学习仓库实际运行，也未发布新的独立作品。自己的GitHub Settings/Pages选Actions后才按讲义发布。主站接入教程不等于替学习者完成作品。生产数据、服务器权限、真实报名、服务端分页均未实现；表单只本地验证虚构字段并准确说明未提交。

## 文件与协作

保留package.json/package-lock.json，勿提交node_modules、dist、真实.env.local、测试产物。依赖固定在已验证组合，升级后重跑全部命令。模板来自本仓库编写的自制教学例，不包含真实用户资料。
