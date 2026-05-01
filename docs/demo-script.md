# Demo Script (5-7 Minutes)

## 1) Demo Objective

Show an end-to-end electronic contract management platform with approval workflow, reminder automation, notification center, and admin reporting/export.

## 2) Audience Framing (Opening)

Suggested intro:

> "This system manages electronic contracts from creation to renewal, including role-permission security, approval workflow, reminder emails, and admin reporting."

## 3) Pre-Demo Checklist

- App running (`npm run dev`)
- DB migrated and seeded
- Admin account credentials ready
- At least 2-3 contracts seeded (one pending approval, one near expiry)
- Sample PDF file prepared
- SMTP either configured, or clearly explain fallback behavior

## 4) Recommended Demo Accounts

- Admin: `admin@example.com` / `Admin@12345` (seed default)
- Optional staff account created in admin user module

## 5) Live Demo Flow

1. **Login**
   - Show secure authentication and successful session
2. **Admin Dashboard**
   - Show summary cards (contracts/users/approvals)
3. **Admin Contracts**
   - Show search/filter table
   - Open operational view and submit a draft for approval
4. **Approval Queue**
   - Approve one contract
   - Reject one contract with reason (highlight guardrails)
5. **Notification Center**
   - Show unread/read behavior and mark one as read
6. **Reminder**
   - Show preview endpoint results
   - Trigger reminder run and explain dedupe + logging
7. **Reports**
   - Show summary and contracts report filters
   - Export CSV
8. **Close with architecture/docs**
   - Open README and docs diagrams briefly

## 6) Suggested Talking Points by Step

- Auth: centralized JWT + permission guard
- Approval: separated `approvalStatus` from lifecycle `status` for clean transitions
- Reminder: same-day dedupe by `contractId + reminderType`
- Reporting: filterable list + CSV export for operations
- Frontend: permission-aware UX with backend-authoritative security

## 7) Backup Flow if Something Fails

- If SMTP is unavailable: show reminder run summary with truthful failure logging
- If upload path permission fails: use previously uploaded contract data and explain local storage constraints
- If a mutation fails: demonstrate clear API/UI error handling as part of reliability

## 8) Likely Lecturer Questions and Suggested Answers

- **Why Next.js + Prisma?**
  - Fast full-stack iteration, typed backend/frontend, and maintainable service layering.
- **Why split approval status from contract status?**
  - Avoid state collisions and keep approval transitions auditable.
- **How is security enforced?**
  - Centralized backend permission checks; frontend checks are UX-only.
- **How is reminder dedupe handled?**
  - Service-level same-day guard on contract + reminder type.
- **How would this scale?**
  - Move storage to object storage, move reminder execution to queue workers, and adopt PostgreSQL in production.

## 9) Strength Highlights

- Clear architecture and separation of concerns
- Auditable business actions via `AuditLog`
- Practical admin operations and reporting
- Demo-friendly frontend connected to real backend flows

## 10) Known Limitations (Professional Framing)

- No queue worker yet for reminders
- Local filesystem upload storage in current build
- Limited automated integration/E2E tests (unit-focused test foundation added)
