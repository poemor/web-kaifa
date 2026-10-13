# 事务与回滚

先在SQL里看到“全部成功或全部撤销”，再把同样的边界写进Go函数。

## 为什么两次写入不能各自算成功

假设一次操作要新增两条记录：第一条已保存、第二条却因空标题失败，数据库里就留下半份结果。事务把有关联的操作放进同一个边界，直到全部成功才提交。

**事务的关键是一起提交或一起撤销，不能留下这次操作的部分写入。** BEGIN开始，COMMIT提交，ROLLBACK回滚。约束和事务不同：约束检查每行是否合法，事务决定这一组修改是否整体生效。

## 先用上一节的专用练习表观察

在psql确认当前库为自己的练习库，继续使用practice_problems。先查询此次标记，避免与旧实验混淆；如已有同标题，请改一个新的标记。

```sql
-- 失败实验：两条写入放在同一事务内。
BEGIN;
INSERT INTO practice_problems(title) VALUES ('tx-failure-demo');
INSERT INTO practice_problems(title) VALUES ('   '); -- CHECK拒绝。
ROLLBACK; -- 发生错误后，明确撤销这次事务。
SELECT count(*) FROM practice_problems WHERE title = 'tx-failure-demo';
```

第二次INSERT应报CHECK错误，ROLLBACK后count为0。第一条虽然曾在事务中写入，最终没有提交。

再预测成功场景：

```sql
BEGIN;
INSERT INTO practice_problems(title) VALUES ('tx-success-a');
INSERT INTO practice_problems(title) VALUES ('tx-success-b');
COMMIT;
SELECT title FROM practice_problems
WHERE title IN ('tx-success-a', 'tx-success-b') ORDER BY title;
```

应看到两行。`IN(...)`表示属于候选值集合。重复成功实验会再插入两行，不要用“总行数永远2”验证重跑。

## 对照 Go：所有语句必须走 tx

下面是完整函数，放进自己已有数据库程序的包中；它不含main。需要导入context和database/sql，db来自上一节sql.Open并已连接，ctx是该操作的上下文。调用 `insertPair(ctx, db, "Go", "Web")` 执行合法场景，第二项传空白执行失败场景。

```go
func insertPair(ctx context.Context, db *sql.DB, first, second string) error {
	tx, err := db.BeginTx(ctx, nil) // 新事务，nil使用默认事务选项。
	if err != nil {
		return err
	}
	// 任意提前return都回滚；成功Commit后这个Rollback不会撤销已提交事务。
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx,
		"INSERT INTO practice_problems(title) VALUES ($1)", first); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx,
		"INSERT INTO practice_problems(title) VALUES ($1)", second); err != nil {
		return err
	}
	return tx.Commit() // 提交本身也可能失败，必须把错误返回调用者。
}
```

`ExecContext`执行不需要返回行的写操作，结果可报告受影响行；这里只用error。tx是 `*sql.Tx`，代表同一事务。**BeginTx后仍用db执行SQL，会让那些语句脱离当前事务。** 事务处理中不能混用两个入口。

defer确保提前返回也能尝试Rollback。示例把提交错误交给调用者；网络断开等情况下提交结果可能需要业务核对，不能遇错就无条件重试重复写入。

## 运行已有完整的失败测试

在 [数据库API工程](assets/downloads/web-followup-09.zip) followup-09目录，按README创建名称以 `_test`结尾的独立测试库，设置TEST_DATABASE_URL，运行：

```sh
go test -v -run TestRealDatabase ./...
```

db_test.go中创建独立schema、执行迁移，用事务插两次相同username让UNIQUE拒绝，然后Rollback并查询count为0。它使用真实PostgreSQL，不是内存替代；看到SKIP表示未执行。不要删除测试库来制造失败。

## 预测再检查

在自己的演示函数中让second为纯空白，预期error且first不留下；再两项合法，预期两行均保存。记录实际SQL查询。自动生成id可能有空洞，因为序列分配不要求随事务回滚；**验证业务行，不用“id连续”证明事务正确。**

### 参考答案

回滚不等于删除之前已提交的其他记录；它撤销当前未提交事务的修改。只看到第二项报错，未查询第一项是否保留，还没有验收到原子性。

## 独立变式

用两个已有临时记录的id，将solved同时改true；让其中一个违反自己定义的约束，证明另一项也未改变。先写操作前后的查询结果，再考虑实现。

参考：[Go执行事务](https://go.dev/doc/database/execute-transactions)、[PostgreSQL事务](https://www.postgresql.org/docs/current/tutorial-transactions.html)。
