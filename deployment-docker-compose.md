# Docker Compose Deployment on a Local Network

This guide deploys the application to a single machine that serves it over a local network (LAN) and over Tailscale. It is not an internet-facing deployment: there is no domain name, no HTTPS and no reverse proxy.

The deployment runs two containers:

- `db` — PostgreSQL, reachable only from the backend container.
- `backend` — FastAPI with the compiled frontend, serving the application and the API on port `8000`.

The backend image also builds the frontend (see `backend/Dockerfile`), so there is no separate frontend container. Traefik, Adminer, Mailpit and Playwright are not part of the deployment.

## Preparation

- Have the machine that will serve the application ready.
- Install [Docker](https://docs.docker.com/engine/install/) (Docker Engine, not Docker Desktop).
- Install and connect [Tailscale](https://tailscale.com/download) if the application must be reachable from the tailnet.
- Note the machine's addresses, for example `192.168.0.101` for the LAN and `100.127.160.19` for Tailscale. Both are used below.

## Configure the Application

Deployment settings live in `.env.prod`, a separate file from the development `.env`. Create it from the tracked example:

```bash
cp env.prod.example .env.prod
```

Then fill it in. Generate each secret with:

```bash
python -c 'import secrets; print(secrets.token_urlsafe(32))'
```

`PROJECT_NAME`, `FIRST_SUPERUSER`, `FIRST_SUPERUSER_PASSWORD`, `POSTGRES_PASSWORD` and `SECRET_KEY` are required. `FRONTEND_HOST` is the base URL users open the application with, including the port:

```bash
FRONTEND_HOST=http://192.168.0.101:8000
```

It is used to build the link in password recovery emails, so it must match the address users actually open. Emails themselves are optional: leaving `SMTP_HOST` and `EMAILS_FROM_EMAIL` empty disables password recovery by email.

`.env.prod` is ignored by Git and must never be committed. The backend refuses to start while `SECRET_KEY`, `POSTGRES_PASSWORD` or `FIRST_SUPERUSER_PASSWORD` are set to `changethis`.

## Deploy

Always pass both `-f compose.deploy.yml` and `--env-file .env.prod`. Listing a single `-f` file also stops Docker Compose from loading `compose.override.yml`, the local development settings:

```bash
docker compose -f compose.deploy.yml --env-file .env.prod build
docker compose -f compose.deploy.yml --env-file .env.prod run --rm backend bash scripts/prestart.sh
docker compose -f compose.deploy.yml --env-file .env.prod up -d
```

The second command applies the database migrations and creates the first superuser. Run it on the first deployment and after every change that adds migrations.

`--env-file` replaces `.env` for variable interpolation, so no development value leaks into the deployment. The backend container receives every setting it needs from `compose.deploy.yml` and does not read the development `.env`.

## URLs

Replace the addresses with the machine's own:

- Application (frontend and API) on the LAN: `http://192.168.0.101:8000`
- Application on the tailnet: `http://100.127.160.19:8000`
- Interactive API docs: `http://192.168.0.101:8000/docs`

The compiled frontend calls the API on the same origin it was loaded from, so one image serves both addresses and no rebuild is needed to reach the application by a different address.

## Data, Projects and Volumes

`compose.deploy.yml` declares `name: oxo`, and its database volume is named `oxo-db-data`. The development stack declared in `compose.yml` uses the project name `oxo-dev` and the volume `oxo-dev-app-db-data`. The two stacks never share a database, and both can run at the same time.

To discard the deployment data and start over, stop the stack and remove only its volume:

```bash
docker compose -f compose.deploy.yml --env-file .env.prod down
docker volume rm oxo-db-data
```

## Reachability

Publishing a port with Docker bypasses `ufw` rules: Docker writes its own NAT and forwarding rules, so a published port is reachable from the network even when `ufw` has no rule for it. This applies to `8000` from the LAN.

Tailscale does not expose the port to the local network; the application is reachable from the tailnet at the Tailscale address of the machine.

To bind the published port to specific addresses instead of every interface, replace the port mapping in `compose.deploy.yml`:

```yaml
ports:
  - "192.168.0.101:8000:8000"
  - "100.127.160.19:8000:8000"
```

## Stopping and Restarting

```bash
docker compose -f compose.deploy.yml --env-file .env.prod down
```

Both services use `restart: unless-stopped`, so they come back after a reboot unless they were stopped explicitly.
