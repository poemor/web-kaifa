#!/bin/sh
set -eu
# 只对本Compose练习库执行。已应用版本不再次执行；迁移文件不可事后改写。
for version in 1 2 3; do
  exists=$(psql -h db -U club_owner -d club_practice -Atc "SELECT to_regclass('public.schema_migrations') IS NOT NULL")
  applied=0
  if [ "$exists" = t ]; then
    applied=$(psql -h db -U club_owner -d club_practice -Atc "SELECT count(*) FROM schema_migrations WHERE version=$version")
  fi
  if [ "$applied" = 0 ]; then
    case "$version" in
      1) file=/migrations/001_initial.sql ;;
      2) file=/migrations/002_location.sql ;;
      3) file=/migrations/003_auth.sql ;;
    esac
    psql -h db -U club_owner -d club_practice -v ON_ERROR_STOP=1 -f "$file"
  fi
done
