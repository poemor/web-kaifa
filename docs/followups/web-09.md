# 数据库：建模、迁移与真正保存活动

第08阶段内存API会在进程重启后丢失新增数据。这里把Store换成PostgreSQL实现，活动会长期保存；同时建立成员与报名表，理解外键、唯一约束、JOIN、索引、参数化和事务。完整目录包含迁移、SQL实验、SQLStore、同源前端与独立数据库测试。它仍没有身份认证，不允许真实用户上网写数据，身份和权限在下一阶段补上。

## 1. 安装服务、建立自己的练习库并验证

先阅读本站“Go数据库与事务”中的完整PostgreSQL安装步骤：Windows从[官方Windows下载](https://www.postgresql.org/download/windows/)进入受支持安装器，保留Server和命令行工具，自己设置管理密码、确认端口；macOS/Linux从[官方对应系统下载](https://www.postgresql.org/download/)选择安装方式。安装psql客户端不等于数据库服务正在运行。不要选择Beta当首次练习环境，不把已有真实业务库用于本例。已有安装直接核对服务、主机、端口和版本，不反复重装。

Windows可从开始菜单打开SQL Shell(psql)，按实际安装参数连接管理账户；若命令行psql不在PATH，使用实际路径，例如 `& 'C:/Program Files/PostgreSQL/18/bin/psql.exe' ...`，版本目录以自己安装为准。macOS/Linux终端使用psql。连接后先执行：

```sql
SELECT version();
SELECT current_database(),current_user;
```

看到版本和实际账户后，在管理员连接里创建**非超级用户**与独立库。`\password`会交互询问新密码，不把密码明文拼进SQL文件。

```sql
CREATE ROLE club_learner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
```

```psql
\password club_learner
```

```sql
CREATE DATABASE club_web OWNER club_learner;
CREATE DATABASE club_web_test OWNER club_learner;
```

名字已存在时先查归属和用途，不自动删库。管理账户退出 `\q`，然后从**VS Code终端**重新以练习账户连接club_web：

```powershell
psql -h 127.0.0.1 -p 5432 -U club_learner -d club_web -W
```

输入自己的密码，再SELECT current_database(),current_user确认club_web/club_learner；连接失败时不能继续以为自己在新库，先检查`\conninfo`。数据库5432与HTTP8769是不同端口。

## 2. 三张表的关系，为什么不用一团JSON

events一行一个活动，members一行一个成员，registrations一行一个“成员参加活动”的关系。一个活动可有多个报名，一成员可参加多个活动，所以活动与成员是多对多，通过报名表拆成两个一对多。注册表用event_id和member_id外键，不能引用不存在父行。主键id标识记录，不把可修改title当主键。

NOT NULL禁止SQL NULL，不禁止空字符串；CHECK约束长度/容量；UNIQUE(event_id,member_id)禁止同一成员同一活动重复报名，但允许同一成员报不同活动。PRIMARY KEY也提供唯一和非空约束。DB的trim默认只去普通空格，Go TrimSpace的Unicode范围更广：先定义业务规则，不声称数据库CHECK和所有客户端归一化完全相同。[PostgreSQL约束](https://www.postgresql.org/docs/current/ddl-constraints.html)

ON DELETE CASCADE使删除活动时关联报名一起删除；member外键未设CASCADE，删除仍有关联报名的成员将被拒绝。这个选择关系到业务历史，你应解释为什么删除前要提示，而不是把“外键错误”一概看成程序bug。

## 3. 迁移：从空库到已存在数据的结构升级

在VS Code打开含go.mod的followup-09目录。目录migrations的001创建三张表和schema_migrations，002给events加location。每个文件BEGIN/COMMIT包含版本写入，所以结构变更与记录一起成功。迁移文件是已经发生过的结构历史；不要上线后改001，下一次变更写003。

离开psql回到VS Code终端，在练习目录执行以下两条（命令会分别提示自己的密码）：

```powershell
psql -h 127.0.0.1 -p 5432 -U club_learner -d club_web -W -v ON_ERROR_STOP=1 -f migrations/001_initial.sql
psql -h 127.0.0.1 -p 5432 -U club_learner -d club_web -W -v ON_ERROR_STOP=1 -f migrations/002_location.sql
```

预期第一条CREATE TABLE四次、版本1；第二条ALTER TABLE、版本2。重复执行会提示表/列已存在，这不是数据库损坏；先SELECT version FROM schema_migrations，已应用不重跑。第11阶段的迁移runner会根据版本跳过。IF NOT EXISTS不会自动升级旧表，删库重建也不是升级方法。

演练已有数据：在另一个专用空练习库只执行001，插一条活动，再执行002，查到旧活动仍在且location为空字符串。字段增加采用兼容默认值，不先删活动。对于真实用户资料，NOT NULL新列需考虑分批填充，不能照着教学文件盲目改生产库。[ALTER TABLE](https://www.postgresql.org/docs/current/ddl-alter.html)

## 4. SQL增删改查与WHERE保护范围

执行目录practice.sql会插入两成员、三活动和一报名，用LEFT JOIN输出0报名活动，并展示回滚/计划。它是**新空练习库一次种子实验**，不是可重复迁移；重复执行会撞成员UNIQUE且ON_ERROR_STOP停止。先查数据，不为了重跑实验删库。

```powershell
psql -h 127.0.0.1 -p 5432 -U club_learner -d club_web -W -v ON_ERROR_STOP=1 -f practice.sql
```

预期未来活动是图论训练和网页练习；报名统计图论训练1、网页练习0、历史活动0。id按服务器实际生成值为准，不要求每次恰好1/2/3。starts_at使用now()+interval相对时间，结果不依赖读者今天是哪一天。

再次连接psql，先SELECT确认范围，再UPDATE：

```sql
SELECT id,title FROM events WHERE title='网页练习';
UPDATE events SET location='机房' WHERE title='网页练习';
SELECT id,title,location FROM events WHERE title='网页练习';
DELETE FROM events WHERE id=999999;
```

UPDATE 1表示影响一行，DELETE 0表示没有匹配，并非语法失败。WHERE缺失会作用全表，先用同条件SELECT查范围。INSERT省略id由IDENTITY生成，不用查MAX(id)+1竞争分配；RETURNING直接取真实id。序列在失败/回滚时也可能消耗值，所以id有间隙正常，不用重排主键。

## 5. WHERE、排序与分页：查询顺序怎么理解

WHERE保留未来活动，ORDER BY starts_at,id用时间和id稳定排序，LIMIT10只取前十条。没有ORDER BY的“第一条”不可靠。OFFSET跳过前N条，简单页面够用，但大偏移可能扫描很多行；真实大量数据可学游标分页。API额外限制limit1–100，不允许一次无限返回几十万条。

SQLStore.List使用 `strpos(lower(title),lower($1))>0` 子串匹配、ORDER BY id、LIMIT $2、OFFSET $3。q传入普通值，不是SQL语句。此查询语义是不分大小写字面子串，`%`不是LIKE通配符。普通B-tree不一定能优化任意子串，后续全文/三元组索引需按需求引入，不能给title随便建索引就宣称加速。

## 6. LEFT JOIN与计数：零报名为什么还在

INNER JOIN只保留关联匹配，会漏掉无报名活动。LEFT JOIN保留左边每个event，缺失报名列为NULL。`count(r.id)`只数非NULL报名，零报名为0；`count(*)`会把保留的活动行也数成1，是这里常见统计错误。GROUP BY活动id/title每活动一组，多表继续JOIN时可能让报名行被复制，统计前先明确一行代表什么。[JOIN教程](https://www.postgresql.org/docs/current/tutorial-join.html)

practice.sql中的查询输出三行。新增第四条无报名活动再查，应显示0，不靠前端补假记录。独立核对 `SELECT count(*) FROM registrations WHERE event_id=实际id`，再与聚合数比较。

## 7. 约束和事务：失败要查询证明回滚

把同一event_id/member_id再INSERT一次，应SQLSTATE23505；引用不存在父id，应23503；容量负数或空普通空格标题应23514。应用友好错误与数据库最后防线共同存在。并发两个请求可能都“检查没有重复”，UNIQUE仍会拒绝其中一个，所以仅浏览器隐藏报名按钮不够。[事务教程](https://www.postgresql.org/docs/current/tutorial-transactions.html)

BEGIN后成功写第一步、第二步故意重复用户名违反UNIQUE，此事务进入失败状态。执行ROLLBACK后查第一步计数必须0；只看到错误不能推断已经回滚。Go测试里BeginTx、两次INSERT、Rollback、SELECT计数是真实DB执行，不是内存假事务。成功路径则Commit并检查提交错误。所有相关操作用tx，不混用db否则可能脱离事务。

practice.sql还用BEGIN→UPDATE→ROLLBACK证明旧标题仍在。把ROLLBACK改COMMIT再查会持久改变，所以只在自己的隔离库实验。本模型capacity用于约束/事务教学，并未实现售罄扣库存；真正名额抢购要有正确并发事务/锁与压力测试，不能看到字段就假定功能完成。

## 8. 索引与EXPLAIN：测量而不是“感觉快了”

主键、UNIQUE本身会产生索引。本例UNIQUE(event_id,member_id)以event_id开头，已经适合按event_id查询，因此原清单“再给event_id加一个索引”不能机械照做，先看已有索引避免重复。按member_id查当前成员报名可以补registrations_member_idx。

EXPLAIN显示规划，EXPLAIN(ANALYZE,BUFFERS)会真实执行查询并给实际行数/时间/缓冲命中。对于写语句ANALYZE也会执行写入，不能拿生产DELETE随手测。本例只分析SELECT。小表可能仍Seq Scan，因为扫描全部几行更便宜，不代表索引无效；同样一次微秒差不能证明长期提升。[执行计划](https://www.postgresql.org/docs/current/using-explain.html)

执行practice.sql观察现有UNIQUE索引是否用于event过滤、member索引后计划是否仍顺扫。进一步只在测试库插入数千行、ANALYZE更新统计再比较计划；写下总行数、过滤命中数和计划，不写未经测量的“提升100倍”。索引增加磁盘与写入维护成本，慢查询先定位再选索引。

## 9. 参数化、repository与连接池

SQL结构写在repository.go，用户值单独作为$1/$2传给QueryContext/QueryRowContext。输入 `Alice's note` 不改变SQL结构；输入 `'; DROP TABLE events; --` 按普通标题值处理，不执行DROP。参数不能绑定列名/排序方向，动态排序要白名单映射固定SQL片段。[Go防SQL注入](https://go.dev/doc/database/sql-injection)

SQLStore实现与MemoryStore相同Store接口。INSERT/UPDATE RETURNING把实际结果Scan进Event，没找到转换ErrMissing404。DELETE检查RowsAffected为0转换404，不虚假宣布删除存在记录。查询Rows必须defer Close并检查Rows.Err，不把Query成功当全部遍历成功。

sql.Open只创建连接句柄，不证明能连；PingContext5秒确认，连接池最大5、空闲2，所有请求复用db，不每次重新建立。DSN是真实秘密，放终端环境。密码含@/:等需URL编码；也可用pgx支持的PGPASSWORD环境把密码与URL分开，连接串只包含用户名/主机/库名。[pgx标准接口](https://pkg.go.dev/github.com/jackc/pgx/v5/stdlib)

## 10. 启动持久化API并证明重启可读

在练习目录 `go mod download`、`go fmt ./...`、`go test -v ./...`。先前数据库迁移到2后才运行程序。PowerShell设置格式如下，需替换自己的参数，不把示意字串当密码：

```powershell
$env:DATABASE_URL='postgres://club_learner@127.0.0.1:5432/club_web?sslmode=disable'
$env:PGPASSWORD='替换成你自己的练习账户密码'
go run .
```

macOS/Linux分别 `export DATABASE_URL='...'`、`export PGPASSWORD='...'`、go run .。sslmode=disable仅本机受控练习，远程按提供方验证TLS配置，不能把disable照搬公网。浏览器打开 `http://127.0.0.1:8769/`，列表来自events真实数据。

创建“重启验证”并记实际id，Ctrl+C关闭**Go服务**，用同样环境再次go run，再GET记录，应仍存在。进一步重启自己的数据库服务后再查才验证DB服务重启持久化；这里不删除数据目录。停止服务/删容器/删volume不同含义，不能混用。

真实DB测试额外要求独立库名以_test结尾，测试创建自己的临时schema并删除，不写public业务表：

```powershell
$env:TEST_DATABASE_URL='postgres://club_learner@127.0.0.1:5432/club_web_test?sslmode=disable'
go test -v ./...
```

PGPASSWORD使用同一练习账户。输出TestRealDatabase PASS才表示执行了数据库实验；SKIP明确表示没执行，不拿纯逻辑通过冒充数据库通过。测试schema已存在时失败并保留现场，不能悄悄清别人同名表。

## 11. SQLite还是PostgreSQL，以及备份恢复

SQLite是单机文件数据库，适合简单本地程序，不需要另开服务；PostgreSQL是数据库服务，适合多客户端协作和更复杂并发。本课选择PostgreSQL以便与Go后续API和部署衔接。不能说SQLite“只能一个人用”或“永远不能上线”，应根据写并发、运维、共享方式选。切换不是只改名字，驱动占位符、身份列、约束配置、时间类型可能不同。[SQLite应用场景](https://www.sqlite.org/whentouse.html)

PostgreSQL不靠复制正在写的数据目录备份。用pg_dump生成一致逻辑备份，再pg_restore到**新演练库**。文件含个人数据和密码哈希时仍敏感，不提交Git；第11阶段给完整备份脚本和恢复验收。此处先做本机验证，工具不在PATH用安装目录实际完整路径：

```powershell
pg_dump -h 127.0.0.1 -p 5432 -U club_learner -d club_web -W -Fc -f club-web.dump
```

管理账户另建club_restore_test并owner club_learner，再恢复：

```powershell
pg_restore -h 127.0.0.1 -p 5432 -U club_learner -d club_restore_test -W --no-owner --exit-on-error club-web.dump
psql -h 127.0.0.1 -p 5432 -U club_learner -d club_restore_test -W -c 'SELECT count(*) FROM events; SELECT count(*) FROM registrations;'
```

对比原库计数、活动title、报名外键、迁移版本；原库不删除、不覆盖。不要用旧Windows PowerShell `pg_dump ... > file`处理二进制custom dump，文本重定向可能损坏；明确-f让程序写文件。备份成功只说明文件生成，恢复验证才证明可用。

## 12. 排错：服务、认证、表、查询分别查什么

| 现象 | 证据与下一步 |
| --- | --- |
| psql不是命令 | SQL Shell或真实exe路径，先检查客户端，不重装数据库 |
| connection refused | 主机/端口/服务；HTTP8769不是DB5432 |
| password authentication failed | club_learner账户密码，不去关闭认证 |
| relation不存在 | current_database/schema/version；迁移是否在同一个库 |
| 500但页面没有SQL | 对外隐藏细节正确；服务器定位连接/约束/查询日志 |
| 标题带引号查询失败 | 看repository参数传递，不删除正常姓名中的引号 |
| 重启后变空 | DATABASE_URL是否换库、是否仍跑08内存服务 |
| EXPLAIN与别人不同 | 数据量/统计/索引/版本，不凭截图硬复制执行计划 |

DevTools Network查看8769是否收到请求，Go repository.Get处断点看传入id与err类型；psql用同一个库做SELECT核对。记录错误码、版本和脱敏库名，AI问题不包含PGPASSWORD或完整含密DSN。

## 完整主例：逐个文件保存

下面每个标题都是相对练习目录的真实文件名。在 VS Code 左侧新建对应文件夹和文件，粘贴整段代码，按 Ctrl+S（macOS 为 Cmd+S）保存；不要把不同文件的代码拼进同一文件。完整下载目录已经包含这些文件，直接打开时无需重复抄写。`package-lock.json` 和 `go.sum` 随源码下载，手工重建时分别由 npm install 和 go mod tidy 生成。

### 完整文件：go.mod

```text
module example.com/learn/followup-09

go 1.26.9

require (
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/pgx/v5 v5.11.0 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	golang.org/x/sync v0.17.0 // indirect
	golang.org/x/text v0.29.0 // indirect
)
```

### 完整文件：main.go

```go
package main

import (
	"context"
	"database/sql"
	"errors"
	_ "github.com/jackc/pgx/v5/stdlib"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"
)

func main() {
	addr := os.Getenv("APP_ADDR")
	if addr == "" {
		addr = "127.0.0.1:8769"
	}
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("请设置独立练习库 DATABASE_URL，未启动服务")
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatal("数据库配置不正确（不要公开连接串）")
	}
	defer db.Close()
	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(30 * time.Minute)
	ping, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	err = db.PingContext(ping)
	cancel()
	if err != nil {
		log.Fatal("无法连接练习数据库，请核对服务/账户/库名")
	}
	api := NewAPI(&SQLStore{db: db}, os.Getenv("ALLOWED_ORIGIN"))
	srv := &http.Server{Addr: addr, Handler: api.Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	go func() {
		<-ctx.Done()
		timeout, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(timeout)
	}()
	log.Printf("社团 API: http://%s（PostgreSQL 版）", addr)
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
```

### 完整文件：store.go

```go
package main

import (
	"context"
	"errors"
	"sort"
	"strings"
	"sync"
	"unicode/utf8"
)

var ErrMissing = errors.New("record not found")
var ErrConflict = errors.New("record conflicts")

type Event struct {
	ID       int64  `json:"id"`
	Title    string `json:"title"`
	Location string `json:"location"`
}

type EventInput struct {
	Title    string `json:"title"`
	Location string `json:"location"`
}

// HTTP 层与存储层只约定方法，不约定内存或 SQL 的内部结构。
type Store interface {
	List(context.Context, string, int, int) ([]Event, error)
	Get(context.Context, int64) (Event, error)
	Create(context.Context, EventInput) (Event, error)
	Update(context.Context, int64, EventInput) (Event, error)
	Delete(context.Context, int64) error
	Ping(context.Context) error
}

func NormalizeInput(in EventInput) (EventInput, error) {
	in.Title = strings.TrimSpace(in.Title)
	in.Location = strings.TrimSpace(in.Location)
	if n := utf8.RuneCountInString(in.Title); n < 1 || n > 100 {
		return in, errors.New("标题须为 1–100 个字符")
	}
	if utf8.RuneCountInString(in.Location) > 100 {
		return in, errors.New("地点不能超过 100 个字符")
	}
	return in, nil
}

type MemoryStore struct {
	mu    sync.Mutex
	next  int64
	items map[int64]Event
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{next: 2, items: map[int64]Event{1: {ID: 1, Title: "图论训练", Location: "教室 A"}}}
}
func (s *MemoryStore) Ping(context.Context) error { return nil }
func (s *MemoryStore) List(_ context.Context, q string, limit, offset int) ([]Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	all := []Event{}
	for _, e := range s.items {
		if strings.Contains(strings.ToLower(e.Title), strings.ToLower(q)) {
			all = append(all, e)
		}
	}
	sort.Slice(all, func(i, j int) bool { return all[i].ID < all[j].ID })
	if offset >= len(all) {
		return []Event{}, nil
	}
	end := offset + limit
	if end > len(all) {
		end = len(all)
	}
	return all[offset:end], nil
}
func (s *MemoryStore) Get(_ context.Context, id int64) (Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	e, ok := s.items[id]
	if !ok {
		return e, ErrMissing
	}
	return e, nil
}
func (s *MemoryStore) Create(_ context.Context, in EventInput) (Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	e := Event{ID: s.next, Title: in.Title, Location: in.Location}
	s.next++
	s.items[e.ID] = e
	return e, nil
}
func (s *MemoryStore) Update(_ context.Context, id int64, in EventInput) (Event, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[id]; !ok {
		return Event{}, ErrMissing
	}
	e := Event{ID: id, Title: in.Title, Location: in.Location}
	s.items[id] = e
	return e, nil
}
func (s *MemoryStore) Delete(_ context.Context, id int64) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.items[id]; !ok {
		return ErrMissing
	}
	delete(s.items, id)
	return nil
}
```

### 完整文件：api.go

```go
package main

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"mime"
	"net/http"
	"strconv"
	"strings"
	"sync/atomic"
	"time"
)

var requestSequence atomic.Uint64

type API struct {
	store  Store
	origin string
}

func NewAPI(s Store, origin string) *API { return &API{store: s, origin: origin} }
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func fail(w http.ResponseWriter, status int, code, msg string) {
	writeJSON(w, status, map[string]any{"error": map[string]string{"code": code, "message": msg}})
}
func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	media, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || media != "application/json" {
		fail(w, 415, "content_type", "请使用 application/json")
		return false
	}
	r.Body = http.MaxBytesReader(w, r.Body, 8192)
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	if err = d.Decode(dst); err != nil {
		var large *http.MaxBytesError
		if errors.As(err, &large) {
			fail(w, 413, "body_too_large", "请求体不能超过 8192 字节")
		} else {
			fail(w, 400, "invalid_json", "JSON 字段、类型或语法不正确")
		}
		return false
	}
	if err = d.Decode(new(any)); err != io.EOF {
		fail(w, 400, "invalid_json", "只接受一个 JSON 对象")
		return false
	}
	return true
}
func eventID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id < 1 {
		fail(w, 400, "invalid_id", "id 必须为正整数")
		return 0, false
	}
	return id, true
}
func (a *API) storeError(w http.ResponseWriter, err error) {
	if errors.Is(err, ErrMissing) {
		fail(w, 404, "not_found", "记录不存在")
	} else if errors.Is(err, ErrConflict) {
		fail(w, 409, "conflict", "记录与已有数据冲突")
	} else {
		category := "internal"
		if errors.Is(err, context.DeadlineExceeded) {
			category = "timeout"
		} else if errors.Is(err, context.Canceled) {
			category = "canceled"
		}
		var state interface{ SQLState() string }
		if errors.As(err, &state) {
			category = "sqlstate_" + state.SQLState()
		}
		log.Printf("store_failure request_id=%s category=%s type=%T", w.Header().Get("X-Request-ID"), category, err)
		fail(w, 500, "internal", "服务暂时不可用，请稍后重试")
	}
}
func (a *API) list(w http.ResponseWriter, r *http.Request) {
	limit, offset := 20, 0
	for _, p := range []string{"limit", "offset"} {
		raw := r.URL.Query().Get(p)
		if raw == "" {
			continue
		}
		n, err := strconv.Atoi(raw)
		if err != nil || n < 0 || (p == "limit" && (n < 1 || n > 100)) {
			fail(w, 400, "pagination", "limit 须为 1–100，offset 须为非负整数")
			return
		}
		if p == "limit" {
			limit = n
		} else {
			offset = n
		}
	}
	items, err := a.store.List(r.Context(), r.URL.Query().Get("q"), limit, offset)
	if err != nil {
		a.storeError(w, err)
		return
	}
	writeJSON(w, 200, items)
}
func (a *API) get(w http.ResponseWriter, r *http.Request) {
	id, ok := eventID(w, r)
	if !ok {
		return
	}
	item, err := a.store.Get(r.Context(), id)
	if err != nil {
		a.storeError(w, err)
		return
	}
	writeJSON(w, 200, item)
}
func (a *API) save(w http.ResponseWriter, r *http.Request) {
	var in EventInput
	var id int64
	if r.Method == "PATCH" {
		var ok bool
		id, ok = eventID(w, r)
		if !ok {
			return
		}
		existing, err := a.store.Get(r.Context(), id)
		if err != nil {
			a.storeError(w, err)
			return
		}
		var patch struct {
			Title    *string `json:"title"`
			Location *string `json:"location"`
		}
		if !decodeJSON(w, r, &patch) {
			return
		}
		if patch.Title == nil && patch.Location == nil {
			fail(w, 400, "validation", "至少修改 title 或 location")
			return
		}
		in = EventInput{Title: existing.Title, Location: existing.Location}
		if patch.Title != nil {
			in.Title = *patch.Title
		}
		if patch.Location != nil {
			in.Location = *patch.Location
		}
	} else if !decodeJSON(w, r, &in) {
		return
	}
	in, err := NormalizeInput(in)
	if err != nil {
		fail(w, 400, "validation", err.Error())
		return
	}
	var item Event
	if r.Method == "POST" {
		item, err = a.store.Create(r.Context(), in)
	} else {
		item, err = a.store.Update(r.Context(), id, in)
	}
	if err != nil {
		a.storeError(w, err)
		return
	}
	if r.Method == "POST" {
		w.Header().Set("Location", "/api/events/"+strconv.FormatInt(item.ID, 10))
		writeJSON(w, 201, item)
	} else {
		writeJSON(w, 200, item)
	}
}
func (a *API) remove(w http.ResponseWriter, r *http.Request) {
	id, ok := eventID(w, r)
	if !ok {
		return
	}
	if err := a.store.Delete(r.Context(), id); err != nil {
		a.storeError(w, err)
		return
	}
	w.WriteHeader(204)
}
func (a *API) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		if err := a.store.Ping(r.Context()); err != nil {
			fail(w, 503, "unhealthy", "服务暂未就绪")
			return
		}
		writeJSON(w, 200, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /api/events", a.list)
	mux.HandleFunc("POST /api/events", a.save)
	mux.HandleFunc("GET /api/events/{id}", a.get)
	mux.HandleFunc("PATCH /api/events/{id}", a.save)
	mux.HandleFunc("DELETE /api/events/{id}", a.remove)
	mux.Handle("GET /", http.FileServer(http.Dir("web")))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		if w.Header().Get("X-Request-ID") == "" {
			w.Header().Set("X-Request-ID", strconv.FormatUint(requestSequence.Add(1), 10))
		}
		origin := r.Header.Get("Origin")
		if origin != "" && a.origin != "" && origin == a.origin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Add("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == "OPTIONS" && strings.HasPrefix(r.URL.Path, "/api/") {
			if origin != a.origin || a.origin == "" {
				fail(w, 403, "cors_origin", "此开发来源未获允许")
				return
			}
			w.WriteHeader(204)
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		mux.ServeHTTP(w, r.WithContext(ctx))
	})
}
```

### 完整文件：repository.go

```go
package main

import (
	"context"
	"database/sql"
	"errors"
	"github.com/jackc/pgx/v5/pgconn"
)

type SQLStore struct{ db *sql.DB }

func databaseError(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return ErrMissing
	}
	var pg *pgconn.PgError
	if errors.As(err, &pg) && (pg.Code == "23505" || pg.Code == "23503") {
		return ErrConflict
	}
	return err
}
func scanEvent(row interface{ Scan(...any) error }) (Event, error) {
	var e Event
	err := row.Scan(&e.ID, &e.Title, &e.Location)
	return e, databaseError(err)
}
func (s *SQLStore) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }
func (s *SQLStore) List(ctx context.Context, q string, limit, offset int) ([]Event, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id,title,location FROM events WHERE strpos(lower(title),lower($1))>0 ORDER BY id LIMIT $2 OFFSET $3`, q, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []Event{}
	for rows.Next() {
		e, err := scanEvent(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, e)
	}
	return items, rows.Err()
}
func (s *SQLStore) Get(ctx context.Context, id int64) (Event, error) {
	return scanEvent(s.db.QueryRowContext(ctx, `SELECT id,title,location FROM events WHERE id=$1`, id))
}
func (s *SQLStore) Create(ctx context.Context, in EventInput) (Event, error) {
	return scanEvent(s.db.QueryRowContext(ctx, `INSERT INTO events(title,location) VALUES($1,$2) RETURNING id,title,location`, in.Title, in.Location))
}
func (s *SQLStore) Update(ctx context.Context, id int64, in EventInput) (Event, error) {
	return scanEvent(s.db.QueryRowContext(ctx, `UPDATE events SET title=$1,location=$2 WHERE id=$3 RETURNING id,title,location`, in.Title, in.Location, id))
}
func (s *SQLStore) Delete(ctx context.Context, id int64) error {
	r, err := s.db.ExecContext(ctx, `DELETE FROM events WHERE id=$1`, id)
	if err != nil {
		return databaseError(err)
	}
	n, err := r.RowsAffected()
	if err == nil && n == 0 {
		return ErrMissing
	}
	return err
}
```

### 完整文件：migrations/001_initial.sql

```sql
BEGIN;
CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE members (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 username TEXT NOT NULL UNIQUE CHECK (length(username) BETWEEN 3 AND 40)
);
CREATE TABLE events (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 100),
 starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 capacity INTEGER NOT NULL DEFAULT 20 CHECK (capacity >= 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE registrations (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
 member_id BIGINT NOT NULL REFERENCES members(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(event_id,member_id)
);
INSERT INTO schema_migrations(version) VALUES(1);
COMMIT;
```

### 完整文件：migrations/002_location.sql

```sql
BEGIN;
-- 旧记录保留，并先得到可解释的默认地点。
ALTER TABLE events ADD COLUMN location TEXT NOT NULL DEFAULT '' CHECK(length(location)<=100);
INSERT INTO schema_migrations(version) VALUES(2);
COMMIT;
```

### 完整文件：practice.sql

```sql
\set ON_ERROR_STOP on
SELECT current_database(),current_user;
-- 仅用于新建的空练习库，重复执行种子会新增活动，不是迁移。
INSERT INTO members(username) VALUES('member_a'),('member_b');
INSERT INTO events(title,location,starts_at) VALUES
 ('图论训练','教室 A',now()+interval '1 day'),
 ('网页练习','教室 B',now()+interval '2 days'),
 ('历史活动','教室 C',now()-interval '1 day');
INSERT INTO registrations(event_id,member_id)
 SELECT e.id,m.id FROM events e CROSS JOIN members m WHERE e.title='图论训练' AND m.username='member_a';
SELECT id,title,starts_at FROM events WHERE starts_at>now() ORDER BY starts_at,id LIMIT 10;
SELECT e.id,e.title,count(r.id) AS participants
 FROM events e LEFT JOIN registrations r ON r.event_id=e.id
 GROUP BY e.id,e.title ORDER BY e.id;
BEGIN;
UPDATE events SET title='临时标题' WHERE title='网页练习';
ROLLBACK;
SELECT title FROM events WHERE title='网页练习';
EXPLAIN (ANALYZE,BUFFERS) SELECT * FROM registrations WHERE event_id=(SELECT min(id) FROM events);
CREATE INDEX registrations_member_idx ON registrations(member_id);
-- UNIQUE(event_id,member_id) 已经生成以 event_id 开头的索引。
-- 本小表出现 Seq Scan 正常，不能据此宣称有或没有性能提升。
EXPLAIN (ANALYZE,BUFFERS) SELECT * FROM registrations WHERE member_id=(SELECT min(id) FROM members);
```

### 完整文件：web/index.html

```html
<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>社团活动 API 对接</title><link rel="stylesheet" href="/style.css"><main><h1>自己的活动 API</h1><p>本课数据存于 PostgreSQL，服务重启后可再次读取。使用同源 /api/events。</p><form id="editor"><input id="id" type="hidden"><label for="title">活动标题</label><input id="title" required maxlength="100"><label for="location">地点</label><input id="location" maxlength="100"><button>保存到服务器</button><button type="button" id="cancel-edit">取消编辑</button></form><p id="status" role="status"></p><button id="refresh">重新获取</button><ul id="list"></ul></main><script src="/app.js" defer></script></html>
```

### 完整文件：web/style.css

```css
*{box-sizing:border-box}body{margin:0;background:#f6f5f1;color:#252b29;font:18px/1.7 system-ui}main{max-width:55rem;padding:1.5rem;margin:auto}form{display:grid;gap:.6rem}input,button{font:inherit;padding:.55rem;border:1px solid #9ba49f;border-radius:.3rem}button{cursor:pointer;background:#fff}button:focus-visible,input:focus-visible{outline:3px solid #156a5a;outline-offset:3px}li{padding:1rem;border-bottom:1px solid #ccc;overflow-wrap:anywhere}li button{margin:.5rem}button:disabled{opacity:.5;cursor:wait}
```

### 完整文件：web/app.js

```javascript
const form=document.querySelector('#editor'), status=document.querySelector('#status'), list=document.querySelector('#list');
async function request(path,options={}) {
  const res=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options.headers}});
  if(res.status===204)return null;
  const body=await res.json();
  if(!res.ok)throw new Error(body.error?.message??`HTTP ${res.status}`);
  return body;
}
async function load() {
  status.textContent='正在向服务器取数据…';
  try {
    const items=await request('/api/events');list.replaceChildren();
    for(const item of items) {
      const li=document.createElement('li'),text=document.createElement('span');
      text.textContent=`${item.id} · ${item.title} · ${item.location}`;li.append(text);
      const edit=document.createElement('button');edit.textContent='编辑';edit.onclick=()=>{form.elements.id.value=item.id;form.elements.title.value=item.title;form.elements.location.value=item.location;form.elements.title.focus();status.textContent=`正在编辑 #${item.id}`;};
      const del=document.createElement('button');del.textContent='删除';del.onclick=async()=>{if(!confirm(`删除“${item.title}”？`))return;del.disabled=true;try{await request(`/api/events/${item.id}`,{method:'DELETE'});document.querySelector('#refresh').focus();await load();}catch(err){status.textContent=err.message;del.disabled=false;}};
      li.append(edit,del);list.append(li);
    }
    status.textContent=items.length?`服务器返回 ${items.length} 条活动`:'服务器返回空列表。可创建第一条活动。';
  } catch(err){status.textContent=`获取失败：${err.message}。检查 Network，确认后端仍在运行。`;}
}
form.onsubmit=async e=>{
  e.preventDefault();const id=form.elements.id.value;
  const title=form.elements.title.value.trim(),location=form.elements.location.value.trim();
  if(!title){status.textContent='标题不能只有空格';form.elements.title.focus();return;}
  const submit=form.querySelector('button');submit.disabled=true;
  try{await request(id?`/api/events/${id}`:'/api/events',{method:id?'PATCH':'POST',body:JSON.stringify({title,location})});form.reset();await load();}catch(err){status.textContent=`保存失败：${err.message}`;}finally{submit.disabled=false;}
};
document.querySelector('#cancel-edit').onclick=()=>{form.reset();status.textContent='已取消本地编辑，没有发送更新';};
document.querySelector('#refresh').onclick=load;load();
```

### 完整文件：api_test.go

```go
package main

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func requestTest(h http.Handler, method, path, body string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}
func TestCRUDAndFailures(t *testing.T) {
	h := NewAPI(NewMemoryStore(), "http://127.0.0.1:5173").Handler()
	cases := []struct {
		method, path, body string
		code               int
	}{
		{"GET", "/api/events", "", 200}, {"POST", "/api/events", `{"title":"  活动  ","location":"A"}`, 201}, {"PATCH", "/api/events/2", `{"title":"新标题","location":"B"}`, 200}, {"GET", "/api/events/2", "", 200}, {"DELETE", "/api/events/2", "", 204}, {"GET", "/api/events/2", "", 404}, {"POST", "/api/events", `{"title":" "}`, 400}, {"POST", "/api/events", `{"title":[]}`, 400}, {"POST", "/api/events", `{"title":"A","role":"admin"}`, 400}, {"GET", "/api/events/no", "", 400}, {"GET", "/api/events?limit=0", "", 400}, {"POST", "/api/events", `{"title":"A"} {}`, 400},
	}
	for _, c := range cases {
		w := requestTest(h, c.method, c.path, c.body)
		if w.Code != c.code {
			t.Fatalf("%s %s: got %d %s want %d", c.method, c.path, w.Code, w.Body, c.code)
		}
	}
	w := requestTest(h, "POST", "/api/events", `{"title":"`+strings.Repeat("a", 9000)+`"}`)
	if w.Code != 413 {
		t.Fatal(w.Code, w.Body)
	}
}
func TestCORSPrefight(t *testing.T) {
	h := NewAPI(NewMemoryStore(), "http://127.0.0.1:5173").Handler()
	for _, origin := range []string{"http://127.0.0.1:5173", "https://other.invalid"} {
		r := httptest.NewRequest("OPTIONS", "/api/events", nil)
		r.Header.Set("Origin", origin)
		w := httptest.NewRecorder()
		h.ServeHTTP(w, r)
		if origin == "http://127.0.0.1:5173" {
			if w.Code != 204 || w.Header().Get("Access-Control-Allow-Origin") != origin {
				t.Fatal(w.Code, w.Header())
			}
		} else if w.Code != 403 {
			t.Fatal(w.Code)
		}
	}
}

type failingStore struct{ *MemoryStore }

func (s failingStore) List(context.Context, string, int, int) ([]Event, error) {
	return nil, errors.New("private DSN must not leak")
}
func TestInternalErrorDoesNotLeak(t *testing.T) {
	w := requestTest(NewAPI(failingStore{NewMemoryStore()}, "").Handler(), "GET", "/api/events", "")
	if w.Code != 500 || strings.Contains(w.Body.String(), "DSN") {
		t.Fatal(w.Code, w.Body)
	}
}
```

### 完整文件：db_test.go

```go
package main

import (
	"context"
	"database/sql"
	_ "github.com/jackc/pgx/v5/stdlib"
	"os"
	"strings"
	"testing"
)

func TestRealDatabase(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("未设置独立 TEST_DATABASE_URL，未执行真实数据库测试")
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	ctx := context.Background()
	var name string
	if err = db.QueryRowContext(ctx, "SELECT current_database()").Scan(&name); err != nil {
		t.Fatal("无法连接测试库")
	}
	if !strings.HasSuffix(name, "_test") {
		t.Fatal("测试库名必须以 _test 结尾；拒绝写入")
	}
	// 独立连接与临时 schema，实验后销毁此 schema，不影响 public 表。
	conn, err := db.Conn(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	_, err = conn.ExecContext(ctx, "CREATE SCHEMA followup09_isolated")
	if err != nil {
		t.Fatal(err)
	}
	defer conn.ExecContext(ctx, "DROP SCHEMA followup09_isolated CASCADE")
	_, err = conn.ExecContext(ctx, "SET search_path TO followup09_isolated")
	if err != nil {
		t.Fatal(err)
	}
	for _, p := range []string{"migrations/001_initial.sql", "migrations/002_location.sql"} {
		raw, err := os.ReadFile(p)
		if err != nil {
			t.Fatal(err)
		}
		if _, err = conn.ExecContext(ctx, string(raw)); err != nil {
			t.Fatal(err)
		}
	}
	var id int64
	if err = conn.QueryRowContext(ctx, `INSERT INTO events(title,location)VALUES($1,$2)RETURNING id`, "Alice's note", "A").Scan(&id); err != nil {
		t.Fatal(err)
	}
	var title string
	if err = conn.QueryRowContext(ctx, "SELECT title FROM events WHERE id=$1", id).Scan(&title); err != nil || title != "Alice's note" {
		t.Fatal(err, title)
	}
	tx, err := conn.BeginTx(ctx, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx, "INSERT INTO members(username)VALUES('duplicate')"); err != nil {
		t.Fatal(err)
	}
	if _, err = tx.ExecContext(ctx, "INSERT INTO members(username)VALUES('duplicate')"); err == nil {
		t.Fatal("重复值未被拒绝")
	}
	if err = tx.Rollback(); err != nil {
		t.Fatal(err)
	}
	var count int
	if err = conn.QueryRowContext(ctx, "SELECT count(*)FROM members WHERE username='duplicate'").Scan(&count); err != nil || count != 0 {
		t.Fatal(err, count)
	}
	if _, err = conn.ExecContext(ctx, `INSERT INTO registrations(event_id,member_id)VALUES(999999,999999)`); err == nil {
		t.Fatal("外键应拒绝不存在父行")
	}
	t.Log("真实 PostgreSQL：两次迁移、参数绑定、唯一约束回滚、外键检查通过")
}
```

## 独立变式与参考答案

任务：在新测试库给events新增description列，写003迁移并保留旧记录；查“所有未来活动及报名人数，零报名仍显示”；让第二步重复报名失败，查询第一步是否回滚；恢复备份到独立库核对一个确有报名的活动。

### 参考答案

003采用 `ALTER TABLE events ADD COLUMN description TEXT NOT NULL DEFAULT ''; INSERT INTO schema_migrations(version) VALUES(3)` 并包事务；第10课也使用003_auth，自己的实验另开库或选择不同版本，不能混用同号迁移。查询先WHERE未来、LEFT JOIN注册、count(r.id)、GROUP BY、ORDER BY starts_at,id。事务必须用同一个tx并检查Commit/Rollback后实际计数；恢复后找有报名活动，不只验证“0个孤儿”而库本身没有报名。

| 原知识点 | 章节 | 实际文件/证据 |
| --- | --- | --- |
| 关系数据库 | 2 | 001_initial.sql三表两外键 |
| 基础SQL | 3、4 | CREATE/INSERT/SELECT/UPDATE/DELETE |
| WHERE/ORDER/LIMIT | 5 | 未来活动10条与API分页 |
| JOIN | 6 | practice.sql，零报名0 |
| 索引 | 8 | 已有复合索引、member索引、EXPLAIN |
| 约束与一致性 | 2、7 | UNIQUE/FK/CHECK真实拒绝 |
| 事务 | 7 | db_test.go第二步失败，回滚计数0 |
| 迁移 | 3 | schema_migrations、002保留旧数据 |
| 参数化查询 | 9 | repository.go占位符，引号标题实际读取 |
| 数据访问层 | 9 | Store/SQLStore，HTTP与SQL分离 |
| 数据库选型 | 11 | SQLite/PostgreSQL实际适用差别 |
| 备份和恢复 | 11 | pg_dump -Fc / pg_restore新演练库 |
