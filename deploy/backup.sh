#!/usr/bin/env bash
# Respaldo de la base de datos y de las imágenes subidas.
# Cron diario (3:00 am):  0 3 * * * /home/ubuntu/thesparkindex/deploy/backup.sh >> /home/ubuntu/backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")"
set -a; . ./.env; set +a

DEST="${BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%F_%H%M)"
PROJECT="$(docker compose config --format json | sed -n 's/^ *"name": *"\([^"]*\)".*/\1/p' | head -1)"
mkdir -p "$DEST"

# Base de datos (formato custom: se restaura con pg_restore)
docker compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$DEST/db_$STAMP.dump"

# Imágenes subidas (reusa la imagen de postgres, que ya trae tar)
docker run --rm --entrypoint tar \
  -v "${PROJECT}_uploads:/data:ro" -v "$DEST:/backup" \
  postgres:18 czf "/backup/uploads_$STAMP.tar.gz" -C /data .

# Borra respaldos viejos
find "$DEST" -maxdepth 1 -type f \( -name 'db_*.dump' -o -name 'uploads_*.tar.gz' \) -mtime +"$KEEP_DAYS" -delete

echo "$(date -Is) respaldo OK: db_$STAMP.dump uploads_$STAMP.tar.gz"
