# VigilNet Backend

Fastify backend for VigilNet dashboard and device alert ingestion.

## Development

```bash
npm install
npm run dev
```

Healthcheck:

```bash
curl http://localhost:3000/health
```

## Database

Set `DATABASE_URL` before creating a database client:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/vigilnet
```

Apply the initial schema manually:

```bash
psql "$DATABASE_URL" -f migrations/001_initial_schema.sql
```

Auth endpoints:

```bash
POST /auth/register
POST /auth/login
GET /auth/me
```

Config and device endpoints:

```bash
GET /config/thresholds/active
PUT /admin/config/thresholds
POST /devices/pair
GET /devices/me
```

Alert endpoints:

```bash
POST /alerts/ingest
GET /alerts
GET /alerts/:id
PATCH /alerts/:id/status
```

## Docker

Build the backend image:

```bash
docker build -t vigilnet-backend .
```

Run the backend container:

```bash
docker run --rm -p 3000:3000 \
  -e PORT=3000 \
  -e HOST=0.0.0.0 \
  -e DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/vigilnet \
  -e JWT_SECRET=change-me \
  vigilnet-backend
```
