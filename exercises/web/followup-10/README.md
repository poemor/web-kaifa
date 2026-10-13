# 安全会话、权限与个人报名

完整逐步教学与权限矩阵：[第10阶段](../../../docs/followups/web-10.md)。Go1.26.9+（或当前稳定补丁版），打开此独立模块。

```powershell
go mod download
go vet ./...
go test -v ./...
$env:ADMIN_USER='club_admin'
$env:ADMIN_PASSWORD='替换自己的至少12字符练习密码'
go run .
```

macOS/Linux用export。默认 http://127.0.0.1:8770/ 。管理员创建活动，普通成员注册后登录；用两个独立浏览器上下文做A/B隔离，普通标签页共享Cookie不算两用户。环境密码仅用于首次bootstrap，已有管理员不自动改密码，同名普通成员拒绝提权。

默认内存模式明确重启丢账户/报名。持久模式：独立数据库001/002/003迁移完，设置DATABASE_URL/PGPASSWORD再启动；第09课已经001/002只加003。旧种子members没有hash，不能用统一密码登录，请创建新账号。Go不自动读.env，示例值必须替换。

公开GET活动；管理员POST/PATCH/DELETE活动需身份+admin+CSRF；成员GET自己的报名，POST /api/registrations仅eventId，DELETE /api/registrations/{id}只能owner。登录POST /api/login、注册POST /api/register、GET /api/me、POST /api/logout。登录/me返回csrfToken，写请求X-CSRF-Token；Cookie HttpOnly/Lax，15分钟服务端过期。

验证go test覆盖401/403/CSRF/伪memberId/A-B404/重复409/注销旧Cookie401/过期401/429/随机盐。前端所有用户文字textContent输出。密码用维护中的Argon2id库64MiB/3轮/4路，哈希两并发；不是SHA256或自制密码算法。

生产边界：APP_ENV=production要求HTTPS APP_ORIGIN与DB并设Secure Cookie。当前单实例内存session/限速不共享，代理IP未适配、账户恢复/邮箱/MFA/持久撤销/监控未实现；不能直接用弱开发配置接真实用户。详细生产条件见11。真实密码/Cookie/token/哈希/DSN不入日志/Git/AI问题。
