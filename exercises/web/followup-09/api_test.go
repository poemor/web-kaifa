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
