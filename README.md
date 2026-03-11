# Diploma

## Run

```bash
docker compose up --build
```

## Services

- `auth-service`: `http://localhost:8081`
- `patient-service`: `http://localhost:8082`
- `appointment-service`: `http://localhost:8083`
- `frontend`: `http://localhost:5173`
- `minio api`: `http://localhost:9000`
- `minio console`: `http://localhost:9001`

## Admin Panel

- URL: `http://localhost:5173/admin/doctors`
- Bootstrap admin credentials are read from `.env`:
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`

After login, the admin can manage doctor cards (profile, prices, schedules, certificates), publish/unpublish doctors, and moderate reviews.

## File Uploads (MinIO)

- Admin upload endpoint: `POST /api/admin/files/upload`
- Form fields:
  - `file` (multipart file, required)
  - `folder` (optional, example: `doctors`, `certificates`)
- Response contains:
  - `key` (object key in bucket)
  - `url` (public URL for storing in doctor card)
