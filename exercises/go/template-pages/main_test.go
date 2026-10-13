package main

import (
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func TestPage(t *testing.T) {
	handler, err := newHandler()
	if err != nil {
		t.Fatal(err)
	}
	// QueryEscape 把空格和尖括号编码为合法查询参数，不能直接拼未编码用户文字。
	req := httptest.NewRequest("GET", "/?title="+url.QueryEscape("读书 <社>"), nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != 200 || rec.Result().Header.Get("Content-Type") != "text/html; charset=utf-8" {
		t.Fatalf("响应错误：%d %s", rec.Code, rec.Header().Get("Content-Type"))
	}
	// 检查发出的 HTML 源码，输入的尖括号必须转为实体，不能变成标签。
	if !strings.Contains(rec.Body.String(), "<h1>读书 &lt;社&gt;</h1>") {
		t.Fatalf("模板没有按预期填值并转义：%s", rec.Body.String())
	}
	missing := httptest.NewRecorder()
	handler.ServeHTTP(missing, httptest.NewRequest("GET", "/missing", nil))
	if missing.Code != 404 {
		t.Fatalf("未知路径应返回404，实际%d", missing.Code)
	}
}
