# Diploma

## Запуск

```bash
docker compose up --build
```

## Сервисы

- `auth-service`: `http://localhost:8081`
- `patient-service`: `http://localhost:8082`
- `appointment-service`: `http://localhost:8083`
- `frontend`: `http://localhost:5173`
- `minio api`: `http://localhost:9000`
- `minio console`: `http://localhost:9001`

## Админ-панель

- URL: `http://localhost:5173/admin/doctors`
- Начальные учётные данные администратора берутся из `.env`:
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`

После входа администратор может управлять карточками врачей (профиль, цены, расписание, сертификаты), публиковать/снимать с публикации врачей и модерировать отзывы.

## Загрузка файлов (MinIO)

- Эндпоинт загрузки для админа: `POST /api/admin/files/upload`
- Поля формы:
  - `file` (multipart-файл, обязательно)
  - `folder` (необязательно, пример: `doctors`, `certificates`)
- Ответ содержит:
  - `key` (ключ объекта в бакете)
  - `url` (публичный URL для сохранения в карточке врача)
