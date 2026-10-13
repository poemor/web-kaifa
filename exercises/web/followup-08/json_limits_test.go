package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// 直接检查实际请求正文解析器：尾部空白也属于请求体大小。
func TestDecodeJSONBodyLimitAndTrailingValues(t *testing.T) {
	const valid = `{"title":"ok"}`
	cases := []struct {
		name, body string
		wantOK     bool
		wantStatus int
		wantCode   string
	}{
		{"small whitespace", valid + " \n\t", true, http.StatusOK, ""},
		{"exact byte limit", valid + strings.Repeat(" ", 8192-len(valid)), true, http.StatusOK, ""},
		{"large trailing whitespace", valid + strings.Repeat(" ", 9000), false, http.StatusRequestEntityTooLarge, "body_too_large"},
		{"second value", valid + ` {"title":"second"}`, false, http.StatusBadRequest, "invalid_json"},
		{"bad trailing bytes", valid + " !", false, http.StatusBadRequest, "invalid_json"},
		{"large first value", `{"title":"` + strings.Repeat("a", 9000) + `"}`, false, http.StatusRequestEntityTooLarge, "body_too_large"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodPost, "/api/events", strings.NewReader(c.body))
			r.Header.Set("Content-Type", "application/json")
			defer r.Body.Close()
			w := httptest.NewRecorder()
			var input struct {
				Title string `json:"title"`
			}
			ok := decodeJSON(w, r, &input)
			if ok != c.wantOK || w.Code != c.wantStatus {
				t.Fatalf("ok=%v status=%d body=%s; want ok=%v status=%d", ok, w.Code, w.Body, c.wantOK, c.wantStatus)
			}
			if ok {
				if input.Title != "ok" {
					t.Fatalf("decoded title=%q", input.Title)
				}
				return
			}
			var response struct {
				Error struct {
					Code string `json:"code"`
				} `json:"error"`
			}
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				t.Fatal(err)
			}
			if response.Error.Code != c.wantCode {
				t.Fatalf("error code=%q, want %q", response.Error.Code, c.wantCode)
			}
		})
	}
}
