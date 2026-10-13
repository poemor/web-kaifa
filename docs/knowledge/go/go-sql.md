# SQL、参数绑定与事务：真实数据库怎样保护数据

内存 map 的数据重启就消失。关系数据库把数据按表保存，使用约束维护有效性，使用查询读取相关记录，使用事务避免一半写成功、一半失败。这里把“可马上运行的标题校验”和“需要 PostgreSQL 的真实事务实验”分开，逻辑练习通过不能证明数据库已安装、查询正确或持久化成功。

## 1. 表、行、列和约束分别是什么

表描述一种数据，行是一条记录，列是字段。主键唯一标识一行；`NOT NULL` 禁止 SQL NULL，却不禁止空字符串；`CHECK` 可以约束约定字符处理后的长度；`UNIQUE` 禁止约定范围内重复；外键要求引用存在的记录。应用校验提供友好错误，数据库约束保护所有写入入口，二者可以同时存在。下例 PostgreSQL 的 `trim(title)` 默认只去普通空格，不等于 Go `strings.TrimSpace` 的 Unicode 空白规则；tab、换行或不换行空格未被本 CHECK 一概拒绝。真实项目应先决定标题归一化规则，再明确数据库约束保护的范围。

唯一规则要先决定业务含义：全部用户题目标题都唯一，还是同一用户内唯一？下面练习表为简化采用全表标题唯一，不是推荐所有真实产品如此设计。NULL、空字符串和零不是同一状态。新增字段时也要考虑旧数据能否满足约束，不要直接对生产表试验。

## 2. 参数绑定：结构写死，值单独传

错误写法是把用户输入拼进 SQL，如 `"... WHERE title='" + title + "'"`。单引号和特殊内容可能改变 SQL 结构。PostgreSQL 常用 `$1`、`$2`，值作为单独参数传给 Query/Exec；驱动负责按值处理，因此 `Alice's note` 也可正常保存。MySQL 的 `?` 不可以机械搬进 PostgreSQL 例子。

参数只能绑定值，不能自动安全地代表表名、列名、排序方向。允许动态排序时，用白名单将用户选择映射为固定 SQL 片段。不要对普通值自己做“把单引号替换两次”的过滤代替参数化。`QueryRowContext(...).Scan(...)` 才取到实际结果，`sql.ErrNoRows` 与连接失败应分别处理。

## 3. 连接池、取消与资源

`sql.Open` 建立数据库句柄，不保证已经连上。`PingContext` 在有限时间内检查真实连接。句柄通常表示连接池，服务启动时建立、退出时 Close，而不是每个请求新建。查询返回 Rows 要及时 Close，遍历后检查 `Rows.Err()`；Scan 的字段顺序必须对应 SELECT 列顺序。给调用传 context 有助于限制等待，不表示任何数据库工作都能被瞬间强制终止。

### 四类操作的真实 PostgreSQL 查询片段

以下是**存储函数内部片段**，假定db已经连接、ctx可用，且id、title、platform、difficulty已按本课程数据模型验证；需要导入database/sql。课程problems表的platform、difficulty是必需字段，不能只插入title。创建用RETURNING取得数据库生成id：

```go
var newID int64
err := db.QueryRowContext(ctx,
	"INSERT INTO problems(title, platform, difficulty) VALUES ($1, $2, $3) RETURNING id",
	title, platform, difficulty).Scan(&newID)
```

读取多行必须处理资源和遍历错误，不能把Query成功当全部结果成功：

```go
rows, err := db.QueryContext(ctx, "SELECT id, title FROM problems ORDER BY id")
if err != nil { return err }
defer rows.Close()
for rows.Next() {
	var recordID int64
	var recordTitle string
	if err := rows.Scan(&recordID, &recordTitle); err != nil { return err }
	// 在这里收集记录；不要把打印当作正式存储返回契约。
}
if err := rows.Err(); err != nil { return err }
```

修改和删除不一定返回Rows，但必须看影响行数，避免把不存在id的零行操作称为成功更新：

```go
result, err := db.ExecContext(ctx, "UPDATE problems SET title=$1 WHERE id=$2", title, id)
if err != nil { return err }
changed, err := result.RowsAffected()
if err != nil { return err }
if changed == 0 { return sql.ErrNoRows }
// DELETE对应：db.ExecContext(ctx, "DELETE FROM problems WHERE id=$1", id)
```

这些片段的表problems是你的课程项目表，不能直接在前面临时表实验中混用名字。增加认证与owner_id后，创建还必须增加由可信身份得到的owner_id字段，私人读写必须添加归属条件；动态排序仍使用白名单。SQL每一种操作都能在专用测试库写正常、缺失、约束失败用例。

## 4. 事务：相关操作一起成功或回滚

`BeginTx` 创建事务，之后相关查询、写入必须使用 `tx`，不能混用 `db`，否则可能跑在不同连接、脱离事务。通常在创建成功后 `defer tx.Rollback()` 兜底；提交成功后的 Rollback 会失败但可忽略，因为事务已经结束。中间出错提前返回，延迟回滚释放事务；只有所有步骤成功才 Commit，并检查提交本身的错误。PostgreSQL 中语句失败后事务通常进入失败状态，不要继续当作正常事务使用。

## 先跑纯逻辑练习：main.go 完整程序

VS Code 打开 `exercises/go/go-sql-logic`，创建 main.go。首次 `go mod init example.com/learn/go-sql-logic`，然后 `go run .`。它只验证写库之前的标题规则，**不连接数据库、不模拟事务、不证明持久化**。

```go
package main

import (
	"fmt"
	"strings"
)

func NormalizeTitle(raw string) (string, error) {
	title := strings.TrimSpace(raw)
	if title == "" { return "", fmt.Errorf("标题不能为空") }
	return title, nil
}

func main() {
	for _, raw := range []string{"  练习  ", "   ", "Alice's note"} {
		title, err := NormalizeTitle(raw)
		if err != nil { fmt.Println("拒绝：", err); continue }
		fmt.Println("接受：", title)
	}
}
```

```output
接受： 练习
拒绝： 标题不能为空
接受： Alice's note
```

## 真实 PostgreSQL 实验：环境与完整 dbmain.go

前置条件：已安装并启动 PostgreSQL、有专用练习数据库、知道连接账户，并能用 psql 或图形客户端连接。请单独创建测试库（如 `go_knowledge_practice`），不要用已有业务库。这一节不自动安装数据库，也没有内置账号密码。若还没准备环境，先完成纯逻辑例子，保留此节为后续实验。

另外建立 `exercises/go/go-sql-db` 目录，打开它，建立独立模块，安装 pgx 的 database/sql 驱动：

```powershell
go mod init example.com/learn/go-sql-db
go get github.com/jackc/pgx/v5/stdlib
```

创建 `dbmain.go`，保存以下**完整数据库程序**。它在真实数据库连接内建临时表，临时表仅属于当前连接，结束后消失；实验不会建立长期业务表。需要持久化时应另用正常表、迁移和重启检查。

```go
package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"time"
	"github.com/jackc/pgx/v5/pgconn"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func run() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" { return fmt.Errorf("请先设置测试库 DATABASE_URL") }
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	db, err := sql.Open("pgx", dsn)
	if err != nil { return err }
	defer db.Close()
	if err := db.PingContext(ctx); err != nil { return fmt.Errorf("连接失败：%w", err) }
	conn, err := db.Conn(ctx)
	if err != nil { return err }
	defer conn.Close()
	_, err = conn.ExecContext(ctx, `CREATE TEMP TABLE practice_problems (
		id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
		title TEXT NOT NULL UNIQUE CHECK (length(trim(title)) > 0)
	)`)
	if err != nil { return err }
	var id int64
	err = conn.QueryRowContext(ctx,
		"INSERT INTO practice_problems(title) VALUES ($1) RETURNING id", "Alice's note").Scan(&id)
	if err != nil { return err }
	var title string
	err = conn.QueryRowContext(ctx, "SELECT title FROM practice_problems WHERE id=$1", id).Scan(&title)
	if err != nil { return err }
	fmt.Println("参数绑定读取：", title)
	tx, err := conn.BeginTx(ctx, nil)
	if err != nil { return err }
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx, "INSERT INTO practice_problems(title) VALUES ($1)", "事务记录"); err != nil { return err }
	_, err = tx.ExecContext(ctx, "INSERT INTO practice_problems(title) VALUES ($1)", "事务记录")
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) || pgErr.Code != "23505" { return fmt.Errorf("预期 UNIQUE SQLSTATE 23505，实际：%v", err) }
	if err := tx.Rollback(); err != nil { return err }
	var count int
	if err := conn.QueryRowContext(ctx, "SELECT count(*) FROM practice_problems WHERE title=$1", "事务记录").Scan(&count); err != nil { return err }
	fmt.Println("失败事务回滚后：", count)
	_, err = conn.ExecContext(ctx, "INSERT INTO practice_problems(title) VALUES ($1)", "   ")
	if !errors.As(err, &pgErr) || pgErr.Code != "23514" { return fmt.Errorf("预期 CHECK SQLSTATE 23514，实际：%v", err) }
	fmt.Println("普通空格标题被约束拒绝：", true)
	tx2, err := conn.BeginTx(ctx, nil)
	if err != nil { return err }
	defer tx2.Rollback()
	if _, err := tx2.ExecContext(ctx, "INSERT INTO practice_problems(title) VALUES ($1)", "成功事务"); err != nil { return err }
	if err := tx2.Commit(); err != nil { return err }
	if err := conn.QueryRowContext(ctx, "SELECT count(*) FROM practice_problems WHERE title=$1", "成功事务").Scan(&count); err != nil { return err }
	fmt.Println("成功事务提交后：", count)
	return nil
}

func main() {
	if err := run(); err != nil { fmt.Fprintln(os.Stderr, err); os.Exit(1) }
}
```

在终端设置 `DATABASE_URL` 为自己的**测试库连接信息**，不要写进源码或提交到 Git。例如本地测试格式为 `postgres://用户名:自己的密码@127.0.0.1:5432/go_knowledge_practice?sslmode=disable`；disable 仅用于你确认的本机学习连接，远程连接按部署方 TLS 要求配置。PowerShell 用 `$env:DATABASE_URL = '实际连接信息'`，macOS/Linux 用 `export DATABASE_URL='实际连接信息'`。密码有 URL 特殊字符时要正确编码，或使用驱动支持的键值配置。不要把含密码的终端截图发给 AI。

执行 `go fmt ./...`、`go run .`。**预期而非预先声称已验收**的输出为：

```output
参数绑定读取： Alice's note
失败事务回滚后： 0
普通空格标题被约束拒绝： true
成功事务提交后： 1
```

## 事务练习

1. 在真实事务例子中把第二个标题改为不同值，并改成成功后Commit，提交后应留下几条相关记录？
2. 恢复相同标题，让第二步违反UNIQUE；查询是否留下第一步？
3. 查询一个不存在的id，应是哪个错误，而不是连接失败？

### 参考答案

把第二次事务插入标题改成“不同标题”，此时应改写控制流：两次执行无误后 Commit，而不是期待失败并回滚；提交后查询两条均存在。参考原则是“成功两行都在，第二步失败两行都不在”，不要以返回了某个错误就推测回滚正确，必须查询验证。把读 id 改成不存在值，应得到 sql.ErrNoRows 而不是连接失败。

自查：你能解释临时表为何不能证明重启持久化吗？能指出每次写入用的是 db、conn 还是 tx？值中带引号为何不改变 SQL 结构？没有真实测试库证据时，记录应写“未执行数据库实验”，不要把纯逻辑通过记成 SQL 已验收。

官方参考：[database/sql](https://pkg.go.dev/database/sql)、[参数化查询](https://go.dev/doc/database/sql-injection)、[事务](https://go.dev/doc/database/execute-transactions)、[PostgreSQL 约束](https://www.postgresql.org/docs/current/ddl-constraints.html)、[pgx 驱动](https://pkg.go.dev/github.com/jackc/pgx/v5/stdlib)。
