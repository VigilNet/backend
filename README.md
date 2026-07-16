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

Event and device endpoints:

```bash
GET /events/resolve/:code
POST /admin/events
POST /devices/pair
GET /devices/me
```

Alert endpoints:

```bash
POST /alerts/ingest
GET /alerts?eventId=<event-id>
GET /alerts/:id
PATCH /alerts/:id/status
```

Realtime endpoints:

```bash
GET /events/alerts?eventId=<event-id>
```

Founder and EO event code behavior:

- Founder/admin logs in with email and password.
- Founder creates events with `POST /admin/events`.
- Each event gets a unique 6 digit code and an EO password hash.
- EO logs in with `POST /events/login` using `{ "code": "123456", "password": "..." }`.
- EO dashboard token is scoped to that event only.
- Founder revokes/reactivates access with `PATCH /admin/events/:id/code`.
- Revoked codes cannot be used by EO login, Android pairing, or Android SOS.

Apply event scoping migration after the initial schema:

```bash
psql "$DATABASE_URL" -f migrations/002_event_scoping.sql
psql "$DATABASE_URL" -f migrations/003_event_operator_login.sql
psql "$DATABASE_URL" -f migrations/004_remove_admin_config.sql
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
