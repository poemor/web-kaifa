# 身份与权限：真正登录后也要检查每个对象

这一阶段提供能启动的完整本地服务：注册普通成员、Argon2id密码哈希、随机Cookie会话、15分钟过期、退出撤销、CSRF令牌、登录限速、管理员活动CRUD，以及成员自己的报名/取消。没有伪造req.user，身份来自服务器验证过的会话，memberId来自这个身份而不是浏览器Body。

项目可以先用内存模式学习请求，再连第09阶段PostgreSQL。内存模式重启丢失账户/报名；数据库模式保留业务记录，但本例会话放服务器内存，重启需要重新登录。完整主例是教学可验证的起点，没有邮箱验证、找回密码、多因素、共享会话、审计平台、灾备与容量压测，不能把一页登录UI宣称为生产认证系统。

## 1. 用VS Code从空环境启动，并创建A/B两账户

完成Go安装并打开followup-10的含go.mod目录，执行go mod download、go fmt、go test。示例使用维护中的golang.org/x/crypto/argon2，不自己实现密码算法；go.mod/go.sum固定本次依赖版本。最低Go1.26.9包含当前标准库安全修复；官网当前稳定版也可。若旧Go自动下载toolchain提示网络失败，安装官网当前稳定版后重试，不关闭校验。

```powershell
go mod download
go test -v ./...
$env:ADMIN_USER='club_admin'
$env:ADMIN_PASSWORD='替换成自己选的至少12字符练习密码'
go run .
```

macOS/Linux两行环境设置改 `export ADMIN_USER='club_admin'`、`export ADMIN_PASSWORD='自己的密码'`。上面的文字占位需自行替换，不发布练习密码，不复用真实账号密码。ADMIN_USER限3–40小写字母/数字/下划线。默认http://127.0.0.1:8770，打开浏览器后先用终端设置的管理员登录，添加一条活动，否则报名没有目标。

用两个独立浏览器上下文，例如普通窗口A、另一浏览器B；同浏览器两普通标签页共享Cookie，不能当两账户隔离。A注册member_a01，B注册member_b01，各自选择12字符以上假练习密码，注册成功后再填密码登录。新注册者只能member，提交role字段被严格JSON解析拒绝。管理员身份只有服务端bootstrap创建，既有同名普通成员不会被自动提权。

```output
匿名浏览器：未登录，报名按钮不可用
管理员：club_admin · admin，可新增/编辑/删除活动
普通成员A：member_a01 · member，可报名与取消自己的报名
普通成员B：member_b01 · member，看到自己的报名列表
```

“按钮隐藏”只是UI反馈，后面的直接HTTP请求验证才证明服务器权限。

## 2. 认证与授权的权限矩阵

认证回答当前请求是谁，授权回答这个人对这个对象能做什么。Cookie字符串存在还不够：服务器要找到未过期会话，再查询当前成员。用户角色可能变化，所以不只信任浏览器传来的role，也不把固定历史角色永远缓存进Cookie。

| 操作 | 匿名 | member | admin |
| --- | --- | --- | --- |
| GET活动列表/详情 | 允许 | 允许 | 允许 |
| POST/PATCH/DELETE活动 | 401 | 403 | 正确CSRF后允许 |
| GET自己的报名 | 401 | 仅自己的 | 仅自己的 |
| POST报名/DELETE自己报名 | 401 | 正确CSRF后允许 | 正确CSRF后允许 |
| 删除别人的报名 | 401 | 不允许，404隐藏存在性 | 本例也不允许，404 |

401表示未认证/会话失效；403表示已认证却缺角色或CSRF；404用于不属于当前成员的报名与真正缺失，让客户端不能据此枚举别人报名存在性。管理员不是“默认能读所有隐私”，最小权限按产品规则制定。

## 3. 密码哈希：为什么盐、慢算法与参数都要保存

密码不能以明文保存，也不能用可逆加密替代口令验证。普通SHA256太快，数据库泄漏后离线猜测便宜。Argon2id刻意消耗时间和内存，提高每次猜测成本。随机salt让相同口令得到不同哈希，不是额外的秘密密钥。本例通过crypto/rand生成16字节salt，argon2.IDKey采用64MiB、3轮、4路、32字节结果，存成带算法/版本/参数的字符串。[Go Argon2id接口与参数](https://pkg.go.dev/golang.org/x/crypto/argon2)

验证时解析已存格式、按同参数重算，使用ConstantTimeCompare比较；仅支持自己当前格式、检查salt/hash长度，不接受客户端提交的哈希或任意巨大参数。算法来自成熟库，教学代码只是固定格式的封装，不是发明新算法。参数需要按服务器预算压测调整，不能每个请求无限并发64MiB；本例最多两次哈希同时执行，过忙503。

security_test中的同口令两次哈希不同、正确密码true、错误密码false，是可以跑的验证。SQL中password_hash不是原密码，Member的Hash标记json:"-"不会随登录响应返回。慢哈希能减轻离线攻击，不替代HTTPS、强密码、限速或账户恢复设计。[OWASP密码存储建议](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## 4. Cookie与服务器会话：登录、过期、退出发生什么

登录先严格校验结构和长度，查询用户，验证哈希，生成32随机字节会话ID与独立CSRF Token；服务端map保存userId、csrf、expires，Cookie只放不可预测的会话ID。登录成功会撤销当前旧Cookie对应会话，降低会话固定风险。不存在用户名也做dummyHash比较，错误统一“用户名或密码不正确”，不靠不同登录错误确认账户。

HttpOnly禁止一般页面JavaScript读取此Cookie，Secure只允许HTTPS携带，SameSite=Lax减少部分跨站携带。它们不是万能防护：XSS仍可能借用户浏览器发同源请求；SameSite也不是完整CSRF方案。Path=/只是发送范围，不是权限。Expires/MaxAge客户端到期便利与服务端Expires必须一起考虑，服务器每次验证过期才是底线。

本机HTTP开发使用Secure=false，否则浏览器可能不在普通HTTP发送Cookie而一直“登录后仍未登录”；仅监听127.0.0.1且练习假账号。APP_ENV=production会要求HTTPS APP_ORIGIN、DATABASE_URL并设Secure=true；公网不能关闭Secure凑合。反向代理终止TLS时浏览器仍是HTTPS，后端内部HTTP不改变外层Cookie安全策略。

F12→Application/Storage→Cookies查看club_session的HttpOnly、SameSite、路径和过期。不把值截图给AI。document.cookie看不到HttpOnly会话是正常，不通过取消HttpOnly来“修复”。退出POST带CSRF，服务端删除map记录，再发MaxAge=-1清Cookie；保存旧Cookie重放也401，不能只在页面清user状态假退出。

## 5. 每个敏感接口校验对象归属，防水平越权

POST /api/registrations只接受eventId，当前memberID从current()的已验证会话得到，服务端创建自己的报名。传memberId/role等未知字段400。GET报名按member_id过滤，DELETE SQL是 `WHERE id=$1 AND member_id=$2`，两个参数必须同时满足才删；影响0行返回404。

A先报名，记Response真实报名id。B向这个id发送DELETE，即使B已登录、知道id和拥有自己的CSRF，也必须404。再用A读取/取消，记录应仍在并可204取消。只检查资源存在或“有登录Cookie”都无法防这类水平越权；前端按钮不可见更没有保护。

SQLSecureStore和MemorySecureStore都实施同样归属规则。数据库UNIQUE防重复报名，重复409；删除活动CASCADE会删报名，管理员操作UI明确确认。角色信息从服务器成员记录取，不信任JWT-like浏览器字段。若以后增加管理员代办报名，必须定义额外权限和审计，而不是删掉member_id条件。

## 6. 输入验证、SQL注入与XSS：三个不同边界

请求最大8192字节，服务端检查标题/地点类型长度、用户名模式、密码字符和字节上限、eventId正整数。提交数组标题、10万字符、未知role都会4xx；这是数据合同，不是“删除特殊字符就安全”。合法名字可能含单引号，不能靠删引号当SQL注入防护。

SQL使用参数化，用户名、eventId、memberId、title、location从不拼进SQL语法。只有固定受控SQL与占位符。userId来自会话但依然传参数，不因为“内部值”就到处拼接。[Go SQL安全查询](https://go.dev/doc/database/sql-injection)

前端用textContent写活动和报名，标题 `<img src=x onerror=alert(1)>` 会显示文字而不是插入图片/执行事件。HTML输出上下文与SQL上下文不同，参数化不防XSS，textContent不防SQL注入。CSP仅允许同源脚本并禁止object/嵌入/外部表单，增加一道防线；不能因有CSP就改用innerHTML执行用户字符串。

## 7. CSRF：会话Cookie自动发送时，服务器怎么确定是本页面操作

Cookie会由浏览器按规则自动携带，恶意站点可能诱使浏览器提交状态改变请求。本例组合：所有写接口只允许同源Origin（如存在），登录/注册严格application/json，受保护写操作还要求X-CSRF-Token与服务端会话中的随机token一致，Cookie SameSite=Lax辅助。前端登录或GET /api/me取得自己的token并仅存内存，刷新会用me恢复。

在浏览器Console里**自己的本机页面**尝试不带CSRF发删除，Network403 csrf；带正确token允许自己的授权操作。另源的Origin即使带token也403 origin。curl可伪造Origin，但攻击者仍需会话和对应token；Origin不是身份认证。

GET /api/me是同源读取，不改变数据；第三方站点无法通过本例CORS读取token。JSON Content-Type跨源会预检，而服务器不开放安全会话CORS。未来确需分域Cookie时，要完整设计credentials、精确来源、Cookie属性和CSRF，不机械改Access-Control-Allow-Origin为*。[OWASP CSRF指导](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

## 8. 登录限速、依赖与秘密：具体措施及边界

本例每来源IP每分钟最多5次登录/注册尝试，超过429并Retry-After60。IP取直接RemoteAddr，不信任任意X-Forwarded-For。默认单进程、最多1000限速桶与1000会话，过期清理；参数适合观察教学，不是按真实用户预算做过压测。校园多人共用出口IP会误伤，生产要组合账号/来源/风险、代理可信链、共享限速与告警。当前Caddy后面多个用户可能表现为代理IP，因此公网前必须完成可信代理和共享限速设计，不能声称本地5次已经生产足够。

密码哈希也需要资源上限和服务端超时。限速不是认证，每分钟允许五次不代表第五次合法；接口每次仍校验密码/会话/对象。测试第6次错误登录得到429，在测试终端不要把大量请求打到真实网站。

Go依赖用go.mod/go.sum和官方来源。可按[Go漏洞工具](https://go.dev/doc/security/vuln/)安装 `go install golang.org/x/vuln/cmd/govulncheck@latest` 后运行govulncheck ./...，升级后重跑测试；前端npm audit查已知包风险，审计0告警不能证明业务授权没有bug。服务器DSN、管理员引导密码不发VITE_，不提交.env。泄漏后撤销/轮换实际凭据、检查访问、移除发布历史中的暴露，光删当前文件不使旧密码失效。

## 9. 数据库模式与已存在账户如何衔接

要使用第09课club_web，先以club_learner对那个库执行migrations/003_auth.sql，再设置同一个DATABASE_URL和PGPASSWORD并启动。001/002已执行不要重跑。003给members加password_hash和role；旧SQL种子没有密码，不能用统一默认密码悄悄激活，因此保留Hash空并拒绝登录；本课注册新用户名如member_a01。全新库需按001→002→003一次执行。

```powershell
psql -h 127.0.0.1 -p 5432 -U club_learner -d club_web -W -v ON_ERROR_STOP=1 -f migrations/003_auth.sql
$env:DATABASE_URL='postgres://club_learner@127.0.0.1:5432/club_web?sslmode=disable'
$env:PGPASSWORD='自己的练习库密码'
$env:ADMIN_USER='club_admin'
$env:ADMIN_PASSWORD='自己选择的引导管理员密码'
go run .
```

创建管理员只在同名不存在时执行；已存在有效管理员不会因改环境变量自动改密码，避免每次重启隐式覆盖。要做密码重置需另写受控管理流程/成熟身份服务，不在本页直接拼SQL明文密码。业务数据持久，进程会话仍重启失效。SQL权限实测在第11完整测试中使用专用_test数据库，不能将生产库复制进测试。

## 10. 错误、日志与可验证安全测试

用户错误只返回稳定code/message，500不含数据库host/密码/SQL/堆栈。本例响应含X-Request-ID，存储失败日志记录同request_id、错误类别（timeout/canceled/SQLSTATE/internal）及错误类型，不打印可能含密的err字符串、登录Body、Cookie、token、Hash。真实运维需受保护requestId、方法/路径、状态、耗时和错误类别；路径不要承载秘密，结构化日志也要脱敏。

先 `go test -v ./...`，查看TestSessionsOwnershipCSRFAndRoles、TestOriginAndRateLimit、TestArgon2SaltAndVerify均PASS。测试用只存在于测试文件的假密码，直接构造HTTP请求并检查状态、Cookie属性、旧会话和归属，删除/取消后将键盘焦点移到常驻“重新获取”，避免列表重建把焦点丢到body；过期通过可控时钟推进16分钟，不要求你实际等15分钟。

Network排错顺序：login是否200/set-cookie→me是否200→Cookie是否发送→csrf header是否存在→resource属于谁→响应401/403/404/409。只在Go authorized、current、CancelRegistration处断点检查u.ID/role和安全判断，不在Console打印真实Cookie。把问题交给AI时提供脱敏请求方法、路径、状态、自己与资源owner的测试编号和已做检查；不要贴密码、token、完整DSN。

## 完整主例：逐个文件保存

下面每个标题都是相对练习目录的真实文件名。在 VS Code 左侧新建对应文件夹和文件，粘贴整段代码，按 Ctrl+S（macOS 为 Cmd+S）保存；不要把不同文件的代码拼进同一文件。完整下载目录已经包含这些文件，直接打开时无需重复抄写。`package-lock.json` 和 `go.sum` 随源码下载，手工重建时分别由 npm install 和 go mod tidy 生成。

### 完整文件：go.mod

```text
module example.com/learn/followup-10

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

## 独立变式：以攻击者能直接请求为前提验收

自己写五个HTTP测试：匿名写401，member直接管理员删除403，A删除B报名404且原记录仍在，缺CSRF403，退出旧Cookie401。再给标题写标签/中文/引号，检查前端只显示文字、数据库原值能读取。尝试空数组、超大body和过期会话，分别解释状态码。

### 参考答案

正确判断在服务器而非组件。trusted identity取current会话，注册Body拒绝memberId；SQL删除需要id与member_id两个条件。取消别人的报名返回404但应再用原主人GET确认未删，而不是只看到错误就信任数据正确。CSRF错误与角色不足同为403但code不同；数据库不可用不应被解释成“密码错了”。XSS文本测试不执行任何真实恶意代码，只用受控字串观察渲染。

| 原知识点 | 详细章节 | 完整实现/结果 |
| --- | --- | --- |
| 认证vs授权 | 2、5 | Cookie身份、角色矩阵、对象归属 |
| 安全密码 | 3 | Argon2id库、随机盐、常量时间验证 |
| 会话/Cookie | 4 | HttpOnly/Lax/生产Secure、过期与注销 |
| 权限校验 | 2、5 | 每个活动写接口admin检查 |
| 水平越权 | 5、10 | A/B报名DELETE404，自己204 |
| 输入验证 | 6 | 严格JSON/8KiB/类型/长度 |
| SQL注入 | 6、9 | 所有用户值参数化，带引号正常 |
| XSS | 6 | textContent/CSP，标签按文本 |
| CSRF | 7 | session随机Token+Origin+SameSite |
| 速率限制 | 8 | 6次429、Retry-After、代理边界 |
| HTTPS与秘密 | 4、8 | production拒绝HTTP/无DB，秘密不入前端 |
| 错误与日志 | 10 | 对外通用500、不打印密码Cookie |
| 依赖风险 | 8 | 固定依赖、govulncheck与升级验证 |
