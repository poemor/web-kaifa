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
	// 先限制编码文本，避免 Split 和 Base64 解码为任意长存储值分配空间。
	if len(encoded) > 128 {
		return false
	}
	p := strings.Split(encoded, "$")
	if len(p) != 6 || p[1] != "argon2id" || p[2] != "v=19" || p[3] != "m=65536,t=3,p=4" {
		return false
	}
	// 固定16字节盐、32字节结果；解码前就核对对应编码长度。
	if len(p[4]) != base64.RawStdEncoding.EncodedLen(16) || len(p[5]) != base64.RawStdEncoding.EncodedLen(32) {
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
