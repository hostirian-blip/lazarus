#!/usr/bin/env bash
# Nightly Lazarus backup. Run as root (needs Docker). Dumps the lazarus-postgres
# database + copies the secrets required to restore (encryption/session/cron keys),
# keeping the newest 14 of each. NOTE: copy these off-box for real disaster recovery.
set -euo pipefail
DIR=/home/deploy/backups
mkdir -p "$DIR"
TS=$(date -u +%Y%m%d-%H%M%S)

# Database dump — credentials read from the container's own env.
docker exec lazarus-postgres sh -lc 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -h 127.0.0.1 "$POSTGRES_DB"' \
  | gzip > "$DIR/lazarus-db-$TS.sql.gz"

# Secrets needed to decrypt settings + sign sessions (lose these and DB is useless).
grep -E '^(NEXTAUTH_SECRET|APP_ENCRYPTION_KEY|CRON_SECRET)=' /opt/vrroom/lazarus/.env > "$DIR/lazarus-secrets-$TS.env" 2>/dev/null || true
chmod 600 "$DIR"/lazarus-secrets-*.env 2>/dev/null || true

# Rotate: keep the newest 14 of each.
ls -1t "$DIR"/lazarus-db-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
ls -1t "$DIR"/lazarus-secrets-*.env 2>/dev/null | tail -n +15 | xargs -r rm -f

echo "backup complete: $TS ($(ls -1 "$DIR"/lazarus-db-*.sql.gz 2>/dev/null | wc -l) dumps retained)"
