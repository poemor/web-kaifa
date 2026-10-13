# 联调、测试、部署与恢复：把完整系统交给另一台电脑

这一阶段使用独立完整目录，不要求你回头拼几十个未定义函数。它含第10课活动/成员/报名/安全会话服务、PostgreSQL迁移、Go接口/SQL测试、Playwright浏览器链路、Docker多阶段构建、Compose、可选HTTPS反向代理、CI示例和备份恢复脚本。先在本机完成真实流程，再讨论公网部署；GitHub Pages只能托管静态文件，不能直接运行Go进程或PostgreSQL。

本课已在隔离本机PostgreSQL真实验证迁移、数据读写、A/B归属、浏览器注册→登录→报名→取消→退出和逻辑备份恢复。当前审核机Dockerdaemon未运行，所以Compose仅配置解析通过，容器构建/云主机DNS/TLS和远程GitHub工作流尚未实际执行；这些必须由学习者按下面步骤在自己的环境完成，不写成已经上线。

## 1. 从完整目录启动并准备真实演练数据

打开followup-11目录，检查go.mod、web、migrations、deploy、e2e。使用第09课方法创建独立club_web_dev和club_web_test（owner自己的非超级用户）；dev按001→002→003迁移，test交给独立schema测试。数据库为空时启动管理员并添加一条“报名测试”活动，否则E2E没有报名目标。

```powershell
go mod download
go vet ./...
$env:TEST_DATABASE_URL='postgres://club_learner@127.0.0.1:5432/club_web_test?sslmode=disable'
$env:PGPASSWORD='自己练习数据库账户密码'
go test -v ./...
$env:DATABASE_URL='postgres://club_learner@127.0.0.1:5432/club_web_dev?sslmode=disable'
$env:ADMIN_USER='club_admin'
$env:ADMIN_PASSWORD='自己的至少12字符管理员密码'
go run .
```

连接密码不放命令截图或Git。浏览器http://127.0.0.1:8770，用管理员创建活动，用普通新成员报名。独立目录包含完整源码，不依赖第10目录相对import。Go测试不需要你跑一个占固定端口的服务；浏览器E2E需要正在运行的练习服务。

## 2. 联调定位：沿着四层找证据

浏览器事件→HTTP网络→Go API/权限→PostgreSQL。无请求先看事件/Console；connection refused检查进程和端口；400看JSON；401看会话；403看角色/CSRF/Origin；500看受保护应用错误日志和数据库状态。Network里点请求记录URL、method、Payload、状态与Response，不把返回HTML的静态404当JSON解析bug。

制造受控数据库故障：只在隔离练习环境停止自己的数据库服务，访问health应503，活动查询500，不返回DSN；恢复服务后health200。不要为练习停已有真实系统。本审核只模拟/验证自己的隔离DB连接，不对用户生产服务操作。给健康检查加数据库Ping说明依赖是否可达，不把“进程还在”当整个系统可用。

断点按层设置：Sources的api请求行、Go security.authorized、repository查询。对有Token/Cookie的请求只观察是否存在和判断结果，不打印值。启动日志说明模式和公开origin，应用生产日志应增加脱敏requestId/错误类别/耗时，反向代理与应用日志关联。

## 3. 测试金字塔与真实断言

单元测规则/密码格式，HTTP接口测方法/字段/身份/权限/错误，SQL集成测真实约束/事务/迁移，E2E测浏览器与后端组合。范围越广，通常越慢且失败定位更复杂，因此不能把每个小纯函数都只用E2E验证，也不能只有unit便宣称全链路正确。

| 风险 | 较小测试 | 组合测试 |
| --- | --- | --- |
| 标题全空白/超长 | NormalizeInput用例 | POST400、超body413 |
| 账户密码与会话 | 同密码不同盐/错误口令 | 登录Cookie/过期/退出401 |
| A/B资源隔离 | Store按owner过滤 | B删A404且A记录保留 |
| 报名重复/关系 | DB UNIQUE/FK事务 | 重复POST409与浏览器反馈 |
| 页面操作失联 | API合同 | 注册→登录→报名→取消→退出 |

Go security_test真实执行匿名401/member403/CSRF403/假memberId400/重复409/A-B404/注销401/过期401/第6次429。db_security_test执行SQL账户与归属，db_test执行两迁移、引号参数、失败事务回滚、外键拒绝。只看到PASS但有SKIP时，跳过项不能算验收。

## 4. 数据库隔离与Playwright实际用户流程

TEST_DATABASE_URL必须指向自己创建的_test后缀库。测试先查询current_database确认名字，再创建专用隔离schema，结束清理该schema，不能使用生产库。后缀校验只是防误用一层，仍需账户/网络/权限隔离，不能给生产库改后缀后照跑。故障留下的同名schema先查内容，不自动覆盖。

在另一个终端、同目录运行：

```powershell
npm ci
npx playwright install chromium
npm run test:e2e
```

首次安装浏览器包需要网络与磁盘。如果使用已安装Edge，Windows可 `$env:E2E_EDGE='1'` 后运行npm run test:e2e；CI使用Playwright安装的Chromium。baseURL默认8770，测试会创建独立e2e_时间戳成员，所以**只接受127.0.0.1/localhost**，非本机地址直接拒绝写入。

预期输出 `1 passed`。测试点击注册、登录、报名、取消、退出并断言身份/报名状态；不能只page.goto后截图就说E2E。失败保留trace于test-results，`npx playwright show-trace 实际trace.zip路径`可看请求和步骤；trace也可能含教学数据，真实账号不用于本例。

## 5. 环境配置与部署架构

开发、测试、生产的数据库、密码、域名、日志/安全开关必须分开。本地main支持无DSN内存模式，但production必须有DB和HTTPS origin。前端已由Go同源提供，公网可选Caddy终止TLS并反代给app，PostgreSQL只在容器内网，不映射5432到公网。

```text
浏览器 HTTPS example.your-domain
        ↓ DNS解析到你控制的主机IP
Caddy 80/443：证书与反向代理
        ↓ 内网HTTP app:8770（页面与/api同源）
Go应用：会话/授权/校验/repository
        ↓ 容器内网 db:5432
PostgreSQL：成员/活动/报名 + volume
```

DNS决定域名指向哪台主机，证书让浏览器验证TLS站点身份，反向代理把路径转到内部应用；DNS不会帮你启动Go，证书也不授权用户删除活动。若前端单独GitHub Pages，API必须是实际HTTPS后端，CORS与会话重新设计；HTTPS网页fetch HTTP后端会有混合内容阻止，不能靠允许CORS解决。

## 6. Docker/Compose：依赖健康与迁移顺序

从[Docker Desktop官方](https://docs.docker.com/desktop/)按自己系统安装并启动，Windows需符合官方虚拟化/WSL条件，重启要求按安装器执行。终端 `docker version`应同时有Client与Server，只有CLI版本不等于daemon工作；`docker compose version`应可用。Docker与Go原生运行二选一启动路径，先停本机同端口服务。

在练习目录复制.env.example为.env，用自己的假演练秘密填写POSTGRES_PASSWORD、APP_DB_PASSWORD、ADMIN_USER/ADMIN_PASSWORD，其他配置按说明保持；Compose读取.env，Go原生不自动读它。不要发 `docker compose config` 的展开结果给AI，因为里面可能含密码，验证用quiet：

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose logs --tail 50 app
```

浏览器打开http://127.0.0.1:18770。app映射只127.0.0.1，db不向主机发布端口。本地development Cookie不Secure，只用于本机假账号。migrate等待DB health，通过schema_migrations只执行未应用001/002/003，app等migrate成功再启动；不能用固定sleep猜数据库何时好。[Compose依赖就绪](https://docs.docker.com/compose/how-tos/startup-order/)

PostgreSQL18官方volume位置为/var/lib/postgresql，不沿用17的/data路径。db的club_owner是仅用于初始化/迁移/备份的管理账户，init-app-role脚本建立NOSUPERUSER/NOCREATEDB的club_app，应用使用独立APP_DB_PASSWORD和DML权限，不能直接拿管理账户接每个HTTP请求。密码由PGPASSWORD与URL分离，避免特殊字符破坏DSN。默认权限授予之后由owner创建的表/序列；已有volume不会重新运行init脚本或因为改.env重置密码。[官方PostgreSQL镜像](https://github.com/docker-library/docs/blob/master/postgres/README.md)

Dockerfile多阶段先go build，最终distroless非root只含二进制/静态页面；没有shell是特性，应用日志通过docker logs看。compose.yml能解析不等于image拉取/构建/容器运行通过；本次审核明确容器尚未实际跑，学习者执行ps/health/业务测试才补证据。

## 7. HTTPS公网发布：条件明确的完整入口

你需要实际控制的主机、公网域名、DNS A/AAAA、80/443可达、防火墙规则、Docker运行时以及受保护备份位置。先完成本地演练，不在当前学习网站Pages上硬执行Go。上传自己独立项目的源码与.env，不上传node_modules/备份；秘密文件仅受保护主机/secret管理，不入Git。

在.env设DOMAIN为真实域名，再使用两个文件组合：

```powershell
docker compose -f compose.yml -f compose.production.yml config --quiet
docker compose -f compose.yml -f compose.production.yml up --build -d
```

production覆盖用`!reset []`去掉app主机端口，只有Caddy暴露80/443；需要支持该标签的Compose版本，旧版本升级而不是删安全覆盖。Caddy使用实际域名自动管理证书，APP_ORIGIN为https域名，Cookie Secure开启。不存在可控域名/主机时这一段保持待执行，不拿example.invalid当上线地址。

这只是单实例部署起点。先补可信代理IP与共享限速/会话、账户恢复、访问审计、监控、异机备份、更新策略后再承接真实用户。Caddy后直接RemoteAddr是代理IP，当前教学限速会把多人合并，不能冒称生产已经完整。HTTPS和Docker不是自动安全验收。

## 8. 日志、健康与容量：从“可访问”到可观察

/health执行数据库Ping，正常200；数据库不可用503。它不返回库名/账户/连接串。监控至少关心成功率、4xx/5xx变化、请求耗时分位、DB连接数、磁盘与备份年龄。CPU低也可能全部请求数据库超时，连接上限过小或过大都需要测量。

本例连接池每进程5连接，N实例最大约5N，再加迁移/管理连接要小于DB许可预算。哈希64MiB同时两次约128MiB，加Go/DB/系统内存；单核/小免费主机可能响应慢，先实测并限制资源，不因内存耗尽随手把密码改成SHA256。

估算：假设100日活、每人20次API/天、每次响应10KiB，一个30日月约100×20×30×10KiB=约586MiB响应，不含页面、重试、图片、日志、备份与TLS开销。100张每张2MiB图片单轮读取就约200MiB；托管价格/免费额度/休眠会变，查看自己提供方当前条款，不把固定免费承诺写进教程。记录请求量、响应大小、存储增长、RPO/RTO再选套餐。

## 9. 备份与恢复：文件生成后还要查业务关系

在Compose练习目录、PowerShell执行：

```powershell
./deploy/backup.ps1
./deploy/restore-practice.ps1 -BackupFile 'backups/替换实际生成的文件名.dump' -TargetDatabase 'club_restore_test01'
```

备份脚本pg_dump -Fc先在db容器写/tmp文件，再docker cp，避免旧PowerShell二进制文本重定向损坏；输出SHA256用于传输校验，不证明业务完整。恢复脚本只接受club_restore_前缀的新库，创建失败不自动删旧库，不覆盖club_practice；pg_restore --exit-on-error并查询events/members/registrations数、孤儿关系数和迁移版本。

macOS/Linux可执行同样Docker命令：先 `docker compose exec -T db pg_dump -U club_owner -d club_practice -Fc -f /tmp/club.dump`，再 `docker cp 容器真实ID:/tmp/club.dump ./club.dump`；建立新演练库后把文件复制到容器并pg_restore。原生命令行方式见第09课。备份工具版本与服务器匹配，备份文件限制访问、加密异机保存，不提交Git，SQL账户哈希也属敏感数据。

演练前至少有一条实际报名；记录原库计数、该报名的活动/成员关系、迁移版本、备份时间。恢复后同计数且关系正确、orphans0、版本3；有记录时才说明外键恢复有效，不以空库orphans0蒙混。再启动单独应用指向恢复库，用教学账户登录检查业务。原服务会话不在dump中，所以恢复后重新登录正常。

RPO是能接受丢失多长时间数据，例如每日备份可能丢最多近一天；RTO是目标恢复耗时。记录备份频率、保留数量、失效告警、恢复时长和责任人，不只写“每天备份”。磁盘损坏会同时毁同机数据库与同机备份，所以需要另一受控存储位置。

## 10. 发布与回滚：代码回退不等于数据库倒回

记录当前镜像/提交、迁移版本、近期可恢复备份；新版本先在隔离测试库/预演环境验收，再执行兼容迁移，启动新应用，检查health和登录/报名/A-B权限。migration失败时app不启动，保留日志，不“跳过失败继续”。

本课程002增加location、003增加可空hash/角色默认值属于增量演示；旧应用不使用新列可继续运行，但旧08/09无权限的应用不能在公网作为安全版的回滚目标。真正上一版必须保持相同安全合同。删除/重命名字段、不可逆数据转换会导致旧应用不兼容，不能自动DROP新列假回滚。

回滚演练在独立副本：打标签release-a，修改一个页面文案为release-b并故意让test失败，阻止发布；若部署后发现问题，切回安全的release-a镜像/代码，保持兼容DB，重新health和业务验收。数据库损坏或不可兼容迁移需按恢复方案到新实例，并评估备份后新数据损失；不能在真实库上直接restore覆盖来“快速修复”。本课没有替用户执行任何生产发布/回滚。

## 11. CI：真正存在的命令、故意失败与交接

ci/verify.yml是可复制到独立项目 `.github/workflows/verify.yml` 的完整工作流。它创建一次性postgres服务、设置_test数据库、go vet/test/build、执行真实迁移、启动服务/创建活动、npm ci、安装Chromium、跑注册登录报名取消退出E2E。没有--if-present跳过缺失测试。示例CI假密码只用于每次销毁的隔离服务，不是真实秘密；真实服务使用GitHub Secrets/环境，不硬编码。[GitHub Actions工作流](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs)

源码在本资料仓库的ci子目录不会自动成为资料网站的后端部署工作流。要实际验证CI，把完整followup-11作为自己的独立仓库，复制workflow到正确路径，推一个测试分支/PR，在Actions点开每步日志；成功说明这些步骤通过，仍需线上业务和恢复演练。

故意失败：在自己的测试分支把TestSessionsOwnershipCSRFAndRoles匿名POST的期望从401改201，go test必须FAIL；提交到测试PR，verify必须红并保留断言日志，然后恢复401再确认绿。不会以“workflow创建了”就声称已验证阻断；本次已真实执行本地同等命令，远程工作流还需独立仓库运行证据。

README交接必须写环境/启动地址/变量含义/迁移/合同/测试/备份/恢复/生产边界。另一位同学只读README从空目录启动并记录卡点；看不到你的终端历史也能运行才算可交接。env.example用占位，任何导出学习记录都不能携带实际服务密码。

## 完整主例：逐个文件保存

下面每个标题都是相对练习目录的真实文件名。在 VS Code 左侧新建对应文件夹和文件，粘贴整段代码，按 Ctrl+S（macOS 为 Cmd+S）保存；不要把不同文件的代码拼进同一文件。完整下载目录已经包含这些文件，直接打开时无需重复抄写。`package-lock.json` 和 `go.sum` 随源码下载，手工重建时分别由 npm install 和 go mod tidy 生成。

### 完整文件：go.mod

```text
module example.com/learn/followup-11

go 1.26.9

require (
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/pgx/v5 v5.11.0 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	golang.org/x/crypto v0.58.0 // indirect
	golang.org/x/sync v0.24.0 // indirect
	golang.org/x/sys v0.49.0 // indirect
	golang.org/x/text v0.43.0 // indirect
)
```

### 完整文件：.env.example

```text
# 示例不可直接当作真实配置；Go不会自动读取.env，启动前设置终端环境变量。
APP_ADDR=127.0.0.1:8770
APP_ORIGIN=http://127.0.0.1:8770
APP_ENV=development
ADMIN_USER=club_admin
ADMIN_PASSWORD=替换成你自己的至少12字符练习密码
# 空值使用内存模式；真实持久化改成自己的独立练习库。
DATABASE_URL=
# 以下是Compose独立练习配置，全部需要自己填。密码与URL分开通过PGPASSWORD读取。
POSTGRES_PASSWORD=替换数据库管理账户密码
APP_DB_PASSWORD=替换应用专用数据库密码
# 仅在实际购买域名并设置DNS后使用production覆盖文件。
DOMAIN=替换你实际控制的域名
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
	"strings"
	"time"
)

func main() {
	addr := os.Getenv("APP_ADDR")
	if addr == "" {
		addr = "127.0.0.1:8770"
	}
	origin := os.Getenv("APP_ORIGIN")
	if origin == "" {
		origin = "http://127.0.0.1:8770"
	}
	production := os.Getenv("APP_ENV") == "production"
	if production && (!strings.HasPrefix(origin, "https://") || os.Getenv("DATABASE_URL") == "") {
		log.Fatal("production 需要 HTTPS APP_ORIGIN 与持久数据库")
	}
	var store SecureStore = NewMemorySecureStore()
	if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
		db, err := sql.Open("pgx", dsn)
		if err != nil {
			log.Fatal("数据库配置错误")
		}
		defer db.Close()
		db.SetMaxOpenConns(5)
		db.SetMaxIdleConns(2)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err = db.PingContext(ctx)
		cancel()
		if err != nil {
			log.Fatal("数据库连接失败")
		}
		store = &SQLSecureStore{SQLStore: &SQLStore{db: db}}
	} else {
		log.Print("本机内存模式：重启丢失账户/报名；不是第09课持久化验收")
	}
	if err := bootstrapAdmin(context.Background(), store, os.Getenv("ADMIN_USER"), os.Getenv("ADMIN_PASSWORD")); err != nil {
		log.Fatal("管理员初始化失败；核对环境变量与迁移，不要公开密码或连接串")
	}
	security, err := NewSecurity(store, origin, production)
	if err != nil {
		log.Fatal("会话服务初始化失败")
	}
	srv := &http.Server{Addr: addr, Handler: security.Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	go func() {
		<-ctx.Done()
		timeout, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(timeout)
	}()
	log.Printf("社团安全教学服务: %s", origin)
	if err = srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
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

### 完整文件：identity_store.go

```go
package main

import (
	"context"
	"sync"
)

type Member struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	Hash     string `json:"-"`
}
type Registration struct {
	ID       int64 `json:"id"`
	EventID  int64 `json:"eventId"`
	MemberID int64 `json:"memberId"`
}
type SecureStore interface {
	Store
	FindMember(context.Context, string) (Member, error)
	MemberByID(context.Context, int64) (Member, error)
	CreateMember(context.Context, string, string, string) (Member, error)
	ListRegistrations(context.Context, int64) ([]Registration, error)
	Register(context.Context, int64, int64) (Registration, error)
	CancelRegistration(context.Context, int64, int64) error
}
type MemorySecureStore struct {
	*MemoryStore
	identityMu        sync.Mutex
	users             map[int64]Member
	regs              map[int64]Registration
	nextUser, nextReg int64
}

func NewMemorySecureStore() *MemorySecureStore {
	return &MemorySecureStore{MemoryStore: NewMemoryStore(), users: map[int64]Member{}, regs: map[int64]Registration{}, nextUser: 1, nextReg: 1}
}
func (s *MemorySecureStore) FindMember(_ context.Context, name string) (Member, error) {
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	for _, u := range s.users {
		if u.Username == name {
			return u, nil
		}
	}
	return Member{}, ErrMissing
}
func (s *MemorySecureStore) MemberByID(_ context.Context, id int64) (Member, error) {
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	u, ok := s.users[id]
	if !ok {
		return u, ErrMissing
	}
	return u, nil
}
func (s *MemorySecureStore) CreateMember(_ context.Context, name, hash, role string) (Member, error) {
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	for _, u := range s.users {
		if u.Username == name {
			return Member{}, ErrConflict
		}
	}
	u := Member{ID: s.nextUser, Username: name, Hash: hash, Role: role}
	s.nextUser++
	s.users[u.ID] = u
	return u, nil
}
func (s *MemorySecureStore) ListRegistrations(_ context.Context, memberID int64) ([]Registration, error) {
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	out := []Registration{}
	for _, r := range s.regs {
		if r.MemberID == memberID {
			out = append(out, r)
		}
	}
	return out, nil
}
func (s *MemorySecureStore) Register(_ context.Context, memberID, eventID int64) (Registration, error) {
	s.MemoryStore.mu.Lock()
	defer s.MemoryStore.mu.Unlock()
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	if _, ok := s.items[eventID]; !ok {
		return Registration{}, ErrMissing
	}
	if _, ok := s.users[memberID]; !ok {
		return Registration{}, ErrMissing
	}
	for _, r := range s.regs {
		if r.MemberID == memberID && r.EventID == eventID {
			return Registration{}, ErrConflict
		}
	}
	r := Registration{ID: s.nextReg, EventID: eventID, MemberID: memberID}
	s.nextReg++
	s.regs[r.ID] = r
	return r, nil
}
func (s *MemorySecureStore) Delete(_ context.Context, id int64) error {
	s.MemoryStore.mu.Lock()
	defer s.MemoryStore.mu.Unlock()
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	if _, ok := s.items[id]; !ok {
		return ErrMissing
	}
	delete(s.items, id)
	for key, r := range s.regs {
		if r.EventID == id {
			delete(s.regs, key)
		}
	}
	return nil
}
func (s *MemorySecureStore) CancelRegistration(_ context.Context, id, memberID int64) error {
	s.identityMu.Lock()
	defer s.identityMu.Unlock()
	r, ok := s.regs[id]
	if !ok || r.MemberID != memberID {
		return ErrMissing
	}
	delete(s.regs, id)
	return nil
}

type SQLSecureStore struct{ *SQLStore }

func scanMember(row interface{ Scan(...any) error }) (Member, error) {
	var u Member
	err := row.Scan(&u.ID, &u.Username, &u.Hash, &u.Role)
	return u, databaseError(err)
}
func (s *SQLSecureStore) FindMember(ctx context.Context, name string) (Member, error) {
	return scanMember(s.db.QueryRowContext(ctx, "SELECT id,username,coalesce(password_hash,''),role FROM members WHERE username=$1", name))
}
func (s *SQLSecureStore) MemberByID(ctx context.Context, id int64) (Member, error) {
	return scanMember(s.db.QueryRowContext(ctx, "SELECT id,username,coalesce(password_hash,''),role FROM members WHERE id=$1", id))
}
func (s *SQLSecureStore) CreateMember(ctx context.Context, name, hash, role string) (Member, error) {
	return scanMember(s.db.QueryRowContext(ctx, "INSERT INTO members(username,password_hash,role)VALUES($1,$2,$3)RETURNING id,username,password_hash,role", name, hash, role))
}
func (s *SQLSecureStore) ListRegistrations(ctx context.Context, memberID int64) ([]Registration, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT id,event_id,member_id FROM registrations WHERE member_id=$1 ORDER BY id", memberID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Registration{}
	for rows.Next() {
		var r Registration
		if err = rows.Scan(&r.ID, &r.EventID, &r.MemberID); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
func (s *SQLSecureStore) Register(ctx context.Context, memberID, eventID int64) (Registration, error) {
	var r Registration
	err := s.db.QueryRowContext(ctx, "INSERT INTO registrations(event_id,member_id)VALUES($1,$2)RETURNING id,event_id,member_id", eventID, memberID).Scan(&r.ID, &r.EventID, &r.MemberID)
	return r, databaseError(err)
}
func (s *SQLSecureStore) CancelRegistration(ctx context.Context, id, memberID int64) error {
	result, err := s.db.ExecContext(ctx, "DELETE FROM registrations WHERE id=$1 AND member_id=$2", id, memberID)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err == nil && count == 0 {
		return ErrMissing
	}
	return err
}
```

### 完整文件：security.go

```go
package main

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"golang.org/x/crypto/argon2"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"
)

// 调用维护中的 Argon2id 实现；64MiB / 3 passes / 4 lanes 的参数会随哈希保存。
func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	hash := argon2.IDKey([]byte(password), salt, 3, 64*1024, 4, 32)
	return fmt.Sprintf("$argon2id$v=19$m=65536,t=3,p=4$%s$%s", base64.RawStdEncoding.EncodeToString(salt), base64.RawStdEncoding.EncodeToString(hash)), nil
}
func verifyPassword(encoded, password string) bool {
	p := strings.Split(encoded, "$")
	if len(p) != 6 || p[1] != "argon2id" || p[2] != "v=19" || p[3] != "m=65536,t=3,p=4" {
		return false
	}
	salt, e1 := base64.RawStdEncoding.DecodeString(p[4])
	hash, e2 := base64.RawStdEncoding.DecodeString(p[5])
	if e1 != nil || e2 != nil || len(salt) != 16 || len(hash) != 32 {
		return false
	}
	got := argon2.IDKey([]byte(password), salt, 3, 64*1024, 4, 32)
	return subtle.ConstantTimeCompare(got, hash) == 1
}
func randomToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b), err
}
func validAccount(name, password string) bool {
	if len(name) < 3 || len(name) > 40 || utf8.RuneCountInString(password) < 12 || len(password) > 128 {
		return false
	}
	for _, c := range name {
		if !(c >= 'a' && c <= 'z' || c >= '0' && c <= '9' || c == '_') {
			return false
		}
	}
	return true
}

type session struct {
	UserID  int64
	CSRF    string
	Expires time.Time
}
type bucket struct {
	Count int
	Until time.Time
}
type Security struct {
	api       *API
	store     SecureStore
	origin    string
	secure    bool
	mu        sync.Mutex
	sessions  map[string]session
	limits    map[string]bucket
	dummyHash string
	slots     chan struct{}
	now       func() time.Time
	ttl       time.Duration
}

func NewSecurity(store SecureStore, origin string, secure bool) (*Security, error) {
	dummy, err := hashPassword("unusable dummy password value")
	if err != nil {
		return nil, err
	}
	return &Security{api: NewAPI(store, ""), store: store, origin: origin, secure: secure, sessions: map[string]session{}, limits: map[string]bucket{}, dummyHash: dummy, slots: make(chan struct{}, 2), now: time.Now, ttl: 15 * time.Minute}, nil
}
func (s *Security) allowAttempt(r *http.Request) bool {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	now := s.now()
	for key, b := range s.limits {
		if !now.Before(b.Until) {
			delete(s.limits, key)
		}
	}
	if len(s.limits) >= 1000 {
		if _, ok := s.limits[host]; !ok {
			return false
		}
	}
	b := s.limits[host]
	if !now.Before(b.Until) {
		b = bucket{Until: now.Add(time.Minute)}
	}
	b.Count++
	s.limits[host] = b
	return b.Count <= 5
}
func (s *Security) current(r *http.Request) (Member, session, error) {
	cookie, err := r.Cookie("club_session")
	if err != nil {
		return Member{}, session{}, ErrMissing
	}
	s.mu.Lock()
	v, ok := s.sessions[cookie.Value]
	if ok && !s.now().Before(v.Expires) {
		delete(s.sessions, cookie.Value)
		ok = false
	}
	s.mu.Unlock()
	if !ok {
		return Member{}, session{}, ErrMissing
	}
	u, err := s.store.MemberByID(r.Context(), v.UserID)
	return u, v, err
}
func (s *Security) authorized(w http.ResponseWriter, r *http.Request, admin, write bool) (Member, bool) {
	u, v, err := s.current(r)
	if err != nil {
		if !errors.Is(err, ErrMissing) {
			s.api.storeError(w, err)
			return u, false
		}
		fail(w, 401, "unauthorized", "请先登录或会话已过期")
		return u, false
	}
	if admin && u.Role != "admin" {
		fail(w, 403, "forbidden", "需要管理员权限")
		return u, false
	}
	if write {
		csrf := r.Header.Get("X-CSRF-Token")
		if len(csrf) != len(v.CSRF) || subtle.ConstantTimeCompare([]byte(csrf), []byte(v.CSRF)) != 1 {
			fail(w, 403, "csrf", "安全令牌无效，请重新登录")
			return u, false
		}
	}
	return u, true
}
func (s *Security) credentials(w http.ResponseWriter, r *http.Request, register bool) {
	if !s.allowAttempt(r) {
		w.Header().Set("Retry-After", "60")
		fail(w, 429, "rate_limit", "尝试过多，请一分钟后重试")
		return
	}
	select {
	case s.slots <- struct{}{}:
		defer func() { <-s.slots }()
	default:
		fail(w, 503, "busy", "登录服务忙，请稍后重试")
		return
	}
	var in struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if !decodeJSON(w, r, &in) {
		return
	}
	in.Username = strings.ToLower(strings.TrimSpace(in.Username))
	if !validAccount(in.Username, in.Password) {
		fail(w, 400, "validation", "用户名需 3–40 个小写字母/数字/下划线，密码需 12 个字符以上且至多 128 字节")
		return
	}
	if register {
		hash, err := hashPassword(in.Password)
		if err != nil {
			fail(w, 500, "internal", "账户服务不可用")
			return
		}
		u, err := s.store.CreateMember(r.Context(), in.Username, hash, "member")
		if err != nil {
			s.api.storeError(w, err)
			return
		}
		writeJSON(w, 201, u)
		return
	}
	u, err := s.store.FindMember(r.Context(), in.Username)
	hash := s.dummyHash
	if err == nil && u.Hash != "" {
		hash = u.Hash
	}
	matched := verifyPassword(hash, in.Password)
	if err != nil || u.Hash == "" || !matched {
		fail(w, 401, "invalid_credentials", "用户名或密码不正确")
		return
	}
	token, err := randomToken()
	if err != nil {
		fail(w, 500, "internal", "登录不可用")
		return
	}
	csrf, err := randomToken()
	if err != nil {
		fail(w, 500, "internal", "登录不可用")
		return
	}
	s.mu.Lock()
	for key, v := range s.sessions {
		if !s.now().Before(v.Expires) {
			delete(s.sessions, key)
		}
	}
	if len(s.sessions) >= 1000 {
		s.mu.Unlock()
		fail(w, 503, "busy", "会话容量已满，请稍后重试")
		return
	}
	if old, e := r.Cookie("club_session"); e == nil {
		delete(s.sessions, old.Value)
	}
	s.sessions[token] = session{UserID: u.ID, CSRF: csrf, Expires: s.now().Add(s.ttl)}
	s.mu.Unlock()
	http.SetCookie(w, &http.Cookie{Name: "club_session", Value: token, Path: "/", HttpOnly: true, Secure: s.secure, SameSite: http.SameSiteLaxMode, MaxAge: int(s.ttl.Seconds())})
	writeJSON(w, 200, map[string]any{"user": u, "csrfToken": csrf, "expiresInSeconds": int(s.ttl.Seconds())})
}
func (s *Security) Handler() http.Handler {
	m := http.NewServeMux()
	m.HandleFunc("POST /api/register", func(w http.ResponseWriter, r *http.Request) { s.credentials(w, r, true) })
	m.HandleFunc("POST /api/login", func(w http.ResponseWriter, r *http.Request) { s.credentials(w, r, false) })
	m.HandleFunc("GET /api/me", func(w http.ResponseWriter, r *http.Request) {
		u, v, err := s.current(r)
		if err != nil {
			if !errors.Is(err, ErrMissing) {
				s.api.storeError(w, err)
				return
			}
			fail(w, 401, "unauthorized", "未登录或会话已过期")
			return
		}
		writeJSON(w, 200, map[string]any{"user": u, "csrfToken": v.CSRF})
	})
	m.HandleFunc("POST /api/logout", func(w http.ResponseWriter, r *http.Request) {
		if _, ok := s.authorized(w, r, false, true); !ok {
			return
		}
		cookie, _ := r.Cookie("club_session")
		s.mu.Lock()
		delete(s.sessions, cookie.Value)
		s.mu.Unlock()
		http.SetCookie(w, &http.Cookie{Name: "club_session", Value: "", Path: "/", HttpOnly: true, Secure: s.secure, SameSite: http.SameSiteLaxMode, MaxAge: -1})
		w.WriteHeader(204)
	})
	m.HandleFunc("GET /api/registrations", func(w http.ResponseWriter, r *http.Request) {
		u, ok := s.authorized(w, r, false, false)
		if !ok {
			return
		}
		items, err := s.store.ListRegistrations(r.Context(), u.ID)
		if err != nil {
			s.api.storeError(w, err)
			return
		}
		writeJSON(w, 200, items)
	})
	m.HandleFunc("POST /api/registrations", func(w http.ResponseWriter, r *http.Request) {
		u, ok := s.authorized(w, r, false, true)
		if !ok {
			return
		}
		var in struct {
			EventID int64 `json:"eventId"`
		}
		if !decodeJSON(w, r, &in) {
			return
		}
		if in.EventID < 1 {
			fail(w, 400, "validation", "eventId 必须为正整数")
			return
		}
		item, err := s.store.Register(r.Context(), u.ID, in.EventID)
		if err != nil {
			s.api.storeError(w, err)
			return
		}
		writeJSON(w, 201, item)
	})
	m.HandleFunc("DELETE /api/registrations/{id}", func(w http.ResponseWriter, r *http.Request) {
		u, ok := s.authorized(w, r, false, true)
		if !ok {
			return
		}
		id, ok := eventID(w, r)
		if !ok {
			return
		}
		if err := s.store.CancelRegistration(r.Context(), id, u.ID); err != nil {
			s.api.storeError(w, err)
			return
		}
		w.WriteHeader(204)
	})
	for _, pattern := range []string{"POST /api/events", "PATCH /api/events/{id}", "DELETE /api/events/{id}"} {
		m.HandleFunc(pattern, func(w http.ResponseWriter, r *http.Request) {
			if _, ok := s.authorized(w, r, true, true); !ok {
				return
			}
			if r.Method == "DELETE" {
				s.api.remove(w, r)
			} else {
				s.api.save(w, r)
			}
		})
	}
	m.Handle("/", s.api.Handler())
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Request-ID", strconv.FormatUint(requestSequence.Add(1), 10))
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		if r.Method != "GET" && r.Method != "HEAD" {
			if origin := r.Header.Get("Origin"); origin != "" && origin != s.origin {
				fail(w, 403, "origin", "请求来源不允许")
				return
			}
		}
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		m.ServeHTTP(w, r.WithContext(ctx))
	})
}
func bootstrapAdmin(ctx context.Context, store SecureStore, name, password string) error {
	if !validAccount(name, password) {
		return errors.New("请设置有效 ADMIN_USER / ADMIN_PASSWORD（密码至少12字符）")
	}
	if user, err := store.FindMember(ctx, name); err == nil {
		if user.Role != "admin" || user.Hash == "" {
			return errors.New("现有同名账户不是有效管理员，拒绝自动提权")
		}
		return nil
	} else if !errors.Is(err, ErrMissing) {
		return err
	}
	hash, err := hashPassword(password)
	if err != nil {
		return err
	}
	_, err = store.CreateMember(ctx, name, hash, "admin")
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

### 完整文件：migrations/003_auth.sql

```sql
BEGIN;
ALTER TABLE members ADD COLUMN password_hash TEXT;
ALTER TABLE members ADD COLUMN role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin'));
-- 第09课旧成员没有密码，不能凭猜测为他们设置统一密码。
-- 教学服务只允许 password_hash 非空的新账户登录；旧记录留作 SQL 对照。
INSERT INTO schema_migrations(version) VALUES(3);
COMMIT;
```

### 完整文件：web/index.html

```html
<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>社团安全会话</title><link rel="stylesheet" href="/style.css"><main><h1>登录、报名与权限</h1><p>本地练习服务；管理员由终端环境创建，新注册者一律为普通成员。Cookie 会话15分钟过期，重启服务后需重新登录。</p><form id="account"><label for="username">用户名（3–40个小写字母/数字/下划线）</label><input id="username" required minlength="3" maxlength="40" autocomplete="username"><label for="password">密码（至少12字符、最多128字节）</label><input id="password" type="password" required minlength="12" autocomplete="current-password"><button>登录</button><button type="button" id="register">注册普通成员</button></form><button id="logout">退出会话</button><p id="status" role="status"></p><p id="identity">未登录</p><section id="admin" hidden><h2>管理员活动管理</h2><form id="editor"><input id="event-id" type="hidden"><label for="title">活动标题</label><input id="title" required maxlength="100"><label for="location">地点</label><input id="location" maxlength="100"><button>保存活动</button><button type="button" id="cancel-edit">取消编辑</button></form></section><h2>公开活动</h2><button id="refresh">重新获取</button><ul id="events"></ul><h2>我的报名</h2><ul id="registrations"></ul></main><script src="/app.js" defer></script></html>
```

### 完整文件：web/style.css

```css
*{box-sizing:border-box}body{margin:0;background:#f6f5f1;color:#252b29;font:18px/1.7 system-ui}main{max-width:55rem;padding:1.5rem;margin:auto}form{display:grid;gap:.6rem}input,button{font:inherit;padding:.55rem;border:1px solid #9ba49f;border-radius:.3rem}button{cursor:pointer;background:#fff}button:focus-visible,input:focus-visible{outline:3px solid #156a5a;outline-offset:3px}li{padding:1rem;border-bottom:1px solid #ccc;overflow-wrap:anywhere}li button{margin:.5rem}button:disabled{opacity:.5;cursor:wait}
```

### 完整文件：web/app.js

```javascript
let csrf='',user=null;
const status=document.querySelector('#status'),account=document.querySelector('#account'),editor=document.querySelector('#editor');
async function api(path,options={}){const res=await fetch(path,{...options,credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf,...options.headers}});if(res.status===204)return null;const body=await res.json();if(!res.ok)throw new Error(body.error?.message??`HTTP ${res.status}`);return body;}
const report=err=>status.textContent=err.message;
async function identity(){try{const data=await api('/api/me');csrf=data.csrfToken;user=data.user;}catch{csrf='';user=null;}document.querySelector('#identity').textContent=user?`${user.username} · ${user.role}`:'未登录';document.querySelector('#admin').hidden=user?.role!=='admin';}
async function refresh(){await identity();try{const events=await api('/api/events'),out=document.querySelector('#events');out.replaceChildren();for(const e of events){const li=document.createElement('li'),label=document.createElement('span');label.textContent=`#${e.id} ${e.title} · ${e.location}`;li.append(label);const register=document.createElement('button');register.textContent='报名';register.disabled=!user;register.onclick=async()=>{try{await api('/api/registrations',{method:'POST',body:JSON.stringify({eventId:e.id})});status.textContent='已写入我的报名';await refresh();}catch(err){report(err);}};li.append(register);if(user?.role==='admin'){const edit=document.createElement('button');edit.textContent='编辑';edit.onclick=()=>{editor.querySelector('#event-id').value=e.id;editor.elements.title.value=e.title;editor.elements.location.value=e.location;editor.elements.title.focus();};const del=document.createElement('button');del.textContent='删除活动';del.onclick=async()=>{if(!confirm('删除活动并删除相关报名？'))return;try{await api(`/api/events/${e.id}`,{method:'DELETE'});document.querySelector('#refresh').focus();await refresh();}catch(err){report(err);}};li.append(edit,del);}out.append(li);}const mine=document.querySelector('#registrations');mine.replaceChildren();if(user){const regs=await api('/api/registrations');for(const r of regs){const li=document.createElement('li');li.textContent=`报名 #${r.id}，活动 #${r.eventId} `;const cancel=document.createElement('button');cancel.textContent='取消报名';cancel.onclick=async()=>{try{await api(`/api/registrations/${r.id}`,{method:'DELETE'});status.textContent='报名已取消';document.querySelector('#refresh').focus();await refresh();}catch(err){report(err);}};li.append(cancel);mine.append(li);}if(!regs.length)mine.textContent='尚无报名记录';}}catch(err){report(err);}}
async function authenticate(register){const username=account.elements.username.value,password=account.elements.password.value;try{const result=await api(register?'/api/register':'/api/login',{method:'POST',body:JSON.stringify({username,password})});account.elements.password.value='';if(register){status.textContent='普通成员已创建，现在输入密码登录';}else{csrf=result.csrfToken;status.textContent='登录成功，Cookie会话已建立';await refresh();}}catch(err){report(err);}}
account.onsubmit=e=>{e.preventDefault();authenticate(false);};document.querySelector('#register').onclick=()=>{if(account.reportValidity())authenticate(true);};
document.querySelector('#logout').onclick=async()=>{try{await api('/api/logout',{method:'POST'});csrf='';user=null;status.textContent='服务器会话已撤销';await refresh();}catch(err){report(err);}};
editor.onsubmit=async e=>{e.preventDefault();const id=editor.querySelector('#event-id').value;try{await api(id?`/api/events/${id}`:'/api/events',{method:id?'PATCH':'POST',body:JSON.stringify({title:editor.elements.title.value,location:editor.elements.location.value})});editor.reset();status.textContent='管理员活动已保存';await refresh();}catch(err){report(err);}};
document.querySelector('#cancel-edit').onclick=()=>editor.reset();document.querySelector('#refresh').onclick=refresh;refresh();
```

### 完整文件：security_test.go

```go
package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type loginData struct {
	User Member `json:"user"`
	CSRF string `json:"csrfToken"`
}

func secureRequest(h http.Handler, method, path, body string, cookie *http.Cookie, csrf string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	r.RemoteAddr = "127.0.0.1:12345"
	r.Header.Set("Content-Type", "application/json")
	if cookie != nil {
		r.AddCookie(cookie)
	}
	if csrf != "" {
		r.Header.Set("X-CSRF-Token", csrf)
	}
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}
func fixture(t *testing.T) (*Security, http.Handler) {
	t.Helper()
	store := NewMemorySecureStore()
	hash, err := hashPassword("Test-only-password-123")
	if err != nil {
		t.Fatal(err)
	}
	for _, u := range []struct{ Name, Role string }{{"member_a", "member"}, {"member_b", "member"}, {"club_admin", "admin"}} {
		if _, err = store.CreateMember(context.Background(), u.Name, hash, u.Role); err != nil {
			t.Fatal(err)
		}
	}
	s, err := NewSecurity(store, "http://127.0.0.1:8770", false)
	if err != nil {
		t.Fatal(err)
	}
	return s, s.Handler()
}
func loginFixture(t *testing.T, h http.Handler, name string) (*http.Cookie, string) {
	t.Helper()
	w := secureRequest(h, "POST", "/api/login", `{"username":"`+name+`","password":"Test-only-password-123"}`, nil, "")
	if w.Code != 200 {
		t.Fatal(w.Code, w.Body)
	}
	var data loginData
	if err := json.Unmarshal(w.Body.Bytes(), &data); err != nil {
		t.Fatal(err)
	}
	cookies := w.Result().Cookies()
	if len(cookies) != 1 || !cookies[0].HttpOnly || cookies[0].SameSite != http.SameSiteLaxMode {
		t.Fatal("Cookie属性不正确", cookies)
	}
	return cookies[0], data.CSRF
}
func TestSessionsOwnershipCSRFAndRoles(t *testing.T) {
	s, h := fixture(t)
	a, csrfA := loginFixture(t, h, "member_a")
	b, csrfB := loginFixture(t, h, "member_b")
	admin, csrfAdmin := loginFixture(t, h, "club_admin")
	cases := []struct {
		method, path, body string
		cookie             *http.Cookie
		csrf               string
		want               int
	}{
		{"POST", "/api/events", `{"title":"test"}`, nil, "", 401},
		{"POST", "/api/events", `{"title":"test"}`, a, csrfA, 403},
		{"POST", "/api/events", `{"title":"test"}`, admin, "", 403},
		{"POST", "/api/events", `{"title":"<img src=x onerror=alert(1)>","location":""}`, admin, csrfAdmin, 201},
		{"POST", "/api/registrations", `{"eventId":1,"memberId":2}`, a, csrfA, 400},
		{"POST", "/api/registrations", `{"eventId":1}`, a, csrfA, 201},
		{"POST", "/api/registrations", `{"eventId":1}`, a, csrfA, 409},
		{"DELETE", "/api/registrations/1", "", b, csrfB, 404},
		{"GET", "/api/registrations", "", b, "", 200},
		{"DELETE", "/api/registrations/1", "", a, csrfA, 204},
		{"POST", "/api/logout", "", a, csrfA, 204},
		{"GET", "/api/me", "", a, "", 401},
	}
	for _, c := range cases {
		w := secureRequest(h, c.method, c.path, c.body, c.cookie, c.csrf)
		if w.Code != c.want {
			t.Fatalf("%s %s got %d %s want %d", c.method, c.path, w.Code, w.Body, c.want)
		}
	}
	s.now = func() time.Time { return time.Now().Add(16 * time.Minute) }
	w := secureRequest(h, "GET", "/api/me", "", b, "")
	if w.Code != 401 {
		t.Fatal("过期会话应拒绝", w.Code)
	}
}
func TestOriginAndRateLimit(t *testing.T) {
	_, h := fixture(t)
	r := httptest.NewRequest("POST", "/api/login", strings.NewReader(`{"username":"member_a","password":"Test-only-password-123"}`))
	r.Header.Set("Origin", "https://attacker.invalid")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != 403 {
		t.Fatal(w.Code)
	}
	for i := 0; i < 6; i++ {
		w = secureRequest(h, "POST", "/api/login", `{"username":"unknown_user","password":"incorrect-password-123"}`, nil, "")
		want := 401
		if i == 5 {
			want = 429
		}
		if w.Code != want {
			t.Fatal(i, w.Code, w.Body)
		}
	}
	if w.Header().Get("Retry-After") == "" {
		t.Fatal("缺少重试提示")
	}
}
func TestArgon2SaltAndVerify(t *testing.T) {
	first, err := hashPassword("Test-only-password-123")
	if err != nil {
		t.Fatal(err)
	}
	second, err := hashPassword("Test-only-password-123")
	if err != nil {
		t.Fatal(err)
	}
	if first == second || !verifyPassword(first, "Test-only-password-123") || verifyPassword(first, "wrong") {
		t.Fatal("盐/验证不符合预期")
	}
	if strings.Contains(first, "Test-only") {
		t.Fatal("存储了明文")
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

### 完整文件：db_security_test.go

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

func TestRealSQLIdentityOwnership(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("未设置独立测试库，未执行SQL权限实测")
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	ctx := context.Background()
	var name string
	if err = db.QueryRowContext(ctx, "SELECT current_database()").Scan(&name); err != nil {
		t.Fatal("无法连接测试库")
	}
	if !strings.HasSuffix(name, "_test") {
		t.Fatal("测试库名必须以_test结尾")
	}
	if _, err = db.ExecContext(ctx, "CREATE SCHEMA followup11_security_isolated"); err != nil {
		t.Fatal(err)
	}
	defer db.ExecContext(ctx, "DROP SCHEMA followup11_security_isolated CASCADE")
	if _, err = db.ExecContext(ctx, "SET search_path TO followup11_security_isolated"); err != nil {
		t.Fatal(err)
	}
	for _, p := range []string{"migrations/001_initial.sql", "migrations/002_location.sql", "migrations/003_auth.sql"} {
		raw, err := os.ReadFile(p)
		if err != nil {
			t.Fatal(err)
		}
		if _, err = db.ExecContext(ctx, string(raw)); err != nil {
			t.Fatal(err)
		}
	}
	store := &SQLSecureStore{SQLStore: &SQLStore{db: db}}
	hash, err := hashPassword("Test-only-password-123")
	if err != nil {
		t.Fatal(err)
	}
	a, err := store.CreateMember(ctx, "db_member_a", hash, "member")
	if err != nil {
		t.Fatal(err)
	}
	b, err := store.CreateMember(ctx, "db_member_b", hash, "member")
	if err != nil {
		t.Fatal(err)
	}
	event, err := store.Create(ctx, EventInput{Title: "持久报名", Location: "A"})
	if err != nil {
		t.Fatal(err)
	}
	reg, err := store.Register(ctx, a.ID, event.ID)
	if err != nil {
		t.Fatal(err)
	}
	if err = store.CancelRegistration(ctx, reg.ID, b.ID); err != ErrMissing {
		t.Fatal("B越权应拒绝", err)
	}
	if _, err = store.Register(ctx, a.ID, event.ID); err != ErrConflict {
		t.Fatal("重复报名应409", err)
	}
	if err = store.CancelRegistration(ctx, reg.ID, a.ID); err != nil {
		t.Fatal(err)
	}
	t.Log("真实SQL：专用schema内账户/活动/报名、A/B归属与UNIQUE通过")
}
```

### 完整文件：Dockerfile

```text
FROM golang:1.26.9 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 go build -trimpath -o /club .
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /club /app/club
COPY web /app/web
EXPOSE 8770
USER nonroot:nonroot
ENTRYPOINT ["/app/club"]
```

### 完整文件：.dockerignore

```text
.env
.env.*
!.env.example
node_modules
backups
*.dump
.git
*.log
```

### 完整文件：compose.yml

```yaml
name: club-practice
services:
  db:
    image: postgres:18.6
    environment:
      POSTGRES_DB: club_practice
      POSTGRES_USER: club_owner
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set your local database password in .env}
      APP_DB_PASSWORD: ${APP_DB_PASSWORD:?set a separate application database password}
    volumes:
      - club_data:/var/lib/postgresql
      - ./deploy/init-app-role.sh:/docker-entrypoint-initdb.d/01-app-role.sh:ro
    healthcheck:
      test: [CMD-SHELL, 'pg_isready -U club_owner -d club_practice']
      interval: 3s
      timeout: 3s
      retries: 15
  migrate:
    image: postgres:18.6
    depends_on:
      db: {condition: service_healthy}
    environment:
      PGPASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
    volumes:
      - ./migrations:/migrations:ro
      - ./deploy/migrate.sh:/migrate.sh:ro
    entrypoint: [sh, /migrate.sh]
    restart: 'no'
  app:
    build: .
    depends_on:
      migrate: {condition: service_completed_successfully}
    environment:
      APP_ADDR: 0.0.0.0:8770
      APP_ORIGIN: http://127.0.0.1:18770
      APP_ENV: development
      # pgx读取PGPASSWORD环境变量，密码不拼接进URL。
      DATABASE_URL: postgres://club_app@db:5432/club_practice?sslmode=disable
      PGPASSWORD: ${APP_DB_PASSWORD:?set APP_DB_PASSWORD}
      ADMIN_USER: ${ADMIN_USER:?set ADMIN_USER}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:?set ADMIN_PASSWORD}
    ports:
      - '127.0.0.1:18770:8770'
volumes:
  club_data:
```

### 完整文件：compose.production.yml

```yaml
# 仅在完成云主机/域名/防火墙/外部备份后使用；不会帮你创建云账户或DNS。
services:
  app:
    ports: !reset []
    environment:
      APP_ENV: production
      APP_ORIGIN: https://${DOMAIN:?set a domain that points to your server}
  proxy:
    image: caddy:2
    depends_on: [app]
    environment:
      DOMAIN: ${DOMAIN:?set DOMAIN}
    ports: ['80:80', '443:443']
    volumes:
      - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
volumes:
  caddy_data:
  caddy_config:
```

### 完整文件：deploy/init-app-role.sh

```sh
#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 -v app_password="$APP_DB_PASSWORD" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
CREATE ROLE club_app LOGIN PASSWORD :'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE club_practice TO club_app;
GRANT USAGE ON SCHEMA public TO club_app;
ALTER DEFAULT PRIVILEGES FOR ROLE club_owner IN SCHEMA public GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO club_app;
ALTER DEFAULT PRIVILEGES FOR ROLE club_owner IN SCHEMA public GRANT USAGE,SELECT ON SEQUENCES TO club_app;
SQL
```

### 完整文件：deploy/migrate.sh

```sh
#!/bin/sh
set -eu
# 只对本Compose练习库执行。已应用版本不再次执行；迁移文件不可事后改写。
for version in 1 2 3; do
  exists=$(psql -h db -U club_owner -d club_practice -Atc "SELECT to_regclass('public.schema_migrations') IS NOT NULL")
  applied=0
  if [ "$exists" = t ]; then
    applied=$(psql -h db -U club_owner -d club_practice -Atc "SELECT count(*) FROM schema_migrations WHERE version=$version")
  fi
  if [ "$applied" = 0 ]; then
    case "$version" in
      1) file=/migrations/001_initial.sql ;;
      2) file=/migrations/002_location.sql ;;
      3) file=/migrations/003_auth.sql ;;
    esac
    psql -h db -U club_owner -d club_practice -v ON_ERROR_STOP=1 -f "$file"
  fi
done
```

### 完整文件：deploy/Caddyfile

```text
{$DOMAIN} {
    encode zstd gzip
    reverse_proxy app:8770
}
```

### 完整文件：deploy/backup.ps1

```powershell
param([string]$OutputDirectory='backups')
$ErrorActionPreference='Stop'
# 不把数据库二进制流经过旧PowerShell的文本重定向。容器先写文件，再docker cp。
$backupRoot=[IO.Path]::GetFullPath((Join-Path $PWD $OutputDirectory))
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$container=docker compose ps -q db
if($LASTEXITCODE -ne 0 -or !$container){throw '练习数据库容器未启动'}
docker compose exec -T db pg_dump -U club_owner -d club_practice -Fc -f /tmp/club-practice.dump
if($LASTEXITCODE -ne 0){throw 'pg_dump失败，未生成可用备份'}
$target=Join-Path $backupRoot "club-practice-$stamp.dump"
docker cp "${container}:/tmp/club-practice.dump" $target
if($LASTEXITCODE -ne 0){throw '备份拷贝失败'}
docker compose exec -T db rm -f /tmp/club-practice.dump
Get-FileHash -Algorithm SHA256 -LiteralPath $target
Write-Host "备份已保存: $target；请继续恢复演练，生成文件本身不等于可恢复。"
```

### 完整文件：deploy/restore-practice.ps1

```powershell
param([Parameter(Mandatory)][string]$BackupFile,[string]$TargetDatabase='club_restore_test')
$ErrorActionPreference='Stop'
if($TargetDatabase -notmatch '^club_restore_[a-z0-9_]+$'){throw '只接受club_restore_前缀的新演练库；拒绝覆盖业务库'}
$source=[IO.Path]::GetFullPath($BackupFile)
if(!(Test-Path -LiteralPath $source -PathType Leaf)){throw '备份文件不存在'}
$container=docker compose ps -q db
if($LASTEXITCODE -ne 0 -or !$container){throw '练习数据库容器未启动'}
docker compose exec -T db createdb -U club_owner $TargetDatabase
if($LASTEXITCODE -ne 0){throw '创建演练库失败；如名字已存在，请选新的名字，不自动删除旧库'}
docker cp $source "${container}:/tmp/club-restore.dump"
if($LASTEXITCODE -ne 0){throw '拷贝失败'}
docker compose exec -T db pg_restore -U club_owner -d $TargetDatabase --no-owner --exit-on-error /tmp/club-restore.dump
if($LASTEXITCODE -ne 0){throw '恢复失败，请保留日志与演练库排查'}
docker compose exec -T db psql -U club_owner -d $TargetDatabase -v ON_ERROR_STOP=1 -c 'SELECT count(*) AS events FROM events; SELECT count(*) AS members FROM members; SELECT count(*) AS registrations FROM registrations; SELECT count(*) AS orphans FROM registrations r LEFT JOIN events e ON e.id=r.event_id LEFT JOIN members m ON m.id=r.member_id WHERE e.id IS NULL OR m.id IS NULL; SELECT max(version) AS schema_version FROM schema_migrations;'
if($LASTEXITCODE -ne 0){throw '恢复后的核对失败'}
docker compose exec -T db rm -f /tmp/club-restore.dump
Write-Host "已恢复到独立演练库 $TargetDatabase，请核对计数和关键记录，再决定清理。原库未被覆盖。"
```

### 完整文件：package.json

```json
{"name":"club-release-check","private":true,"scripts":{"test:e2e":"playwright test"},"devDependencies":{"@playwright/test":"1.64.0"}}
```

### 完整文件：playwright.config.cjs

```javascript
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'./e2e',use:{baseURL:process.env.E2E_BASE_URL||'http://127.0.0.1:8770',headless:true,trace:'retain-on-failure'},projects:[{name:'chromium',use:{browserName:'chromium',...(process.env.E2E_EDGE?{channel:'msedge'}:{})}}]});
```

### 完整文件：e2e/registration.spec.cjs

```javascript
const {test,expect}=require('@playwright/test');
test('注册→登录→报名→取消→退出',async({page})=>{
  // 每次生成独立教学账户；不允许把E2E_BASE_URL设成生产网站。
  const base=new URL(process.env.E2E_BASE_URL||'http://127.0.0.1:8770');
  if(!['127.0.0.1','localhost'].includes(base.hostname))throw new Error('E2E只接受本机练习服务，拒绝写入线上');
  const name='e2e_'+Date.now(),password='Test-only-password-123';
  await page.goto('/');await page.getByLabel(/用户名/).fill(name);await page.getByLabel(/密码/).fill(password);await page.getByRole('button',{name:'注册普通成员'}).click();await expect(page.locator('#status')).toContainText('普通成员已创建');
  await page.getByLabel(/密码/).fill(password);await page.getByRole('button',{name:'登录',exact:true}).click();await expect(page.locator('#identity')).toContainText(name);
  await page.locator('#events').getByRole('button',{name:'报名',exact:true}).first().click();await expect(page.locator('#registrations')).toContainText('报名 #');
  await page.getByRole('button',{name:'取消报名',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('#registrations')).toContainText('尚无报名');await expect(page.locator('#refresh')).toBeFocused();
  await page.getByRole('button',{name:'退出会话'}).click();await expect(page.locator('#identity')).toHaveText('未登录');
});
```

### 完整文件：ci/verify.yml

```yaml
# 将独立项目作为自己的仓库时，复制为 .github/workflows/verify.yml。
# 当前学习资料仓库不会因新增这个示例而自动部署后端。
name: club-verify
on: [push, pull_request]
permissions:
  contents: read
jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:18.6
        env:
          POSTGRES_USER: tutorial
          POSTGRES_PASSWORD: ci-only-disposable-password
          POSTGRES_DB: club_ci_test
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U tutorial -d club_ci_test"
          --health-interval 3s --health-timeout 3s --health-retries 15
    env:
      TEST_DATABASE_URL: postgres://tutorial:ci-only-disposable-password@127.0.0.1:5432/club_ci_test?sslmode=disable
      DATABASE_URL: postgres://tutorial:ci-only-disposable-password@127.0.0.1:5432/club_ci_test?sslmode=disable
      ADMIN_USER: club_admin
      ADMIN_PASSWORD: ci-only-disposable-admin
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
          cache: true
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: npm
      - run: go vet ./...
      - run: go test -v ./...
      - run: go build -o /tmp/club .
      - run: |
          for file in migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"; done
          /tmp/club >/tmp/club.log 2>&1 &
          for attempt in $(seq 1 30); do curl --fail http://127.0.0.1:8770/health && break; sleep 1; done
          curl --fail -H 'Content-Type: application/json' -d '{"username":"club_admin","password":"ci-only-disposable-admin"}' -c /tmp/cookie http://127.0.0.1:8770/api/login > /tmp/login.json
          csrf=$(node -p 'JSON.parse(require("fs").readFileSync("/tmp/login.json","utf8")).csrfToken')
          curl --fail -H 'Content-Type: application/json' -H "X-CSRF-Token: $csrf" -b /tmp/cookie -d '{"title":"CI 活动","location":"练习环境"}' http://127.0.0.1:8770/api/events
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

## 独立交付任务与参考答案

自己记录一份验收：一个member报名→重复409→B删A404→A取消204；停自己的隔离DB→health503→恢复200；备份含一个活动与报名→恢复新库→计数、关系与版本匹配；破坏HTTP权限断言→测试失败→修复通过。另画实际部署图和容量估算，不沿用本课example域名说已经上云。

### 参考答案

业务验收要有请求与最终数据库状态两方面证据。恢复选择新库并对比实际id关系，报名0的库不能证明有报名关系恢复。故意失败不合并发布，保持原安全分支。容量以实测/约束为依据，Go每实例5连接、密码哈希两并发只是本例设置，不是任何产品通用参数。GitHub工作流绿不保证备份恢复，备份文件存在也不保证恢复流程。

| 原知识点 | 章节 | 完整配置/证据 |
| --- | --- | --- |
| 联调定位 | 2 | 浏览器→API→DB、health503 |
| 测试金字塔 | 3 | 规则/HTTP/SQL/E2E风险矩阵 |
| 接口自动化 | 3 | security_test/db_security_test的正常与失败 |
| E2E | 4 | registration.spec.cjs五步、trace |
| 数据库隔离 | 1、4 | TEST_DATABASE_URL后缀+专用schema |
| 环境管理 | 5、6 | dev/test/production不同库与秘密 |
| 部署架构 | 5 | HTTPS代理→同源Go→内网DB |
| 域名/HTTPS | 7 | Caddyfile/production覆盖/实际DNS条件 |
| 日志与监控 | 2、8 | 无秘密错误、健康与指标 |
| 数据备份 | 9 | backup.ps1/restore-practice.ps1真实恢复合同 |
| 发布回滚 | 10 | 安全旧版与兼容迁移/新库恢复 |
| CI基础 | 11 | 完整真实脚本，无if-present跳过 |
| 文档与交接 | 11 | README/env示例/API/恢复/边界 |
| 容量与成本 | 8 | 请求字节估算、DB/哈希预算、免费休眠 |
