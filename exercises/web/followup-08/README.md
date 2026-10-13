# 自己的CRUD API：Go内存版

完整逐步讲义与API合同：[第08阶段](../../../docs/followups/web-08.md)。VS Code打开本目录，Go1.26.9+（或当前稳定补丁版），不要在资料仓库根目录初始化模块。

```powershell
go fmt ./...
go vet ./...
go test -v ./...
go run .
```

浏览器 http://127.0.0.1:8768/ 。同源前端无需CORS；health GET200。API：GET /api/events（q/limit/offset），GET /api/events/{id}，POST创建201，PATCH至少title或location一项更新200，DELETE204。JSON仅title/location，标题trim后1–100字符，地点最多100。错误为error.code/message，非法body400、超过8KiB413、格式415、缺失404。PATCH null按未提供处理，清空地点用空字符串。

验证：新增→读取→仅改地点→删除→再读404；纯空格/数组标题/未知role400；curl与浏览器均能操作。Windows使用curl.exe，复杂JSON用文件--data-binary，详见讲义。测试包含CRUD/失败/CORS/500不泄漏细节。

连接前一课Vite：在Go终端设置 `$env:ALLOWED_ORIGIN='http://127.0.0.1:5173'`（macOS/Linux用export），前端.env设置VITE_API_BASE=http://127.0.0.1:8768并重启。APP_ADDR默认127.0.0.1:8768；Go不会自动读取.env。

替代路线有完整alternatives/express和alternatives/fastapi。先停止同端口Go，Express目录npm ci/npm start；FastAPI建立自己的.venv并安装requirements，再fastapi dev。FastAPI422/detail与完整输入PATCH不同，不能当完全相同合同。安全/SQL后续采用Go主例。

已知限制：内存存储，重启恢复种子；无身份/权限/数据库，只监听本机教学，不能公开给真实用户。CORS不防直接调用。Ctrl+C优雅停止不会把内存保存。不要将真实用户数据、密码、依赖、编译产物提交。
