# Database & Authentication Integration Guide

Siraye is built to support modern cloud-native databases, managed storage, and multi-tenant authentication out of the box.

---

## 1. Supported Database Integrations

Siraye uses the Django ORM targeting PostgreSQL 15+. Because it follows standard SQL conventions, it seamlessly connects to managed cloud PostgreSQL providers with zero code modifications:

| Provider | Purpose | Recommended Mode | Features Enabled |
| :--- | :--- | :--- | :--- |
| **Supabase** | Primary Managed Database & Object Storage | Transaction Pooler (Port 6543) or Direct (Port 5432) | Automated SSL, `siraye-assets` avatar storage, daily `siraye-backups` |
| **Neon** | Serverless Cloud PostgreSQL | Pooled Connection String | Autoscaling compute, branch databases, SSL-enforced |
| **Local PostgreSQL** | Development & Offline Docker | Local Container (Port 5432 / 5435) | Default local setup via `docker-compose.yml` |
| **MongoDB** | Analytical Logs & Unstructured Storage | Cloud Atlas / Replica Set | Monitored via `MONGODB_URI` |

---

## 2. Supabase Integration

### Step 1: Create Supabase Project
1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Under **Project Settings > Database**, locate your connection string.

### Step 2: Configure Environment Variables
In `backend/.env`:
```env
# Using connection URL
DATABASE_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require

# Or individual fields
POSTGRES_HOST=aws-0-[region].pooler.supabase.com
POSTGRES_PORT=6543
POSTGRES_DB=postgres
POSTGRES_USER=postgres.[ref]
POSTGRES_PASSWORD=your-secure-password
POSTGRES_SSLMODE=require
```

### Step 3: Supabase Storage Setup (Avatars & Automated Backups)
1. In Supabase Dashboard, navigate to **Storage > New Bucket**:
   - `siraye-assets` (Public: Yes — for user avatars and task attachments)
   - `siraye-backups` (Public: No — private bucket for daily encrypted database dumps)
2. Add the credentials to `backend/.env`:
```env
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...[your-service-role-key]
```

> **Smart Feature:** Siraye's `settings.py` automatically detects Supabase transaction poolers (port 6543) and sets `DISABLE_SERVER_SIDE_CURSORS = True` to prevent prepared-statement conflicts with PgBouncer.

---

## 3. Neon Integration

Neon is a serverless PostgreSQL platform with instant branching and auto-suspend compute.

### Step 1: Create a Neon Project
1. Go to [Neon Console](https://console.neon.tech) and create a project.
2. Select your main branch and copy the **Connection string (pooled)**.

### Step 2: Configure Environment Variables
In `backend/.env`:
```env
DATABASE_URL=postgresql://[user]:[password]@[endpoint]-pooler.[region].neon.tech/neondb?sslmode=require
```

> **Smart Feature:** Siraye automatically inspects the database host. When `neon.tech` is detected in `HOST`, it auto-enables SSL verification (`sslmode=require`) regardless of whether `DEBUG` is true or false.

---

## 4. Local Containerized PostgreSQL

For local development or fully self-hosted Docker environments:

In `docker-compose.yml`:
```yaml
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: siraye
      POSTGRES_USER: siraye_user
      POSTGRES_PASSWORD: siraye_secure_password
    ports:
      - "5435:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

In `backend/.env`:
```env
DATABASE_URL=postgres://siraye_user:siraye_secure_password@postgres:5432/siraye
```

---

## 5. MongoDB Integration (Optional Analytics)

If you use MongoDB Atlas for auxiliary event logging or analytics archiving:

1. Add your connection URI in `backend/.env`:
```env
MONGODB_URI=mongodb+srv://[username]:[password]@[cluster].mongodb.net/siraye?retryWrites=true&w=majority
```
2. Check `/api/health` to confirm that `cloud_integrations.mongodb.configured` is `true`.

---

## 6. Real-Time Diagnostic Health Endpoint

Siraye provides a diagnostic health check endpoint at `/api/health`:

```bash
curl -s http://localhost:8001/api/health | jq
```

Sample output:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "provider": "Supabase Managed PostgreSQL",
    "engine": "django.db.backends.postgresql",
    "ssl_enabled": true,
    "latency_ms": 28.4,
    "error": null
  },
  "cache": {
    "connected": true,
    "backend": "django-redis",
    "latency_ms": 3.8
  },
  "cloud_integrations": {
    "supabase_storage": {
      "configured": true,
      "storage_bucket": "siraye-assets"
    },
    "google_oauth": {
      "configured": true,
      "client_id_set": true
    },
    "mongodb": {
      "configured": false
    }
  }
}
```

---

## 7. Google OAuth & Multi-Tenant Provisioning

### Architecture:
```
User clicks "Sign in with Google" / "Sign up with Google"
  │
  ▼
Google OAuth Pop-up / Credential Verification
  │
  ▼
POST /api/auth/google
  │
  ├── 1. Validate ID token via Google OAuth2 API (or secure test tokens in development)
  ├── 2. Atomically get or create User record
  ├── 3. If new user:
  │       ├─ Generate personal Workspace with unique slug
  │       ├─ Assign WorkspaceMembership with Role.OWNER
  │       └─ Flag onboarding_completed = False
  └── 4. Issue SimpleJWT access & refresh tokens
  │
  ▼
Frontend receives JWT tokens
  ├── If onboarding_completed = False -> Redirect to /onboarding
  └── If onboarding_completed = True  -> Redirect to /dashboard
```

### Production Setup:
1. Create a project in [Google Cloud Console](https://console.cloud.google.com).
2. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
3. Set **Application type** to *Web application*.
4. Authorized JavaScript origins:
   - `http://localhost:5173` (local dev)
   - `https://yourdomain.com` (production)
5. Set environment variables:
   - In `backend/.env`: `GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com`
   - In `frontend/.env`: `VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`
