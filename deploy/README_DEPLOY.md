# ProP2P — продакшен деплой (docker compose)

## 1. Переменные окружения
Создайте `.env.prod` в корне (см. пример ниже):

```
# Postgres
POSTGRES_USER=prop2p
POSTGRES_PASSWORD=change_me
POSTGRES_DB=prop2p

# Backend
CORS_ORIGINS=https://your-domain.com
JWT_SECRET=change_me_super_secret

# Frontend
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

Для почты (опционально):
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=pass
MAIL_FROM=no-reply@your-domain.com
```

## 2. Сборка и запуск (prod)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod build
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Проверьте:
- Frontend: https://your-domain.com
- Backend: https://api.your-domain.com (если проксируете) или http://SERVER_IP:3001

## 3. Nginx (пример)
Скопируйте `deploy/nginx.conf` и подставьте свои домены. Установите certbot/LE для HTTPS.

## 4. Бэкапы БД
Сделайте ежедневный бэкап тома `db_data` или используйте managed PostgreSQL.

## 5. Обновление
```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
``` 