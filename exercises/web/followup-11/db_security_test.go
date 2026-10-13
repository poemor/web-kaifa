package main

import (
	"context"
	"database/sql"
	_ "github.com/jackc/pgx/v5/stdlib"
	"os"
	"strings"
	"testing"
)

func TestRealSQLIdentityOwnership(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("未设置独立测试库，未执行SQL权限实测")
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)
	ctx := context.Background()
	var name string
	if err = db.QueryRowContext(ctx, "SELECT current_database()").Scan(&name); err != nil {
		t.Fatal("无法连接测试库")
	}
	if !strings.HasSuffix(name, "_test") {
		t.Fatal("测试库名必须以_test结尾")
	}
	if _, err = db.ExecContext(ctx, "CREATE SCHEMA followup11_security_isolated"); err != nil {
		t.Fatal(err)
	}
	defer db.ExecContext(ctx, "DROP SCHEMA followup11_security_isolated CASCADE")
	if _, err = db.ExecContext(ctx, "SET search_path TO followup11_security_isolated"); err != nil {
		t.Fatal(err)
	}
	for _, p := range []string{"migrations/001_initial.sql", "migrations/002_location.sql", "migrations/003_auth.sql"} {
		raw, err := os.ReadFile(p)
		if err != nil {
			t.Fatal(err)
		}
		if _, err = db.ExecContext(ctx, string(raw)); err != nil {
			t.Fatal(err)
		}
	}
	store := &SQLSecureStore{SQLStore: &SQLStore{db: db}}
	hash, err := hashPassword("Test-only-password-123")
	if err != nil {
		t.Fatal(err)
	}
	a, err := store.CreateMember(ctx, "db_member_a", hash, "member")
	if err != nil {
		t.Fatal(err)
	}
	b, err := store.CreateMember(ctx, "db_member_b", hash, "member")
	if err != nil {
		t.Fatal(err)
	}
	event, err := store.Create(ctx, EventInput{Title: "持久报名", Location: "A"})
	if err != nil {
		t.Fatal(err)
	}
	reg, err := store.Register(ctx, a.ID, event.ID)
	if err != nil {
		t.Fatal(err)
	}
	if err = store.CancelRegistration(ctx, reg.ID, b.ID); err != ErrMissing {
		t.Fatal("B越权应拒绝", err)
	}
	if _, err = store.Register(ctx, a.ID, event.ID); err != ErrConflict {
		t.Fatal("重复报名应409", err)
	}
	if err = store.CancelRegistration(ctx, reg.ID, a.ID); err != nil {
		t.Fatal(err)
	}
	t.Log("真实SQL：专用schema内账户/活动/报名、A/B归属与UNIQUE通过")
}
