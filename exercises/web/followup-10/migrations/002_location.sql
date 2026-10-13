BEGIN;
-- 旧记录保留，并先得到可解释的默认地点。
ALTER TABLE events ADD COLUMN location TEXT NOT NULL DEFAULT '' CHECK(length(location)<=100);
INSERT INTO schema_migrations(version) VALUES(2);
COMMIT;
