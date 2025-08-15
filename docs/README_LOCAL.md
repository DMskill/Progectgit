# Локальный запуск и команды

## Быстрый старт через Docker Compose
```
docker compose up -d --build
```
- Фронтенд: http://localhost:3000
- Бэкенд API: http://localhost:3001
- БД: Postgres (порт 5432)

## Полезные команды

### Frontend (папка `frontend/`)
- Dev: `npm run dev`
- Сборка: `npm run build`
- Запуск prod-сборки: `npm start`
- Линт: `npm run lint`
- Типы: `npm run typecheck`
- E2E: `npm run test:e2e`
- Сид демо-данных (через API бэка): `npm run seed`

### Backend (папка `backend/`)
- Dev: `npm run start:dev`
- Сборка: `npm run build`
- Тесты unit: `npm run test`
- Тесты e2e: `npm run test:e2e`
- Линт: `npm run lint`
- Типы: `npm run typecheck`
- Сид (если есть seed.ts): `npm run seed`
- Сброс БД (осторожно): `npm run reset-db`

## Переменные окружения
- Примеры и подсказки: `backend/ENV_EXAMPLE.md`, `frontend/ENV_EXAMPLE.md`
- Заполните их в `.env` (backend) и `.env.local` (frontend) при запуске вне Docker.

## Частые проблемы
- Если фронт не видит бэкенд в Docker: убедитесь, что `NEXT_PUBLIC_API_URL` не задан, используется `/api` и в `next.config.ts` есть `rewrites` на `http://backend:3001`.
- При ошибках кэша Next.js: удалите папку `frontend/.next` и перезапустите контейнеры. 