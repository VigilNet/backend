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
