\set ON_ERROR_STOP on
SELECT current_database(),current_user;
-- 仅用于新建的空练习库，重复执行种子会新增活动，不是迁移。
INSERT INTO members(username) VALUES('member_a'),('member_b');
INSERT INTO events(title,location,starts_at) VALUES
 ('图论训练','教室 A',now()+interval '1 day'),
 ('网页练习','教室 B',now()+interval '2 days'),
 ('历史活动','教室 C',now()-interval '1 day');
INSERT INTO registrations(event_id,member_id)
 SELECT e.id,m.id FROM events e CROSS JOIN members m WHERE e.title='图论训练' AND m.username='member_a';
SELECT id,title,starts_at FROM events WHERE starts_at>now() ORDER BY starts_at,id LIMIT 10;
SELECT e.id,e.title,count(r.id) AS participants
 FROM events e LEFT JOIN registrations r ON r.event_id=e.id
 GROUP BY e.id,e.title ORDER BY e.id;
BEGIN;
UPDATE events SET title='临时标题' WHERE title='网页练习';
ROLLBACK;
SELECT title FROM events WHERE title='网页练习';
EXPLAIN (ANALYZE,BUFFERS) SELECT * FROM registrations WHERE event_id=(SELECT min(id) FROM events);
CREATE INDEX registrations_member_idx ON registrations(member_id);
-- UNIQUE(event_id,member_id) 已经生成以 event_id 开头的索引。
-- 本小表出现 Seq Scan 正常，不能据此宣称有或没有性能提升。
EXPLAIN (ANALYZE,BUFFERS) SELECT * FROM registrations WHERE member_id=(SELECT min(id) FROM members);
