# Operations Runbook

## First-Time Local Setup

1. Install dependencies: `npm install`
2. Configure env: copy `.env.example` to `.env`
3. Run migrations: `npx prisma migrate dev`
4. Seed initial admin user: `npm run prisma:seed`
5. Start app: `npm run dev`

## Daily Developer Checks

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Feature Verification Checklist

- **Auth**
  - Login with seeded admin account succeeds
  - Inactive/blocked account cannot access protected APIs
- **Contracts**
  - CRUD works
  - Detail and list filters work
  - PDF upload accepts only valid PDF under size limit
- **Approval**
  - Submit -> approve/reject transitions are valid
  - Reject requires reason
- **Notifications**
  - List endpoint works
  - Unread count updates
  - Mark-as-read is owner-scoped
- **Reminders**
  - Preview endpoint returns candidates
  - Run endpoint enqueues jobs and returns summary
  - Worker processes queue and writes reminder logs
- **Reports**
  - Summary endpoint returns metrics
  - Contracts report filters work
  - CSV export downloads properly

## Manual Reminder Run Example

```bash
curl -X POST "http://localhost:3000/api/reminders/run" \
  -H "x-cron-secret: your_cron_secret"
```

PowerShell alternative:

```powershell
Invoke-WebRequest -Method POST -Uri "http://localhost:3000/api/reminders/run" -Headers @{ "x-cron-secret" = "your_cron_secret" }
```

## Reminder Worker Run Example

```bash
npm run worker:reminder
```

Worker behavior:
- Picks `PENDING/FAILED` jobs due by `nextAttemptAt`
- Locks each job as `PROCESSING`
- Sends reminder email asynchronously
- Retries with exponential backoff on failure
- Moves to `DEAD_LETTER` when retry limit is exhausted

## Common Troubleshooting

- **401 on protected endpoints**
  - Check login flow and `auth_token` cookie
- **Reminder sends failing**
  - Verify SMTP env values and outbound network access
  - Run `npm run worker:reminder` and inspect structured logs for retry/dead-letter events
- **Upload errors**
  - Validate PDF mime/extension and file size <= 10MB
  - Ensure upload directory is writable
- **Prisma errors**
  - Re-run `npx prisma migrate dev`
  - Check `DATABASE_URL`
