param([Parameter(Mandatory)][string]$BackupFile,[string]$TargetDatabase='club_restore_test')
$ErrorActionPreference='Stop'
if($TargetDatabase -notmatch '^club_restore_[a-z0-9_]+$'){throw '只接受club_restore_前缀的新演练库；拒绝覆盖业务库'}
$source=[IO.Path]::GetFullPath($BackupFile)
if(!(Test-Path -LiteralPath $source -PathType Leaf)){throw '备份文件不存在'}
$container=docker compose ps -q db
if($LASTEXITCODE -ne 0 -or !$container){throw '练习数据库容器未启动'}
docker compose exec -T db createdb -U club_owner $TargetDatabase
if($LASTEXITCODE -ne 0){throw '创建演练库失败；如名字已存在，请选新的名字，不自动删除旧库'}
docker cp $source "${container}:/tmp/club-restore.dump"
if($LASTEXITCODE -ne 0){throw '拷贝失败'}
docker compose exec -T db pg_restore -U club_owner -d $TargetDatabase --no-owner --exit-on-error /tmp/club-restore.dump
if($LASTEXITCODE -ne 0){throw '恢复失败，请保留日志与演练库排查'}
docker compose exec -T db psql -U club_owner -d $TargetDatabase -v ON_ERROR_STOP=1 -c 'SELECT count(*) AS events FROM events; SELECT count(*) AS members FROM members; SELECT count(*) AS registrations FROM registrations; SELECT count(*) AS orphans FROM registrations r LEFT JOIN events e ON e.id=r.event_id LEFT JOIN members m ON m.id=r.member_id WHERE e.id IS NULL OR m.id IS NULL; SELECT max(version) AS schema_version FROM schema_migrations;'
if($LASTEXITCODE -ne 0){throw '恢复后的核对失败'}
docker compose exec -T db rm -f /tmp/club-restore.dump
Write-Host "已恢复到独立演练库 $TargetDatabase，请核对计数和关键记录，再决定清理。原库未被覆盖。"
