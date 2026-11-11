# MCP de KEY — The Spark Index

Hay dos formas de conectar Claude a la revista:

| | **Remoto** (recomendado para el equipo) | **Local** (esta carpeta) |
|---|---|---|
| Dónde corre | En el servidor: `https://<dominio>/api/mcp/<secreto>` | En tu computadora (`node server.mjs`) |
| Desde dónde se usa | claude.ai web, escritorio y móvil, cualquier cuenta | Claude Code / Claude Desktop en esa computadora |
| Imágenes | Por URL pública (se descargan al sitio) | Archivos locales |
| Publicar carpetas `.md` | No | Sí (`spark_publish_file`) |

## MCP remoto (conector de claude.ai)

1. En el servidor, define `MCP_URL_SECRET` en `deploy/.env` (`openssl rand -hex 24`) y ejecuta `./deploy/deploy.sh`.
2. En claude.ai: **Configuración → Conectores → Agregar conector personalizado**.
   - Nombre: `The Spark Index`
   - URL: `https://thesparkindex.canariostudios.com/api/mcp/<MCP_URL_SECRET>`
   - Deja vacíos los campos de OAuth.
3. En un chat, activa el conector (botón de herramientas) y pide, por ejemplo:
   *"Publica este artículo en Noticias, autora Fabiola Guardado, portada: https://…/foto.jpg"*.

Herramientas: `spark_list_sections`, `spark_list_authors`, `spark_list_articles`, `spark_get_article`
(devuelve el cuerpo en Markdown para editarlo), `spark_save_article`, `spark_save_author`,
`spark_upload_image` (desde URL).

**La URL completa es la contraseña**: quien la tenga puede publicar. Compártela solo con el equipo
editorial. Si se filtra, cambia `MCP_URL_SECRET`, vuelve a desplegar y actualiza el conector.
En planes Team/Enterprise de Claude, un administrador debe agregar el conector para la organización.

Las imágenes deben ser enlaces **directos** y públicos (que abran solo la imagen). Los enlaces de
"compartir" de Google Drive o WhatsApp no sirven; en ese caso sube la foto desde el panel
(`/admin/media`) y pásale a Claude la URL que aparece ahí.

## MCP local

Servidor MCP local para publicar artículos en la revista desde Claude (Claude Code, Claude Desktop
o cualquier cliente MCP). Usa la API de contenido del sitio (`/api/v1`), protegida con un token.

```
Claude ──(MCP, stdio)──► mcp/server.mjs ──(HTTPS + token)──► sitio /api/v1 ──► base de datos
```

## Herramientas

| Herramienta | Qué hace |
|---|---|
| `spark_publish_file` | Crea o actualiza un artículo desde un `.md` con encabezado YAML (sube fotos y crea autores) |
| `spark_save_article` | Igual, pero recibiendo los campos y el Markdown directamente |
| `spark_upload_image` | Sube una imagen local a la biblioteca de medios |
| `spark_save_author` | Crea o actualiza un autor |
| `spark_list_sections` / `spark_list_authors` / `spark_list_articles` | Consultas |

Los artículos se identifican por **slug** (derivado del título): volver a publicar el mismo archivo
**actualiza** el artículo en vez de duplicarlo. Si no se indica `status`, queda como **borrador**.

## 1. Activar la API en el servidor

```bash
openssl rand -hex 32          # copia el resultado
nano ~/thesparkindex/deploy/.env
#   CONTENT_API_TOKEN="<el token>"
cd ~/thesparkindex && ./deploy/deploy.sh
```

Sin `CONTENT_API_TOKEN` (o con menos de 32 caracteres) la API responde 404.

## 2. Instalar el MCP en tu computadora

```bash
cd mcp
npm install
```

## 3. Registrarlo en Claude Code

```bash
claude mcp add thesparkindex --scope user \
  -e SPARK_API_URL=https://thesparkindex.canariostudios.com \
  -e SPARK_API_TOKEN=<el token> \
  -- node "C:\ruta\al\proyecto\mcp\server.mjs"
```

Reinicia la sesión de Claude y las herramientas `spark_*` quedan disponibles.

En Claude Desktop, agrega lo mismo en `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "thesparkindex": {
      "command": "node",
      "args": ["C:\\ruta\\al\\proyecto\\mcp\\server.mjs"],
      "env": {
        "SPARK_API_URL": "https://thesparkindex.canariostudios.com",
        "SPARK_API_TOKEN": "<el token>"
      }
    }
  }
}
```

El token da permiso para escribir en la revista: no lo subas a git ni lo compartas. Si se filtra,
genera otro en el servidor y actualiza la configuración del MCP.

## Formato de un artículo

Una carpeta por artículo, con `index.md` y sus fotos:

```
mi-articulo/
├── index.md
└── fotos/
    ├── portada.jpg
    └── detalle.jpg
```

```markdown
---
title: "Key Institute avanza en la ICPC regional 2025"
subtitle: "Disciplina, estrategia y pasión por el código"   # opcional
excerpt: "Resumen corto para tarjetas y buscadores"         # opcional
section: noticias        # noticias | opinion | entrevistas | ciencia-ingenieria | valores-key
authors:
  - Luis Pocasangre
  - { name: Ana Pérez, role: photographer }   # author | collaborator | photographer | editor
hero: fotos/portada.jpg
heroAlt: "Equipo de Key en la UCA"
imageCaption: "Pie de la foto de portada"
imageCredit: "Crédito de las fotos"
tags: [ICPC, Programación]
status: published        # draft (por defecto) | published | scheduled | archived
featured: false          # destacar en el inicio
publishedAt: 2025-09-13  # opcional, para artículos con fecha pasada
---
Primer párrafo. Los párrafos se separan con una línea en blanco.

## Subtítulo de sección

Texto con **negrita**, *cursiva* y un [enlace](https://keyinstitute.edu.sv).

- Elemento de lista
- Otro elemento

>> Una cita destacada que se muestra en grande. — Nombre

![Descripción de la foto](fotos/detalle.jpg)

https://www.youtube.com/watch?v=XXXXXXXXXXX
```

No repitas el título, el subtítulo ni el autor en el cuerpo: el sitio ya los muestra.
Publicar exige sección, al menos un autor, contenido e imagen de portada.
