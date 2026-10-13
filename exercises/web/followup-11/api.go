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
		// 第二次读取也可能触发正文上限，不能把超限误报成普通 JSON 错误。
		var large *http.MaxBytesError
		if errors.As(err, &large) {
			fail(w, 413, "body_too_large", "请求体不能超过 8192 字节")
		} else {
			fail(w, 400, "invalid_json", "只接受一个 JSON 对象")
		}
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
