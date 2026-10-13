# PostgreSQL持久化、建模与迁移

完整安装、SQL、索引/计划、事务与备份教学：[第09阶段](../../../docs/followups/web-09.md)。Go1.26.9+（或当前稳定补丁版），独立PostgreSQL练习库与非超级用户。以自己的账户执行migrations/001_initial.sql、002_location.sql（一次）；practice.sql仅新空库种子实验，不当迁移重复跑。

```powershell
go mod download
go fmt ./...
go vet ./...
$env:DATABASE_URL='postgres://club_learner@127.0.0.1:5432/club_web?sslmode=disable'
$env:PGPASSWORD='替换自己的练习库密码'
go run .
```

macOS/Linux环境变量用export。浏览器 http://127.0.0.1:8769/ ，API合同同08。创建活动记id→Ctrl+C关闭Go→重新运行→记录仍可读。SQLStore独立repository，所有值参数化，列表/CRUD真正查询PostgreSQL。无DSN时程序拒绝启动，不默默回内存。

```powershell
$env:TEST_DATABASE_URL='postgres://club_learner@127.0.0.1:5432/club_web_test?sslmode=disable'
go test -v ./...
```

测试要求库名_test后缀，使用自己的隔离schema；检查TestRealDatabase PASS，SKIP不算数据库通过。覆盖迁移、带引号标题、UNIQUE失败后事务0行、外键拒绝。practice.sql验证LEFT JOIN零报名、未来排序、索引/EXPLAIN；UNIQUE(event_id,member_id)已覆盖event_id起始索引，不重复建。

边界：无身份/权限，本机教学；capacity字段未实现售罄并发业务。sslmode=disable只本机受控连接，远程按TLS要求。数据/DSN/密码/备份不提交。迁移只跑未应用版本，不删库重建，不默认复制正在写的数据目录；pg_dump/恢复到新库见讲义。
