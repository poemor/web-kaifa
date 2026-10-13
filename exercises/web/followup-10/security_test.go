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

func TestVerifyPasswordRejectsMalformedStorage(t *testing.T) {
	prefix := "$argon2id$v=19$m=65536,t=3,p=4$"
	tooLong := prefix + strings.Repeat("A", 10000) + "$" + strings.Repeat("A", 43)
	for _, encoded := range []string{"", "not-a-hash", prefix + "!$!", prefix + strings.Repeat("!", 22) + "$" + strings.Repeat("A", 43), prefix + strings.Repeat("A", 22) + "$" + strings.Repeat("!", 43), tooLong} {
		if verifyPassword(encoded, "Test-only-password-123") {
			t.Fatal("非法存储格式不应通过")
		}
	}
	// 超长输入在 Split/解码前拒绝，不为输入大小再分配一份解析空间。
	if allocations := testing.AllocsPerRun(1, func() { verifyPassword(tooLong, "unused") }); allocations != 0 {
		t.Fatalf("超长格式应提前拒绝，实际分配 %v 次", allocations)
	}
}
