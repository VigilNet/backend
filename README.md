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
