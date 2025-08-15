# ProP2P — локальный запуск и документация

## Быстрый старт
```
docker compose up -d --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Переменные окружения
- Примеры и пояснения:
  - `backend/ENV_EXAMPLE.md`
  - `frontend/ENV_EXAMPLE.md`
- При запуске вне Docker скопируйте значения в `backend/.env` и `frontend/.env.local`.

## Полезные команды и инструкции
- Подробный гайд по локальному запуску, сидированию данных, тестам и линту: `docs/README_LOCAL.md`

## Продакшен/деплой
- Базовые заметки для деплоя: `deploy/README_DEPLOY.md` 