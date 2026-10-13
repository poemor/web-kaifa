# 完整系统的测试、部署、备份与恢复

完整逐项教学：[第11阶段](../../../docs/followups/web-11.md)。目录是独立完整起点，含Go安全服务、SQL迁移/真实集成测试、静态前端、Playwright、Compose、HTTPS代理、CI示例与恢复脚本。

原生启动：创建独立开发库并一次执行001→002→003，终端设置DATABASE_URL/PGPASSWORD/ADMIN_USER/ADMIN_PASSWORD，go mod download、go vet ./...、go test -v ./...、go run .。默认http://127.0.0.1:8770。API与权限合同同10，完整说明在其讲义；管理员必须先创建至少一条活动才有E2E报名目标。

测试：独立库TEST_DATABASE_URL名以_test结尾，go test测试专用schema并清理，SKIP不算真实DB通过；npm ci、npx playwright install chromium、npm run test:e2e；已安装Edge可E2E_EDGE=1。E2E只接受本机baseURL且生成假教学成员。trace失败保留。故意把匿名期望401改201应失败，修复后再通过。

Compose：先安装并启动Docker，docker version确认Server可用；复制.env.example为.env并填写自己独立练习密码。docker compose config --quiet，docker compose up --build -d，浏览器http://127.0.0.1:18770。DB不公开端口，PostgreSQL18 volume挂/var/lib/postgresql；club_owner负责迁移，club_app非超级用户DML；migrate就绪后app才启。已有volume不会因改.env重置密码，不用down -v修复启动。

备份：PowerShell `./deploy/backup.ps1`；恢复到新独立演练库 `./deploy/restore-practice.ps1 -BackupFile 'backups/实际文件.dump' -TargetDatabase 'club_restore_test01'`。脚本不会覆盖业务库、不删除已存在演练库，验证计数/孤儿/版本；备份需包含一条报名关系。dump/哈希/个人数据受保护，不提交。RPO/RTO、异机备份与回滚详见讲义。

CI：将本完整目录作为自己的独立Git仓库，复制ci/verify.yml到.github/workflows/verify.yml；工作流真实vet/test/build/迁移/E2E，无--if-present。此学习仓库的ci示例本身没有在远程执行，不声称创建文件即测试绿。

公网：实际云主机/域名/DNS/80、443/受控secret/防火墙/备份准备好后，填写DOMAIN，使用compose.production.yml覆盖，会移除app主机端口并启HTTPS Secure Cookie。仍需补可信代理IP/共享限速会话/账户恢复/监控/真实容量验证，不能把本机开发服务直接开放。当前审核机仅Compose配置解析，容器daemon、云DNS/TLS没有实跑；原生API/SQL/浏览器与pg_dump/restore实跑有报告。
