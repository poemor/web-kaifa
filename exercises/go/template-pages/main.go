package main

import (
	"bytes"
	"html/template"
	"log"
	"net/http"
)

// 字段大写导出，模板才能通过 .Title 和 .Minutes 读取它们。
type PageData struct {
	Title   string
	Minutes int
}

// 启动时解析模板；失败就返回 error，避免带着坏模板开始接请求。
func newHandler() (http.Handler, error) {
	page, err := template.ParseFiles("page.html")
	if err != nil {
		return nil, err
	}
	mux := http.NewServeMux()
	// {$} 限定路径必须在 / 结束，/missing 不会落入本处理器。
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		title := r.URL.Query().Get("title")
		if title == "" {
			title = "学习记录"
		}
		// 先生成到内存缓冲区，失败时还没向浏览器发送半截成功页面。
		var body bytes.Buffer
		if err := page.Execute(&body, PageData{Title: title, Minutes: 30}); err != nil {
			http.Error(w, "生成页面失败", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		// Bytes 返回 []byte 正文；写出后发生的网络错误只能记录，不能重写状态。
		if _, err := w.Write(body.Bytes()); err != nil {
			log.Println("写页面失败：", err)
		}
	})
	return mux, nil
}

func main() {
	handler, err := newHandler()
	if err != nil {
		log.Fatal(err)
	}
	log.Println("打开 http://127.0.0.1:8080/，按 Ctrl+C 停止")
	// 本机监听是真的服务；测试文件则直接调用 handler，不打开这个端口。
	log.Fatal(http.ListenAndServe("127.0.0.1:8080", handler))
}
