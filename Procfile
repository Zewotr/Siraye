release: cd backend && python manage.py migrate --noinput
web: cd backend && gunicorn config.wsgi:application --log-file -
worker: cd backend && celery -A config worker -l info
beat: cd backend && celery -A config beat -l info

