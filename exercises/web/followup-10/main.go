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
	"syscall"
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
	log.Printf("社团安全教学服务: %s", origin)
	if err = srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
	// Shutdown开始时ListenAndServe就会返回；必须等在途请求处理完才退出main。
	// 数据库等defer资源清理也因此在等待结束之后执行。
	<-shutdownDone
}
