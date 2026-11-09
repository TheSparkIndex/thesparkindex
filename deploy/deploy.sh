#!/usr/bin/env bash
# Despliega (o actualiza) el sitio. Ejecutar desde el servidor:
#   cd ~/thesparkindex && git pull && ./deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Falta deploy/.env — copia deploy/env.example y llena los valores." >&2
  exit 1
fi

echo "→ Base de datos"
docker compose up -d --wait db

echo "→ Migraciones"
docker compose build migrate
docker compose run --rm migrate

echo "→ Build de la app (usa la base para prerenderizar)"
docker compose build app

echo "→ Arrancando app y Caddy"
docker compose up -d app caddy

docker image prune -f >/dev/null
docker compose ps
echo "Listo."
