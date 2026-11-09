# Despliegue — KEY The Spark Index

Producción en un VPS (Oracle Cloud Always Free, Ubuntu 24.04 ARM) con Docker Compose:

```
Internet ──► Caddy :80/:443 (HTTPS automático) ──► app (Next.js :3000) ──► db (PostgreSQL 18)
                                                        └─► volumen uploads (imágenes)
```

- `db` solo escucha en `127.0.0.1` del servidor; no es accesible desde internet.
- `migrate` aplica las migraciones de Prisma en cada despliegue y termina.
- El build de Next.js se conecta a la base (por `127.0.0.1`) porque prerenderiza páginas con datos.

## Archivos

| Archivo | Para qué |
|---|---|
| `Dockerfile` (raíz) | Imagen `tools` (Prisma CLI) y `runner` (Next.js standalone) |
| `deploy/docker-compose.yml` | Servicios `db`, `migrate`, `app`, `caddy` |
| `deploy/Caddyfile` | Proxy inverso y HTTPS |
| `deploy/env.example` | Plantilla de `deploy/.env` (el real nunca se sube a git) |
| `deploy/deploy.sh` | Despliega o actualiza |
| `deploy/backup.sh` | Respaldo de la base y de las imágenes |

## Requisitos del servidor (una sola vez)

```bash
sudo apt-get install -y docker.io docker-compose-v2 docker-buildx git
sudo usermod -aG docker ubuntu   # luego salir y volver a entrar
```

Puertos 80 y 443 abiertos en la Security List de Oracle **y** en iptables:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## Primer despliegue

```bash
git clone https://github.com/TheSparkIndex/thesparkindex.git ~/thesparkindex
cd ~/thesparkindex
git checkout deploy-oracle        # rama con los archivos de despliegue
cp deploy/env.example deploy/.env
nano deploy/.env                  # llenar secretos (ver abajo)
./deploy/deploy.sh
```

Generar secretos en el servidor:

```bash
openssl rand -hex 24      # POSTGRES_PASSWORD y ADMIN_PASSWORD
openssl rand -base64 32   # AUTH_SECRET
```

Crear secciones, usuario admin y configuración (una sola vez):

```bash
cd ~/thesparkindex/deploy
docker compose run --rm migrate npx prisma db seed
```

Con `SEED_DEMO="false"` no crea autores ni artículos de demostración. Después del seed,
reconstruir para que las páginas prerenderizadas incluyan las secciones:

```bash
./deploy.sh
```

El sitio queda en `http://IP_DEL_SERVIDOR`. Admin en `/admin/login` con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Activar el dominio (HTTPS)

1. En Cloudflare: registro **A** del dominio → IP del servidor, en modo **DNS only** (nube gris).
2. En `deploy/.env`:
   ```
   SITE_ADDRESS="revista.ejemplo.com"
   SITE_URL="https://revista.ejemplo.com"
   ```
3. `./deploy/deploy.sh` — Caddy obtiene el certificado de Let's Encrypt solo.
4. Cuando cargue con HTTPS, en Cloudflare cambiar a **Proxied** (nube naranja) y en
   *SSL/TLS* elegir **Full (strict)**.

## Actualizar el sitio

```bash
cd ~/thesparkindex && git pull && ./deploy/deploy.sh
```

## Respaldos

```bash
chmod +x ~/thesparkindex/deploy/*.sh
mkdir -p ~/backups
crontab -e
# agregar:
0 3 * * * /home/ubuntu/thesparkindex/deploy/backup.sh >> /home/ubuntu/backups/backup.log 2>&1
```

Guarda 14 días en `~/backups`. **Eso sigue estando en el mismo servidor**: para un respaldo
real, copia esa carpeta fuera (por ejemplo con `rclone` a Cloudflare R2 o Google Drive).

Restaurar:

```bash
cd ~/thesparkindex/deploy
docker compose exec -T db pg_restore -U spark -d thesparkindex --clean --if-exists < ~/backups/db_FECHA.dump
docker run --rm -v thesparkindex_uploads:/data -v ~/backups:/backup postgres:18 \
  tar xzf /backup/uploads_FECHA.tar.gz -C /data
```

## Comandos útiles

```bash
cd ~/thesparkindex/deploy
docker compose ps                 # estado
docker compose logs -f app        # logs de la app
docker compose logs -f caddy      # logs de HTTPS / proxy
docker compose restart app
```
