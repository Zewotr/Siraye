#!/usr/bin/env bash
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

WORKERS=${GUNICORN_WORKERS:-4}
THREADS=${GUNICORN_THREADS:-8}
BACKLOG=${GUNICORN_BACKLOG:-2048}

echo "Starting Gunicorn with ${WORKERS} workers and ${THREADS} threads per worker (backlog=${BACKLOG})..."

exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "$WORKERS" \
    --threads "$THREADS" \
    --worker-class gthread \
    --worker-connections 1000 \
    --backlog "$BACKLOG" \
    --keep-alive 5 \
    --max-requests 2000 \
    --max-requests-jitter 200 \
    --timeout 120

