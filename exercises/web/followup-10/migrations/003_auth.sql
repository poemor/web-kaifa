BEGIN;
ALTER TABLE members ADD COLUMN password_hash TEXT;
ALTER TABLE members ADD COLUMN role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin'));
-- 第09课旧成员没有密码，不能凭猜测为他们设置统一密码。
-- 教学服务只允许 password_hash 非空的新账户登录；旧记录留作 SQL 对照。
INSERT INTO schema_migrations(version) VALUES(3);
COMMIT;
