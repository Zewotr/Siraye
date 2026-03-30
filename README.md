# Siraye

Production-ready SaaS task management platform built with Django + DRF, React, Supabase PostgreSQL/Storage, and Celery.

## Tech Stack

- Frontend: React, TailwindCSS, React Router, Axios, React Query
- Backend: Django, Django REST Framework, SimpleJWT
- Database: PostgreSQL (Supabase)
- Auth: Google OAuth + JWT + email verification
- Background jobs: Celery + Redis (Upstash-compatible)
- Cloud storage: Supabase Storage

## Features

- Google sign-in + JWT auth + logout + `/auth/me`
- Email verification with expiry and resend flow
- Task CRUD with priority ordering + completion flow
- Reminder notifications (5 minutes before task start)
- In-app notifications + browser notifications
- Profile update, picture upload, and account deletion
- Admin analytics, user moderation, security monitoring
- Storage monitoring and backup management
- Daily PostgreSQL backup to Supabase bucket
- Rate limiting and abuse/security logging

## Monorepo Structure

```text
Siraye/
  backend/
    apps/
      accounts/
      tasks/
      notifications/
      monitoring/
      adminpanel/
      common/
    config/
    requirements.txt
    Dockerfile
    .env.example
  frontend/
    src/
      api/
      components/
      contexts/
      hooks/
      layouts/
      pages/
      routes/
      styles/
      utils/
    Dockerfile
    package.json
    .env.example
  docs/
    database-schema.sql
    deployment.md
  docker-compose.yml
```

## Core API Endpoints

### Authentication

- `POST /api/auth/google`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/{id}`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`
- `PATCH /api/tasks/{id}/complete`

### Profile

- `GET /api/profile`
- `PUT /api/profile`
- `DELETE /api/profile`

### Admin

- `GET /api/admin/users`
- `PUT /api/admin/users/{id}`
- `PATCH /api/admin/users/{id}/ban`
- `PATCH /api/admin/users/{id}/unban`
- `DELETE /api/admin/users/{id}`
- `GET /api/admin/security-logs`
- `GET /api/admin/system-stats`
- `GET /api/admin/storage`
- `GET /api/admin/backups`
- `POST /api/admin/backups`

## Local Setup

## 1) Backend

```bash
cd backend 
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## 2) Celery

```bash
cd backend
celery -A config worker -l info
celery -A config beat -l info
```

## 3) Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Docker (full stack)

```bash
docker compose up --build
```

## Environment Variables

- Backend template: `backend/.env.example`
- Frontend template: `frontend/.env.example`

Critical production variables:

- `DJANGO_SECRET_KEY`
- `POSTGRES_*` (Supabase values)
- `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`
- `GOOGLE_OAUTH_CLIENT_ID`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `DJANGO_ALLOWED_HOSTS`

## Security Controls

- JWT auth with refresh token rotation/blacklisting
- RBAC (`admin` vs `user`) and banned-user enforcement
- Email verification gate for non-admin users
- DRF throttles for login and API requests
- IP-level security event logging
- CSRF middleware and secure headers

## Database Tables

Implemented in Django models and migrations:

- `users`
- `tasks`
- `notifications`
- `security_logs`
- `admin_logs`
- `email_verification`
- `system_metrics`

See full SQL reference: `docs/database-schema.sql`.

## Deployment

See `docs/deployment.md` for step-by-step deployment on Vercel + Render/Railway/Fly + Supabase + Upstash.
