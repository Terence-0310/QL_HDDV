# Use Case Overview

## Actors

- **Admin**
  - Full admin CMS access, approval actions, report export, user management
- **Staff**
  - Contract operations in allowed scope, submit for approval, view notifications
- **Cron Trigger**
  - Runs reminder job via secret-authenticated endpoint

## High-Level Use Cases

```mermaid
flowchart TD
  Admin --> UC1[Manage Users]
  Admin --> UC2[View Admin Dashboard]
  Admin --> UC3[Approve/Reject Contracts]
  Admin --> UC4[View Reports and Export CSV]
  Admin --> UC5[Run Reminder Job]

  Staff --> UC6[Create/Update Contracts]
  Staff --> UC7[Upload Contract PDF]
  Staff --> UC8[Submit Contract for Approval]
  Staff --> UC9[Renew Contract]
  Staff --> UC10[View Notifications]

  Cron[Cron Trigger] --> UC11[Execute Reminder Run Endpoint]
```

## Scope Notes

- Frontend permission checks are UX-level only; backend permission guards are authoritative.
- Reminder dedupe prevents same contract + reminder type processing multiple times on the same UTC day.
