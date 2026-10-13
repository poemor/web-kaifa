param([string]$OutputDirectory='backups')
$ErrorActionPreference='Stop'
# 不把数据库二进制流经过旧PowerShell的文本重定向。容器先写文件，再docker cp。
$backupRoot=[IO.Path]::GetFullPath((Join-Path $PWD $OutputDirectory))
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$container=docker compose ps -q db
if($LASTEXITCODE -ne 0 -or !$container){throw '练习数据库容器未启动'}
docker compose exec -T db pg_dump -U club_owner -d club_practice -Fc -f /tmp/club-practice.dump
if($LASTEXITCODE -ne 0){throw 'pg_dump失败，未生成可用备份'}
$target=Join-Path $backupRoot "club-practice-$stamp.dump"
docker cp "${container}:/tmp/club-practice.dump" $target
if($LASTEXITCODE -ne 0){throw '备份拷贝失败'}
docker compose exec -T db rm -f /tmp/club-practice.dump
Get-FileHash -Algorithm SHA256 -LiteralPath $target
Write-Host "备份已保存: $target；请继续恢复演练，生成文件本身不等于可恢复。"
