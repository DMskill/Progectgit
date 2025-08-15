# Backend .env example

Скопируйте значения ниже в файл `.env` в папке `backend/` и при необходимости измените.

```
# Runtime
NODE_ENV=development
PORT=3001

# Security
JWT_SECRET=replace_with_strong_random_secret
# Список админ-почт через запятую (доступ к /admin)
ADMIN_EMAILS=

# Database (локальный Postgres по умолчанию)
DATABASE_URL=postgres://prop2p:prop2p@localhost:5432/prop2p

# CORS: домены фронтенда (через запятую)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Публичные URL-ы (для ссылок в письмах и редиректов)
PUBLIC_API_URL=http://localhost:3001
PUBLIC_APP_URL=http://localhost:3000

# Почта (для продакшна). Используйте порт 587 (STARTTLS) либо 465 (SSL)
MAIL_FROM="ProP2P <no-reply@your-domain>"
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
# true для 465 (SSL), false для 587 (STARTTLS)
SMTP_SECURE=false

# Бизнес-настройки
LISTING_TTL_DAYS=30
ACTIVE_LISTING_LIMIT=10
``` 