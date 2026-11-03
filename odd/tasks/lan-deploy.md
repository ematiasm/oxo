# LAN deploy

Deploy self-hosted de oxo para una sola máquina, alcanzable desde la LAN y desde Tailscale, levantando solo Postgres y el contenedor backend (que sirve el frontend ya compilado).

## Specs

- **S1** — El compose de deploy queda en `compose.deploy.yml` (el que traía el template), reescrito. `compose.prod.yml` se elimina después de reescribirlo.
- **S2** — Deploy "solo en local por LAN y tailscale": http://192.168.0.101:8000 (LAN) y http://100.127.160.19:8000 (tailnet).
- **S3** — Levantar "solo lo necesario, el docker de postgres y el de backend y frontend (estos se levantan en una sola imagen)". Dos servicios: `db` y `backend`.
- **S4** — "dejando traefik y adminer que no son necesario para un solo sevicio": sin Traefik, sin Adminer, sin Mailpit, sin Playwright, sin HTTPS/Let's Encrypt.
- **S5** — La configuración del deploy vive en `.env.prod` (no `.env`, no `.env.deploy`), cargado con `--env-file`.
- **S6** — Puerto publicado `8000:8000`; `FRONTEND_HOST` incluye `:8000`.
- **S7** — Proyecto Compose del deploy aislado con `name: oxo`.
- **S8** — El proyecto Compose de desarrollo se renombra a `oxo-dev`.
- **S9** — Volúmenes con nombre explícito: deploy `oxo-db-data`, desarrollo `oxo-dev-app-db-data`. Ya no se comparte volumen entre dev y deploy.
- **S10** — `FRONTEND_HOST=http://192.168.0.101` como valor de ejemplo para los links de reseteo de contraseña.
- **S11** — Se borra `.github/workflows/deploy-docker-compose.yml` (usaba `DOMAIN` y Traefik).
- **S12** — Los datos de desarrollo actuales se descartan: "empeza de cero".
- **S13** — Un solo comando de documentación: `docker compose -f compose.deploy.yml --env-file .env.prod ...`; listar explícitamente un solo `-f` evita que Compose cargue `compose.override.yml`.

## Tasks

| ID | Specs | Route | Commit |
| --- | --- | --- | --- |
| T1 | S1-S13 | inline | crea branch `chore/lan-deploy` |
| T2 | S2,S3,S4,S6,S7,S9,S13 | inline | reescribe `compose.deploy.yml` como stack autónomo |
| T3 | S8,S9,S12 | inline | renombra el proyecto de desarrollo a `oxo-dev` |
| T4 | S1,S11 | inline | borra `compose.prod.yml` y el workflow de deploy |
| T5 | S2,S3,S4,S5,S6,S10,S13 | inline | reescribe `deployment-docker-compose.md` como guía LAN + Tailscale |
| T6 | S5,S8,S13 | inline | actualiza `development.md` y `env.prod.example` |
| T7 | S2-S13 | inline | verifica con `docker compose config` y levanta el stack real |

## Evidence

- Commit `253261b` — T1-T7: `compose.deploy.yml` reescrito, dev renombrado a `oxo-dev`, `compose.prod.yml` y el workflow de deploy eliminados, documentación y `env.prod.example` actualizados, 405 líneas cambiadas (145+/260-).
- Verificación real: `build` OK; `prestart.sh` aplicó las 7 migraciones y creó el superusuario; `up -d` dejó `oxo-db-1` y `oxo-backend-1` en `healthy`; health-check, raíz, `/docs`, el bundle JS (329 357 bytes) y el login devolvieron 200 por `192.168.0.101:8000`, `100.127.160.19:8000` y `localhost:8000`; el bundle no lleva `baseURL` absoluto; el contenedor no recibió `SMTP_HOST=mailpit`, `POSTGRES_PASSWORD=changethis` ni `FASTAPI_ENV` del `.env` de desarrollo. Stack bajado y volumen de prueba eliminado.
- Hallazgo durante la verificación: `FIRST_SUPERUSER=admin@oxo.local` no valida (sufijo reservado). El ejemplo del template tenía el mismo defecto; `env.prod.example` ahora usa `admin@example.com`.

## Log

- **L1** (pedido original, verbatim):
  > trabajemos en el deploy. Ya existe el compose.deploy.md y el compose.prod.yml. Este ultimo lo cree yo pero me habia oplvidado que ya existia el compose.deploy.md. Asi que lo que vamos a hacer es eliminar el ultimo, pero antes cambiar el que traia el template (compose.deploy.md). Vamos a cambiarlo para hacer un deploy solo en local por LAN y tailscale, levantando solo lo necesario, el docker de postgres y el de backend y frontend (estos se levantan en una sola imagen?). y dejando traefik y adminer que no son necesario para un solo sevicio. Antes de implementar algo explicame como configuro? Uso el .env o hay un .env.deploy?
- **L2** (decisiones): puerto `8000:8000`; proyecto de deploy aislado pero con `name: oxo`, y el de desarrollo pasa a `oxo-dev`; `FRONTEND_HOST=http://192.168.0.101`; borrar el workflow `deploy-docker-compose.yml`; datos de dev "empeza de cero, pero la base de deploy qye sea oxo-db-data, y la de dev que sea oxo-dev-app-db-data".
- **L3** (hallazgo): `--env-file .env.prod` reemplaza al `.env` para interpolación, verificado con `docker compose -f compose.prod.yml --env-file /dev/null config -q` → falla por variables requeridas ausentes. El backend lee `.env` desde `../.env` (pydantic-settings), pero un `env_file` con `required: false` en el servicio mantiene el mismo comportamiento actual y evita que el contenedor rompa si el archivo no existe.
