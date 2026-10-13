package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	addr := os.Getenv("APP_ADDR")
	if addr == "" {
		addr = "127.0.0.1:8768"
	}
	api := NewAPI(NewMemoryStore(), os.Getenv("ALLOWED_ORIGIN"))
	srv := &http.Server{Addr: addr, Handler: api.Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	shutdownDone := make(chan struct{})
	go func() {
		defer close(shutdownDone)
		<-ctx.Done()
		log.Print("Shutdown开始：停止监听，等待在途请求，最多5秒")
		timeout, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := srv.Shutdown(timeout); err != nil {
			log.Printf("等待在途请求退出失败，将关闭剩余连接: %v", err)
			if err := srv.Close(); err != nil {
				log.Printf("关闭剩余连接失败: %v", err)
			}
		}
		log.Print("Shutdown等待结束，准备释放资源")
	}()
	log.Printf("社团 API: http://%s（内存教学版，重启会恢复种子数据）", addr)
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
	// Shutdown开始时ListenAndServe就会返回；必须等在途请求处理完才退出main。
	// 数据库等defer资源清理也因此在等待结束之后执行。
	<-shutdownDone
}
