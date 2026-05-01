# Deployment Guide

## 1) Prerequisites

- Node.js 20+ (recommended)
- npm 10+
- SQLite for local (default) or PostgreSQL (by changing `DATABASE_URL`)

## 2) Environment Setup

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

PowerShell alternative:

```powershell
Copy-Item .env.example .env
```

Required keys:

- `DATABASE_URL`
- `JWT_SECRET`
- `CRON_SECRET`
- `MAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`

## 3) Install and Initialize

```bash
npm install
npx prisma migrate dev
npm run prisma:seed
```

## 4) Run in Development

```bash
npm run dev
```

## 5) Production Build

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run start
```

## 6) Reminder Job in Production

- **Admin-triggered**: use authenticated `POST /api/reminders/run`
- **Cron-triggered**: call `POST /api/reminders/run` with `x-cron-secret: <CRON_SECRET>`

## 7) Storage Notes

- Contract PDFs are stored in local filesystem under `public/uploads/contracts/...`
- Ensure deployment target has write permissions for upload directory
- For multi-instance production, move storage to shared object storage (S3-compatible) in a later iteration

## 8) CSV Export Notes

- Endpoint: `GET /api/admin/reports/contracts/export`
- Requires `report.export` permission
- Response is synchronous CSV download, suitable for moderate datasets
