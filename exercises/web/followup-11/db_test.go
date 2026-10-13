package main

import (
	"context"
	"database/sql"
	_ "github.com/jackc/pgx/v5/stdlib"
	"os"
	"strings"
	"testing"
)

func TestRealDatabase(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("未设置独立 TEST_DATABASE_URL，未执行真实数据库测试")
	}
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	ctx := context.Background()
	var name string
	if err = db.QueryRowContext(ctx, "SELECT current_database()").Scan(&name); err != nil {
		t.Fatal("无法连接测试库")
	}
	if !strings.HasSuffix(name, "_test") {
		t.Fatal("测试库名必须以 _test 结尾；拒绝写入")
	}
	// 独立连接与临时 schema，实验后销毁此 schema，不影响 public 表。
	conn, err := db.Conn(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	_, err = conn.ExecContext(ctx, "CREATE SCHEMA followup09_isolated")
	if err != nil {
		t.Fatal(err)
	}
	defer conn.ExecContext(ctx, "DROP SCHEMA followup09_isolated CASCADE")
	_, err = conn.ExecContext(ctx, "SET search_path TO followup09_isolated")
	if err != nil {
		t.Fatal(err)
	}
	for _, p := range []string{"migrations/001_initial.sql", "migrations/002_location.sql"} {
		raw, err := os.ReadFile(p)
		if err != nil {
			t.Fatal(err)
		}
		if _, err = conn.ExecContext(ctx, string(raw)); err != nil {
			t.Fatal(err)
		}
	}
	var id int64
	if err = conn.QueryRowContext(ctx, `INSERT INTO events(title,location)VALUES($1,$2)RETURNING id`, "Alice's note", "A").Scan(&id); err != nil {
		t.Fatal(err)
	}
	var title string
	if err = conn.QueryRowContext(ctx, "SELECT title FROM events WHERE id=$1", id).Scan(&title); err != nil || title != "Alice's note" {
		t.Fatal(err, title)
	}
	tx, err := conn.BeginTx(ctx, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx, "INSERT INTO members(username)VALUES('duplicate')"); err != nil {
		t.Fatal(err)
	}
	if _, err = tx.ExecContext(ctx, "INSERT INTO members(username)VALUES('duplicate')"); err == nil {
		t.Fatal("重复值未被拒绝")
	}
	if err = tx.Rollback(); err != nil {
		t.Fatal(err)
	}
	var count int
	if err = conn.QueryRowContext(ctx, "SELECT count(*)FROM members WHERE username='duplicate'").Scan(&count); err != nil || count != 0 {
		t.Fatal(err, count)
	}
	if _, err = conn.ExecContext(ctx, `INSERT INTO registrations(event_id,member_id)VALUES(999999,999999)`); err == nil {
		t.Fatal("外键应拒绝不存在父行")
	}
	t.Log("真实 PostgreSQL：两次迁移、参数绑定、唯一约束回滚、外键检查通过")
}
