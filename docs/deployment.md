# Siraye Deployment Guide

## 1. Provision infrastructure

1. Create Supabase project:
   - PostgreSQL database
   - Storage buckets: `siraye-assets`, `siraye-backups`
2. Create Upstash Redis database.
3. Create Google OAuth web app credential and set authorized origins + redirect URIs for your frontend domains.

## 2. Backend deployment (Render / Railway / Fly.io)

1. Deploy `backend/` as a Python service.
2. Build command:

```bash
pip install -r requirements.txt
```

3. Start command:

```bash
./entrypoint.sh
```

4. Add environment variables from `backend/.env.example` using production values:
   - Postgres values from Supabase
   - Redis values from Upstash
   - `DJANGO_SECRET_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `SUPABASE_SERVICE_ROLE_KEY`

5. Run Celery worker and Celery beat as separate background services:

```bash
celery -A config worker -l info
celery -A config beat -l info
```

## 3. Frontend deployment (Vercel)

1. Import `frontend/` as a Vercel project.
2. Build command:

```bash
npm run build
```

3. Output directory:

```bash
dist
```

4. Set environment variables:
   - `VITE_API_BASE_URL=https://<backend-domain>/api`
   - `VITE_GOOGLE_CLIENT_ID=<google-client-id>`

## 4. Security and production checks

1. Set `DJANGO_DEBUG=False`.
2. Set secure cookies and SSL redirect to `True`.
3. Set strict `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
4. Rotate Supabase service role key and Django secret periodically.

## 5. Daily backup operations

1. Celery beat triggers `apps.monitoring.tasks.backup_database` every 24 hours.
2. Backups upload to `siraye-backups` bucket.
3. Admin can monitor and download backup links from `/admin/backups`.
