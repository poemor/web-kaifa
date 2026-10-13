# 自己的API：从浏览器请求走到Go服务器

上一阶段使用受控mock，这一阶段真的实现活动CRUD。完整目录包含可独立启动的Go服务器、内存repository、请求解析/校验、统一错误、同源前端和测试。不是需要你“自行补齐req.user”的伪代码。为了与本仓库Go路线衔接，主例采用Go标准库；原路线Node/Express或Python/FastAPI也给实际可运行分支，先选一种完成合同，不要同期开三套服务抢同一端口。

本阶段数据存进**服务器进程内存**，重启恢复种子，下一阶段才持久化。这一版没有身份/权限，仅监听本机，用自己的假测试活动，不公开给真实报名用户。

## 1. 环境、目录与第一次请求

先完成本站“安装与起步教程→Go环境”，`go version`应为1.26.9或更新的受支持补丁版本；本例go.mod已明确版本。打开解压后含go.mod、main.go、web的followup-08目录，终端确认当前路径。已有go.mod不要在根目录重新go mod init。首次重建文件可用 `go mod init example.com/learn/followup-08`，主例只用标准库。

```powershell
go version
go fmt ./...
go test -v ./...
go run .
```

终端出现 `http://127.0.0.1:8768`，保持进程运行。浏览器打开此地址，页面与API同源。再开一个终端执行：

```powershell
curl.exe -i http://127.0.0.1:8768/health
curl.exe -i http://127.0.0.1:8768/api/events
```

Windows显式curl.exe避免旧PowerShell的curl别名；macOS/Linux使用curl去掉.exe。health预期200、`{"status":"ok"}`，活动列表200、`[{"id":1,"title":"图论训练","location":"教室 A"}]`。输出前面的HTTP头不是JSON的一部分。终端不出现新命令提示符正常，服务正在等请求；Ctrl+C才退出。

## 2. 请求/响应模型与HTTP合同

创建活动经过五步：浏览器序列化JSON→网络把请求送到8768→Go路由匹配POST /api/events→解析校验并调用Store.Create→返回201与新对象。数据库尚未参与，MemoryStore只是进程中的map。静态前端由同一个Go进程提供，GET /返回HTML，GET /api/events返回JSON，两种响应不能混为一谈。[HTTP概览](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/Overview)

| 方法与路径 | 输入与用途 | 成功响应 |
| --- | --- | --- |
| GET /api/events?q=图&limit=20&offset=0 | 按标题子串过滤、限定数量、稳定id排序 | 200，数组，空时[] |
| GET /api/events/1 | 读取指定活动 | 200，活动对象 |
| POST /api/events | JSON title、location；服务器分配id | 201，对象与Location头 |
| PATCH /api/events/1 | 至少提供title或location之一，合并其余字段 | 200，更新后的对象 |
| DELETE /api/events/1 | 删除指定活动 | 204，无body |

GET不写入；POST产生新资源；PATCH只改指定字段；DELETE删除。URL用资源名不是 `/doDelete`。204表示响应体没有内容，前端不能res.json()解析204，否则会报Unexpected end of JSON input。不存在id返回404，与查到空列表200不同。

## 3. JSON、Content-Type与服务端验证

Content-Type表示请求体格式，JSON字符串需要双引号，不能是JavaScript对象字面量 `{title:'A'}`。decodeJSON先检查application/json，MaxBytesReader最多8192字节，Decoder拒绝未知字段、错误类型和多个JSON对象。服务器title按Unicode字符计数1–100，location最多100；strings.TrimSpace去掉首尾空白，只有空格的标题400。前端required和maxlength是便利，服务器规则才保护直接请求。[Go HTTP与JSON](https://pkg.go.dev/net/http)

在当前练习目录新建并保存 create.json，再用文件发送，避免PowerShell/Unix在复杂双引号上的差别：

```json
{"title":"算法分享","location":"教室 B"}
```

```powershell
curl.exe -i -H 'Content-Type: application/json' --data-binary '@create.json' http://127.0.0.1:8768/api/events
```

新启动服务的预期201，id2，Location /api/events/2。再次GET应有两条；若先前已创建过，id可以更大，使用**实际响应id**。然后新建 patch.json `{"location":"线上会议"}`：

```powershell
curl.exe -i -X PATCH -H 'Content-Type: application/json' --data-binary '@patch.json' http://127.0.0.1:8768/api/events/2
curl.exe -i http://127.0.0.1:8768/api/events/2
curl.exe -i -X DELETE http://127.0.0.1:8768/api/events/2
curl.exe -i http://127.0.0.1:8768/api/events/2
```

PATCH后title仍是算法分享，location改变；删除204；再次读取404。patch.json若提供null，本例指针解码把该字段视为未提供，若只有null返回400；API不把null当“清空文字”。要清空地点传空字符串，标题空字符串400。

## 4. 状态码和一致的错误对象

主例失败为 `{"error":{"code":"validation","message":"标题须为 1–100 个字符"}}`。code供程序识别，message让人阅读。客户端500不带SQL、连接串、堆栈；日志也不打印秘密。课程所用状态含：200读取/更新、201创建、204删除、400输入不合法、404缺失、409约束冲突、413体积过大、415格式不支持、500内部故障。401/403在身份权限阶段才有真实含义，不能把任意500换成401掩盖问题。

把create.json改为 `{"title":"  "}` 得400；`{"title":[]}` 得400；带未知role得400；请求 /api/events/abc 得400；/api/events/999999得404；少Content-Type得415。测试里使用failingStore真正返回错误，断言500且对外不泄漏DSN。不要仅断言“有返回”而不看状态与body。

## 5. 分层：哪个文件负责什么，为什么要interface

main.go负责读取环境、组装对象、开启/停止HTTP服务。api.go处理方法路径、Content-Type、JSON、HTTP状态。NormalizeInput是业务规则，不依赖HTTP。Store interface表示需要的能力。MemoryStore负责数据结构、id分配、锁、排序和分页。下一阶段SQLStore实现同样接口，HTTP层大部分不变。

将“标题不为空”直接散在三个路由会让规则不一致；集中NormalizeInput后单测能直接调用，不用启动浏览器。本例让PATCH先读取旧值、合并用户提供字段、再次校验。小项目先拆清职责，不为“看起来专业”引入十层空文件。Mutex防止多个HTTP请求同时读写map；next只增不靠len+1，删除旧记录后不会撞id。内存模型仍不提供数据库级持久性和事务。

## 6. 异步I/O与错误传播：Go和await的不同表达

Node里的await等待Promise，拒绝必须捕获；Go的HTTP服务通常为请求运行goroutine，数据库调用返回error，错误沿函数返回到handler。两者都不能把I/O失败静默当空数据。store.List返回`([]Event,error)`：空数组+nil表示正确查不到，nil+error表示操作失败。[Go数据库错误处理](https://go.dev/doc/database/querying)

请求Context传到Store，下一阶段QueryContext可响应取消。服务器ReadHeaderTimeout限制读HTTP头，WriteTimeout限制响应连接，并不自动保证所有业务都被终止；数据库查询还应设置自己的context deadline。Ctrl+C调用Shutdown给在处理中的请求最多5秒完成；这与直接杀进程不同，但内存数据依然不会保存。

## 7. 环境配置与CORS：把第07阶段真正接过来

同源页面不需要CORS。要接前一阶段Vite前端，停止旧mock，在运行Go的终端设置：

```powershell
$env:ALLOWED_ORIGIN='http://127.0.0.1:5173'
go run .
```

在followup-07的.env写 `VITE_API_BASE=http://127.0.0.1:8768`，重启Vite。Network的请求URL必须现在指向8768，不是8777。跨源JSON POST会先发OPTIONS预检，Go允许明确来源、GET/POST/PATCH/DELETE和Content-Type；不匹配的预检403。

CORS只是浏览器是否允许另一个源的脚本读响应，它不能挡住curl或直接服务器请求，也不是身份验证。浏览器读取被阻止时请求可能已经到达后端，所以不能用CORS保护写入。下一阶段认证采用同源Cookie架构，不把这个无身份教学CORS配置直接用于安全会话。[MDN CORS](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CORS)

APP_ADDR默认127.0.0.1:8768。macOS/Linux用 `export ALLOWED_ORIGIN='...'`。Go不会自动加载.env；示例文件用于说明，终端环境或明确的配置加载器才生效。密码等不进前端、README或Git。

## 8. 浏览器联调与断点排错

同源网页输入标题后保存：Network应POST201再GET200。编辑只地点再保存：PATCH200；删除确认后204；取消确认没有DELETE。title内容用textContent显示，带`<script>`只是文字，不执行。关闭Go终端后点重新获取，显示获取失败；不能仍宣称已更新。

网页不见数据先分层检查：Network没请求→页面事件/Console；connection refused→服务/端口；收到HTML→URL打到静态路径；400→Body/规则；500→后端存储日志。F12 Sources给web/app.js的request函数断点查看path/options，终端打印方法/路径时不要打印整个Body。要在Go断点调试可安装官方Go扩展，Run and Debug选择Go Launch Package，在api.save的NormalizeInput行断点；观察in.Title，继续后检查响应。断点暂停导致超时，正式测超时前移除断点。

## 9. 原Node/Express与FastAPI分支的真实入口

三者的HTTP思路相同：Go标准库明确处理error与接口；Express中间件轻量、需要自己补验证；FastAPI以类型和Pydantic自动验证并生成文档。你选熟悉的语言完成同一个合同，而不是把框架名字当成已经学会服务器。

源码中的alternatives/express含package.json、server.mjs，先停止Go8768，再打开该目录，`npm ci`（从零抄文件首次npm install），`npm start`，同样用curl完成GET/POST/PATCH/DELETE。Express5需Node18+，主分支前端Node要求更高，以较高要求为准。它是不带认证、CORS、数据库的替代内存例子，不能当安全阶段的替代实现。[Express安装](https://expressjs.com/en/starter/installing/)

alternatives/fastapi含main.py、requirements.txt。Windows在此目录执行 `py -m venv .venv`，然后 `.venv/Scripts/python.exe -m pip install -r requirements.txt`，`.venv/Scripts/fastapi.exe dev main.py --host 127.0.0.1 --port 8768`；macOS/Linux改用python3和.venv/bin/fastapi。浏览器访问 `/docs` 看自动API文档。Pydantic形状错误默认422与本主例400不同，错误body是detail；这个分支PATCH使用完整输入，不可当作Go部分PATCH合同；选此分支需更新客户端/测试预期，不能只换端口以为合同完全一样。[FastAPI第一步](https://fastapi.tiangolo.com/tutorial/first-steps/)

## 完整主例：逐个文件保存

下面每个标题都是相对练习目录的真实文件名。在 VS Code 左侧新建对应文件夹和文件，粘贴整段代码，按 Ctrl+S（macOS 为 Cmd+S）保存；不要把不同文件的代码拼进同一文件。完整下载目录已经包含这些文件，直接打开时无需重复抄写。`package-lock.json` 和 `go.sum` 随源码下载，手工重建时分别由 npm install 和 go mod tidy 生成。

### 完整文件：go.mod

```text
module example.com/learn/followup-08

go 1.26.9
```

### 完整文件：main.go

```go
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"
)

func main() {
	addr := os.Getenv("APP_ADDR")
	if addr == "" {
		addr = "127.0.0.1:8768"
	}
	api := NewAPI(NewMemoryStore(), os.Getenv("ALLOWED_ORIGIN"))
	srv := &http.Server{Addr: addr, Handler: api.Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	go func() {
		<-ctx.Done()
		timeout, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(timeout)
	}()
	log.Printf("社团 API: http://%s（内存教学版，重启会恢复种子数据）", addr)
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

### 完整文件：web/index.html

```html
<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>社团活动 API 对接</title><link rel="stylesheet" href="/style.css"><main><h1>自己的活动 API</h1><p>本课数据存于服务器内存，重启会重置。使用同源 /api/events。</p><form id="editor"><input id="id" type="hidden"><label for="title">活动标题</label><input id="title" required maxlength="100"><label for="location">地点</label><input id="location" maxlength="100"><button>保存到服务器</button><button type="button" id="cancel-edit">取消编辑</button></form><p id="status" role="status"></p><button id="refresh">重新获取</button><ul id="list"></ul></main><script src="/app.js" defer></script></html>
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

### 完整文件：alternatives/express/package.json

```json
{"name":"club-express-practice","private":true,"type":"module","scripts":{"start":"node server.mjs"},"dependencies":{"express":"5.3.0"}}
```

### 完整文件：alternatives/express/server.mjs

```javascript
import express from 'express';
const app=express();app.use(express.json({limit:'8kb'}));
let next=2;const events=new Map([[1,{id:1,title:'图论训练',location:'教室 A'}]]);
const fail=(res,status,code,message)=>res.status(status).json({error:{code,message}});
const valid=body=>body&&typeof body.title==='string'&&body.title.trim().length>0&&body.title.trim().length<=100&&(body.location===undefined||typeof body.location==='string'&&body.location.length<=100)&&Object.keys(body).every(k=>['title','location'].includes(k));
app.get('/api/events',(req,res)=>res.json([...events.values()]));
app.get('/api/events/:id',(req,res)=>{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return fail(res,400,'invalid_id','id须为正整数');const e=events.get(id);if(!e)return fail(res,404,'not_found','活动不存在');res.json(e);});
app.post('/api/events',(req,res)=>{if(!valid(req.body))return fail(res,400,'validation','标题/地点/字段无效');const e={id:next++,title:req.body.title.trim(),location:(req.body.location??'').trim()};events.set(e.id,e);res.location(`/api/events/${e.id}`).status(201).json(e);});
app.patch('/api/events/:id',(req,res)=>{const id=Number(req.params.id),old=events.get(id);if(!Number.isSafeInteger(id)||id<1)return fail(res,400,'invalid_id','id须为正整数');if(!old)return fail(res,404,'not_found','活动不存在');const merged={title:old.title,location:old.location,...req.body};if(!valid(merged))return fail(res,400,'validation','标题/地点/字段无效');const e={id,title:merged.title.trim(),location:merged.location.trim()};events.set(id,e);res.json(e);});
app.delete('/api/events/:id',(req,res)=>{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return fail(res,400,'invalid_id','id须为正整数');if(!events.delete(id))return fail(res,404,'not_found','活动不存在');res.status(204).end();});
app.use((err,req,res,next)=>{if(err.type==='entity.too.large')return fail(res,413,'body_too_large','请求体过大');if(err instanceof SyntaxError)return fail(res,400,'invalid_json','JSON语法错误');fail(res,500,'internal','服务暂不可用');});
app.listen(8768,'127.0.0.1',()=>console.log('Express内存版: http://127.0.0.1:8768；请先停止Go同端口服务'));
```

### 完整文件：alternatives/fastapi/requirements.txt

```text
fastapi[standard]==0.143.0
```

### 完整文件：alternatives/fastapi/main.py

```text
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI()
events = {1: {"id": 1, "title": "图论训练", "location": "教室 A"}}
next_id = 2

class EventInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=100)
    location: str = Field(default="", max_length=100)

@app.get("/api/events")
def list_events():
    return list(events.values())

@app.get("/api/events/{event_id}")
def get_event(event_id: int):
    if event_id < 1:
        raise HTTPException(400, "id须为正整数")
    if event_id not in events:
        raise HTTPException(404, "活动不存在")
    return events[event_id]

@app.post("/api/events", status_code=201)
def create_event(value: EventInput):
    global next_id
    if not value.title.strip():
        raise HTTPException(400, "标题不能只有空白")
    item = {"id": next_id, "title": value.title.strip(), "location": value.location.strip()}
    events[next_id] = item
    next_id += 1
    return item

@app.patch("/api/events/{event_id}")
def update_event(event_id: int, value: EventInput):
    get_event(event_id)
    if not value.title.strip():
        raise HTTPException(400, "标题不能只有空白")
    events[event_id] = {"id": event_id, "title": value.title.strip(), "location": value.location.strip()}
    return events[event_id]

@app.delete("/api/events/{event_id}", status_code=204)
def delete_event(event_id: int):
    get_event(event_id)
    del events[event_id]
```

## 独立变式与验收

1. 不看参考，为NormalizeInput写三个单元用例：中文、只有空格、101字符。HTTP测试必须再测数组title和未知字段。
2. 删除id2后再创建，证明新id不重复；列表limit=1/offset=1返回最多一条，非法limit=0返回400。
3. 把Go终端Ctrl+C关闭，重启再GET，说明内存恢复种子与持久化有什么差别。第09阶段会改变这个结果。

### 参考答案

Unicode长度按utf8.RuneCountInString，不把中文三个UTF-8字节误当三个字；101个字符应失败。MemoryStore.next递增，因此删除2后新id3，不能用len(items)+1。分页是获取数据的上限，空页仍200+[]。现有api_test.go直接调用Handler，不占固定端口，包含CRUD、400/404/413、CORS与内部失败；执行go test看到PASS才是实测。

| 原知识点 | 详细章节 | 代码与可观察结果 |
| --- | --- | --- |
| 请求/响应模型 | 2 五步链路 | HTTP200/201与浏览器Network |
| 路由与方法 | 2、3 CRUD合同 | Handler模式、PATCH地点保持标题 |
| 状态码 | 4 状态表 | 成功/输入/不存在/内部错误真实测试 |
| JSON请求体 | 3 8KiB与严格Decoder | decodeJSON，400/413/415 |
| 输入校验 | 3、5 Unicode/trim | NormalizeInput，绕过页面也拒绝 |
| 后端分层 | 5 interface职责 | main/api/store，可换SQL |
| 异步I/O | 6 goroutine/context/error | 失败不是空列表，Shutdown |
| 环境变量 | 7 真正设置终端变量 | APP_ADDR/ALLOWED_ORIGIN |
| CORS | 7 预检与curl差异 | 明确来源，不是权限控制 |
| 错误处理 | 4、8 内外错误边界 | failingStore500不泄漏DSN |
| 接口测试 | 3、4、独立变式 | 五条curl与真实go test |
| API契约 | 2、4、9 | 字段/路径/状态/错误与替代分支差别 |
