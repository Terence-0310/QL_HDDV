# Demo Checklist

## Environment Readiness

- [ ] `.env` created from `.env.example`
- [ ] `JWT_SECRET` configured
- [ ] `CRON_SECRET` configured
- [ ] SMTP settings configured (or fallback explanation prepared)

## Data Readiness

- [ ] Migrations applied
- [ ] Seed executed (`npm run prisma:seed`)
- [ ] At least one pending-approval contract exists
- [ ] At least one contract near expiry exists
- [ ] Sample PDF file available for upload demo

## Feature Walkthrough Readiness

- [ ] Login works with demo account
- [ ] Dashboard data visible
- [ ] Contract list and filters working
- [ ] Approval queue actions tested (approve + reject with reason)
- [ ] Notifications list/unread/read tested
- [ ] Reminder preview/run checked
- [ ] Reports summary and CSV export tested

## Presentation Readiness

- [ ] Browser tabs pre-arranged for smooth flow
- [ ] Backup screenshots prepared
- [ ] `docs/demo-script.md` reviewed
- [ ] Key architecture diagrams ready (`docs/*.md`)
