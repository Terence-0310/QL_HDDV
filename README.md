# HỆ THỐNG QUẢN LÝ HỢP ĐỒNG ĐIỆN TỬ VÀ NHẮC MỐC GIA HẠN

Tài liệu này là README duy nhất của dự án, dùng cho:

- Giới thiệu mục tiêu và phạm vi hệ thống.
- Hướng dẫn cài đặt/chạy nhanh.
- Mô tả chức năng, kiến trúc, dữ liệu và lộ trình hoàn thiện.

---

## 1) Mục tiêu dự án

Hệ thống được xây dựng để số hóa và quản lý tập trung vòng đời hợp đồng trong doanh nghiệp:

- Lưu trữ, tra cứu và theo dõi hợp đồng điện tử.
- Kiểm soát quy trình phê duyệt hợp đồng.
- Theo dõi chính xác mốc thời gian hết hạn.
- Tự động nhắc gia hạn theo mốc (7/15/30 ngày hoặc tùy chỉnh).
- Gửi thông báo trên hệ thống và email.
- Giảm rủi ro quên gia hạn, tăng hiệu quả vận hành.

---

## 2) Tác nhân (Actors)

### Quản trị viên (Admin)

- Toàn quyền hệ thống.
- Quản lý người dùng và phân quyền.
- Xem dashboard, báo cáo, vận hành nhắc hạn.

### Nhân viên (Staff/User)

- Thêm, sửa, xem hợp đồng theo quyền.
- Theo dõi trạng thái, thời hạn, lịch sử xử lý.
- Thực hiện các thao tác nghiệp vụ được cấp quyền.

---

## 3) Chức năng chính

### 3.1 Quản lý hợp đồng

- Thêm/sửa/xóa/xem chi tiết hợp đồng.
- Upload file hợp đồng (PDF).
- Quản lý các thông tin: mã, tên, đối tác, giá trị, ngày ký, ngày hiệu lực, ngày hết hạn.

### 3.2 Tìm kiếm và lọc

- Tìm theo mã, tên, đối tác.
- Lọc theo trạng thái hợp đồng/phê duyệt.
- Sắp xếp, phân trang, truy vấn nhanh.

### 3.3 Nhắc mốc gia hạn

- Xử lý nhắc hạn tự động theo mốc:
  - 30 ngày
  - 15 ngày
  - 7 ngày
- Gửi email và tạo thông báo hệ thống.
- Dedupe theo ngày/mốc để tránh gửi trùng.

### 3.4 Quy trình phê duyệt

- Gửi duyệt hợp đồng.
- Phê duyệt hoặc từ chối (kèm lý do).
- Theo dõi trạng thái và lịch sử thao tác.

### 3.5 Quản lý người dùng

- Danh sách người dùng.
- Cập nhật vai trò, trạng thái.
- Phân quyền truy cập theo vai trò.

### 3.6 Báo cáo và thống kê

- Tổng hợp hợp đồng theo trạng thái.
- Hợp đồng sắp hết hạn/đã hết hạn/chờ duyệt.
- Xuất CSV báo cáo.

---

## 4) Quy trình hoạt động tổng quát

1. Người dùng nhập thông tin hợp đồng và upload file.
2. Hệ thống kiểm tra dữ liệu, lưu vào cơ sở dữ liệu.
3. Job định kỳ kiểm tra thời hạn hợp đồng theo ngày.
4. Khi đến mốc nhắc, hệ thống gửi thông báo/email.
5. Người dùng cập nhật kết quả xử lý: gia hạn hoặc kết thúc hợp đồng.

---

## 5) Kiến trúc kỹ thuật

### Công nghệ chính

- Next.js (App Router)
- TypeScript
- Prisma ORM
- SQLite (môi trường local)
- JWT (HttpOnly cookie)
- Vitest, Playwright

### Cấu trúc thư mục

- `app/`: trang giao diện và API routes
- `components/`: UI dùng chung và UI nghiệp vụ
- `services/`: business logic
- `lib/`: auth, jwt, validator, helper, mail, cache...
- `hooks/`: custom hooks frontend
- `prisma/`: schema, migrations, seed
- `scripts/`: worker/scheduler/benchmark
- `tests/`: unit/e2e tests
- `docs/`: tài liệu chi tiết kiến trúc và vận hành

---

## 6) Mô hình dữ liệu cốt lõi

- `User`: thông tin tài khoản, vai trò, trạng thái
- `Contract`: thông tin hợp đồng và trạng thái vòng đời
- `ReminderJob`: hàng đợi nhắc hạn
- `ReminderLog`: lịch sử gửi nhắc
- `Notification`: thông báo người dùng
- `AuditLog`: lịch sử thao tác hệ thống

---

## 7) API chính

- Auth:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`

- Contracts:
  - `GET /api/contracts`
  - `POST /api/contracts`
  - `GET /api/contracts/[id]`
  - `PATCH /api/contracts/[id]`
  - `DELETE /api/contracts/[id]`
  - `POST /api/contracts/[id]/upload`
  - `POST /api/contracts/[id]/renew`

- Approval:
  - `POST /api/contracts/[id]/submit-approval`
  - `POST /api/contracts/[id]/approve`
  - `POST /api/contracts/[id]/reject`
  - `GET /api/contracts/[id]/approval-history`

- Reminder:
  - `GET /api/reminders/preview`
  - `POST /api/reminders/run`

- Notifications:
  - `GET /api/notifications`
  - `GET /api/notifications/unread-count`
  - `PATCH /api/notifications/[id]/read`
  - `PATCH /api/notifications/read-all`

- Admin:
  - `GET /api/admin/users`
  - `PATCH /api/admin/users/[id]`
  - `GET /api/admin/contracts`
  - `GET /api/admin/approvals`
  - `GET /api/admin/reports/summary`
  - `GET /api/admin/reports/contracts`
  - `GET /api/admin/reports/contracts/export`

---

## 8) Cài đặt và chạy nhanh

## 8.1 Yêu cầu môi trường

- Node.js 18+ (khuyến nghị Node 20)
- npm

## 8.2 Cài đặt

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

## 8.3 Tài khoản demo

- `admin@example.com` / `Admin@12345`
- `staff@example.com` / `Staff@12345`
- `user@example.com` / `User@12345`

---

## 9) Lệnh thường dùng

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run prisma:migrate
npm run prisma:seed
npm run worker:reminder
npm run worker:reminder:daemon
```

---

## 10) Biến môi trường quan trọng

- `DATABASE_URL`
- `JWT_SECRET`
- `CRON_SECRET`
- `MAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `PRISMA_QUERY_LOG`
- `REPORT_EXPORT_MAX_ROWS`
- `REMINDER_WORKER_BATCH_SIZE`
- `REMINDER_WORKER_CONCURRENCY`
- `REMINDER_VERBOSE_LOGS`

---

## 11) Trạng thái hiện tại

### Đã có

- Auth + phân quyền + guard API.
- Quản lý hợp đồng, upload file, lọc/tìm kiếm/phân trang.
- Quy trình phê duyệt hợp đồng.
- Nhắc hạn theo mốc 7/15/30 (có queue + worker + log).
- Trung tâm thông báo và đánh dấu đã đọc.
- Dashboard và báo cáo cơ bản.
- CI cơ bản, lint/typecheck/test.

### Cần hoàn thiện thêm

- Giám sát vận hành sâu hơn (metrics/alerts/dashboard vận hành).
- Tăng độ phủ E2E cho các luồng quan trọng.
- Chuẩn hóa cloud storage cho môi trường production.
- Mở rộng approval đa bước và dynamic permission.

---

## 12) Lộ trình phát triển và hoàn thiện

### Giai đoạn A - Ổn định vận hành

- Củng cố scheduler + worker + retry/dead-letter.
- Theo dõi queue health và cảnh báo lỗi gửi nhắc hạn.

### Giai đoạn B - Tối ưu hiệu năng

- Tối ưu điều hướng trang, giảm fetch lặp.
- Cải thiện UX tải dữ liệu (stale-while-refresh, prefetch).
- Tối ưu truy vấn và index theo luồng dashboard/report/list.

### Giai đoạn C - Nâng cấp tài liệu & lưu trữ

- Chuẩn hóa quy trình lưu trữ file hợp đồng.
- Tích hợp object storage (S3/Cloudinary) cho production.

### Giai đoạn D - Nâng cấp chất lượng doanh nghiệp

- Approval history chuyên biệt và đa bước.
- Tăng cường kiểm thử tự động và quality gate CI/CD.
- Mở rộng báo cáo vận hành và truy vết hệ thống.

---

## 13) Tài liệu tham khảo trong dự án

- `docs/architecture.md`
- `docs/deployment.md`
- `docs/runbook.md`
- `docs/use-case.md`
- `docs/erd.md`
- `docs/sequence.md`
- `docs/activity.md`

---

## 14) Ghi chú

- Đây là README duy nhất ở cấp dự án.
- Khi thay đổi nghiệp vụ lớn, cập nhật mục tiêu/chức năng/lộ trình trong file này.
# Contract Management System

Electronic Contract Management + Renewal Reminder platform.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Prisma ORM
- SQLite (local development)

## Final Project Guide

## Single README Policy

This repository uses a single source of project documentation:

- `README.md` (this file) is the only project-level README.
- Legacy overview files are removed to avoid drift and duplicated guidance.
- Detailed technical references remain in `docs/` and are linked from this file.

## Development and Completion Objectives

### Strategic Objectives

The system is developed toward these completion goals:

- Digitize full contract lifecycle and supporting documents.
- Centralize contract data and operational workflows in one platform.
- Enable fast retrieval via search, filter, and actionable dashboards.
- Track contract expiry timelines accurately with automated daily checks.
- Trigger renewal reminders automatically at configured milestones (7/15/30).
- Improve governance quality, reduce renewal risk, and cut manual effort.

### Actors and Responsibilities

- **Admin**
  - Manage users and permissions.
  - Full system access to contracts, approvals, reports, and reminders.
- **Staff**
  - Create/update/view contracts.
  - Track lifecycle status, reminders, and operational tasks.

### Core Functional Scope

- Contract management: create, edit, delete, list, detail.
- Contract document handling: upload and metadata storage.
- Contract information model: dates, partner, value, notes, status.
- Search/filter/sort: by code, title, partner, status, date windows.
- Renewal reminders: milestone-based alerts and notifications.
- User management: role/status governance and permission enforcement.
- Reporting: expiring, expired, pending approvals, and CSV export.

### Operating Workflow

1. User enters contract details and uploads files.
2. System validates and stores data in database.
3. Scheduled processes evaluate contract timelines daily.
4. Reminder jobs send in-app/email alerts at renewal milestones.
5. Users update contract outcome (renew/terminate/continue workflow).

### Input Data Domains

- Contract data: code, title, partner, start/end/sign dates, value, description.
- User data: account credentials, role/status, contact email.
- Reminder data: current date and reminder thresholds (7/15/30 or custom).
- System-generated data: lifecycle status, notifications, audit history, logs.

### Expected Outputs

- Accurate contract list/detail views with lifecycle states.
- Fast search/filter result sets and management views.
- Timely renewal notifications (system + email) with actionable context.
- Summary metrics and reports for operational decision-making.
- Traceable user actions and permission-safe system behavior.

### Completion Roadmap (Execution Order)

1. **Platform Stability**
   - Auth/session reliability, route guards, and validation consistency.
   - Performance tuning for navigation and high-frequency list views.
2. **Reminder Reliability**
   - Worker + scheduler hardening, retries/backoff, dead-letter visibility.
   - Milestone reminders (7/15/30) with dedupe and observability.
3. **Data and Document Maturity**
   - Cloud storage adapter for production environments.
   - Stronger document lifecycle controls and operational policies.
4. **Quality and Verification**
   - Expand unit/integration/e2e coverage for critical flows.
   - CI quality gates and migration safety checks.
5. **Enterprise Extensions**
   - Multi-step approval history, dynamic permissions, async large exports.

### Project Overview

This project is an internal Contract Management System for electronic contract operations, renewal reminders, approval workflow, admin governance, and reporting/export.

### Business Problem

Teams need a single system to manage contract lifecycle actions (create/update/upload/renew), avoid missed renewals, enforce approval controls, and provide auditable admin/reporting visibility.

### Core Feature Modules

- Authentication with JWT (HttpOnly cookie) and account status enforcement
- Role-permission access control (`ADMIN`, `STAFF` with granular permissions)
- Contract CRUD + advanced list filtering/pagination/sorting
- Contract PDF upload with validation and metadata storage
- Contract renewal workflow (successor contract model)
- Approval workflow (submit/approve/reject with reason and auditability)
- Reminder preview/run job with same-day dedupe and email dispatch
- Notification center (list, unread count, mark as read)
- Admin CMS APIs + frontend pages (dashboard, users, contracts, approvals, reports)
- Report summary/list and CSV export

### Architecture Overview

- **Route layer**: request parsing, guard checks, response shaping
- **Service layer**: workflow/business orchestration
- **Library layer**: auth/jwt/errors/validators/storage/date/csv helpers
- **Persistence layer**: Prisma schema + migration
- **Frontend layer**: thin page composition + reusable components + hooks

Reference docs:

- `docs/architecture.md`
- `docs/use-case.md`
- `docs/erd.md`
- `docs/sequence.md`
- `docs/activity.md`

### Folder Structure (Simplified)

- `app/` - App Router pages and API routes
- `components/` - shared/admin/notification UI components
- `hooks/` - frontend state hooks
- `lib/` - shared infra and validators
- `services/` - business logic
- `prisma/` - schema, migrations, seed
- `tests/` - unit test foundation
- `docs/` - architecture, UML-style docs, deployment, runbook, demo assets

### Authentication and Permissions

- Login: `POST /api/auth/login`
- Current user: `GET /api/auth/me`
- Permission checks are centralized in `lib/permissions.ts`
- Frontend permission checks are UX-only; backend guards are authoritative

### Workflow Overview

- **Contract lifecycle**: `DRAFT`, `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `TERMINATED`
- **Approval lifecycle**: `NOT_SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED`
- Approval state is intentionally separated from contract lifecycle state
- Renewal uses parent-child contract relationship for historical traceability

### API Summary

- **Auth**: `/api/auth/login`, `/api/auth/me`
- **Contracts**: `/api/contracts`, `/api/contracts/[id]`, `/api/contracts/[id]/upload`, `/api/contracts/[id]/renew`
- **Approval**: `/api/contracts/[id]/submit-approval`, `/api/contracts/[id]/approve`, `/api/contracts/[id]/reject`
- **Reminder**: `/api/reminders/preview`, `/api/reminders/run`
- **Notifications**: `/api/notifications`, `/api/notifications/unread-count`, `/api/notifications/[id]/read`
- **Admin**:
  - `/api/admin/users`, `/api/admin/users/[id]`
  - `/api/admin/contracts`
  - `/api/admin/approvals`
  - `/api/admin/reports/summary`
  - `/api/admin/reports/contracts`
  - `/api/admin/reports/contracts/export`

### Quick Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

PowerShell alternative for env copy:

```powershell
Copy-Item .env.example .env
```

### Environment Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `CRON_SECRET`
- `NODE_ENV`
- `MAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`

### Quality and Test Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```

### Deployment and Operations Notes

- Full deployment notes: `docs/deployment.md`
- Runbook/troubleshooting: `docs/runbook.md`
- Demo checklist: `docs/demo-checklist.md`
- Demo presentation script: `docs/demo-script.md`

### How To Demo In 5-7 Minutes

1. Login as admin.
2. Show dashboard summary cards.
3. Open admin contracts list and submit one draft for approval.
4. Open approval queue and perform approve + reject (with reason).
5. Open notifications and mark one unread notification as read.
6. Show reminders preview/run behavior.
7. Open reports and export CSV.
8. Close by showing docs diagrams (`docs/*.md`) and architecture rationale.

## Sprint 1 - Foundation Setup

### Sprint 1 Goal

Establish a clean and scalable technical foundation for contract management, including initial database schema and base service/API architecture.

### What Was Set Up

- Standardized project structure with clear layer separation:
  - `app`: UI and API route handlers
  - `services`: business logic layer
  - `lib`: shared infrastructure utilities
  - `types`: shared DTO and service contracts
  - `prisma`: schema and migrations
- Prisma configured with SQLite datasource for local development.
- Reusable singleton Prisma client implemented in `lib/prisma.ts`.
- Initial service placeholders:
  - `contract.service.ts`
  - `dashboard.service.ts`
- Minimal API placeholders:
  - `GET /api/contracts`
  - `GET /api/dashboard`
- Environment template created in `.env.example`.

### Schema Overview

Core entities and relations initialized:

- `User` (roles: `ADMIN`, `STAFF`)
- `Contract` (statuses: `DRAFT`, `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `TERMINATED`)
- `ReminderLog` (types and send statuses for reminder tracking)
- `AuditLog` (system actions and entity-level tracking)

Indexes and constraints included for scalable querying:

- Unique: `User.email`, `Contract.code`
- Contract indexes: `endDate`, `status`, `ownerId`
- ReminderLog index: `contractId`
- AuditLog indexes: `userId`, `entityType`, `entityId`

### Next Sprint Recommendation

Sprint 2 should focus on:

- Authentication and authorization foundation.
- Contract CRUD use-cases with validation and error handling.
- Dashboard query enhancements and pagination/filtering strategy.
- Initial audit logging integration in service methods.

### Sprint 1 audit refinement

- Added a composite index on `AuditLog(entityType, entityId)` to support common entity-based audit lookups at scale.
- Kept API route handlers thin while adding minimal error responses for safer baseline behavior.
- Preserved existing Sprint 1 architecture and schema decisions without introducing business features.

## Sprint 2 - Authentication + Contract CRUD API

### Auth approach

- Implemented minimal JWT-based auth foundation because no existing auth stack was present in the repository.
- Login issues a signed JWT and stores it in an HttpOnly cookie (`auth_token`) with secure defaults.
- Protected endpoints resolve the current user through centralized auth helpers in `lib/auth.ts`.

### Protected API overview

- `POST /api/auth/login` - credential login with password verification.
- `GET /api/auth/me` - current authenticated user.
- `GET /api/contracts` - protected contract list with pagination and filters.
- `POST /api/contracts` - protected contract creation.
- `GET /api/contracts/[id]` - protected contract detail.
- `PATCH /api/contracts/[id]` - protected contract update.
- `DELETE /api/contracts/[id]` - protected contract delete.

### Validation and audit logging

- Added centralized Zod validators:
  - `lib/validators/auth.validator.ts`
  - `lib/validators/contract.validator.ts`
- Validation covers login payload, contract create/update payloads, and list query parsing.
- Contract mutations now write audit logs:
  - `CONTRACT_CREATE`
  - `CONTRACT_UPDATE`
  - `CONTRACT_DELETE`
- Optional auth audit events are also captured:
  - `AUTH_LOGIN_SUCCESS`
  - `AUTH_LOGIN_FAILED`

### Migration and run commands

- Install dependencies:
  - `npm install`
- Apply migrations:
  - `npx prisma migrate dev`
- (Optional) seed admin account:
  - `npm run prisma:seed`
- Start app:
  - `npm run dev`

### Dev admin account (seed)

- Email: `admin@example.com`
- Password: `Admin@12345`
- For local development only; rotate credentials before any shared environment.

### Recommended Sprint 3

- Add registration/user management flows for admins.
- Add refresh-token or token rotation strategy for longer-lived sessions.
- Introduce contract status transition rules and richer domain validations.
- Add integration tests for auth and contract endpoints.

## Sprint 3 - Dashboard + Reminder Job Foundation

### Dashboard stats overview

- Implemented protected dashboard stats with role-aware scope:
  - `ADMIN` sees all contracts
  - `STAFF` sees owned contracts
- Added time-aware metrics for:
  - total, active, draft, terminated
  - expired (by date)
  - expiring soon (by per-contract `renewalReminderDays`)
  - reminder due today window baseline

### Reminder logic foundation overview

- Added reusable reminder service in `services/reminder.service.ts`:
  - candidate detection (`getReminderCandidates`)
  - reminder type resolution (`resolveReminderType`)
  - dedupe guard (`shouldSkipReminder`)
  - processing orchestration (`processReminderCandidates`)
  - reminder logging (`createReminderLog`)
- Reminder dispatch is intentionally provider-agnostic in this sprint.

### Preview endpoint

- `GET /api/reminders/preview`
- Admin-only protected endpoint
- Returns reminder candidates with resolved reminder type
- No mutation side effects

### Run endpoint / cron foundation

- `POST /api/reminders/run`
- Supports two safe trigger modes:
  - Admin-authenticated trigger
  - Cron/machine trigger via `x-cron-secret` header matching `CRON_SECRET`
- Route is thin and delegates all business logic to reminder service.

### Duplicate prevention rule

- Centralized dedupe rule prevents re-processing the same `contractId + reminderType` within the same UTC day.
- Dedupe logic lives in reminder service only (not scattered across routes).

### Current limitation

- Actual email/SMS dispatch provider is not wired yet.
- Reminder processing records truthful outcomes:
  - currently `PENDING` when provider is not configured
  - `FAILED` on processing exceptions

### Migration and environment

- Added reminder log query index for dedupe/performance:
  - `ReminderLog(contractId, reminderType, createdAt)`
- New env variable:
  - `CRON_SECRET`

### Recommended Sprint 4

- Integrate real email provider and map dispatch outcomes to `SENT/FAILED`.
- Add retry policy and backoff strategy for failed reminders.
- Add scheduler deployment config (Vercel Cron or server cron).
- Add reminder execution history endpoint and operational monitoring.

## Sprint 4 - Contract PDF Upload + Detail/List Upgrade

### Contract PDF upload foundation

- Added protected upload endpoint: `POST /api/contracts/[id]/upload`.
- Upload flow now supports:
  - contract access validation (`ADMIN` all, `STAFF` scoped by ownership)
  - PDF-only validation (mime + extension)
  - 10MB size limit
  - storage through centralized abstraction (`lib/storage.ts`)
  - contract metadata update and audit logging

### Storage strategy chosen

- Local filesystem storage under `public/uploads/contracts/{contractId}/...`.
- Contract persists both public URL and metadata fields:
  - `fileUrl`
  - `fileName`
  - `originalFileName`
  - `fileMimeType`
  - `fileSize`
  - `uploadedAt`
- Old file replacement policy:
  - upload replaces metadata and safely attempts deleting old local stored file.

### Contract detail endpoint

- `GET /api/contracts/[id]` returns clean contract detail with:
  - core fields
  - safe owner subset
  - document metadata
  - lightweight reminder summary (`totalLogs`, `latestLogAt`)

### List/search/filter/pagination/sorting upgrades

- `GET /api/contracts` now supports:
  - search: `code`, `title`, `partnerName`, `partnerEmail`
  - filters: `status`, `ownerId` (ADMIN), `autoRenew`
  - date ranges: `startDateFrom/startDateTo`, `endDateFrom/endDateTo`
  - pagination: `page`, `pageSize`
  - sorting: `createdAt`, `updatedAt`, `endDate`, `title`, `value`
  - default sort: `createdAt desc`
- Response meta now includes:
  - `page`, `pageSize`, `totalItems`, `totalPages`, `sortBy`, `sortOrder`

### Migration

- Added document metadata columns to `Contract`.
- Migration keeps schema changes minimal and backward-compatible.

### Current limitations

- Upload currently uses local disk storage only.
- Cloud storage adapters (S3/Cloudinary) are not wired yet.
- No PDF preview, OCR, or signature workflow in this sprint.

### Recommended Sprint 5

- Add pluggable cloud storage provider (S3/Cloudinary) using current storage abstraction.
- Add document lifecycle management (safe remove/archive + retention policy).
- Add contract activity timeline endpoint combining contract/audit/reminder events.
- Add integration tests for upload, detail, and advanced list query behavior.

### Sprint 4 audit refinement

- Hardened storage path safety by sanitizing `contractId` for filesystem usage and validating resolved storage targets.
- Added upload rollback safety so newly stored files are cleaned up if DB metadata update fails.
- Normalized list query inputs so empty `search` and `ownerId` values do not produce inconsistent filtering behavior.

## Sprint 5 - Real Reminder Email + Notification Center + Renewal Workflow

### Real reminder email integration

- Replaced placeholder reminder dispatch with real mail abstraction:
  - `services/mail.service.ts` for business mail use-cases
  - `lib/mail/provider.ts` for SMTP provider delivery using Nodemailer
  - centralized templates under `lib/mail/templates/*`
- Reminder processing now sends actual emails when SMTP is configured.
- Reminder result persistence is truthful:
  - `SENT` only when SMTP send succeeds
  - `FAILED` when configuration is missing or provider send fails

### Mail provider approach

- Chosen provider strategy: SMTP via Nodemailer.
- Reason: provider-agnostic, practical for local/dev/prod, and no vendor lock-in.

### Notification Center backend foundation

- Added Notification model and service:
  - create notification
  - list notifications with pagination/filter
  - unread count
  - mark-as-read (owner-scoped, idempotent)
- New protected endpoints:
  - `GET /api/notifications`
  - `GET /api/notifications/unread-count`
  - `PATCH /api/notifications/[id]/read`

### Renewal workflow strategy

- Chosen strategy: successor/new contract model.
- Renewal creates a new contract linked to source via `parentContractId`.
- Keeps historical traceability and supports audit-friendly lifecycle.
- New protected endpoint:
  - `POST /api/contracts/[id]/renew`

### Schema updates

- Added `Notification` model and related enums.
- Added contract self-reference renewal fields:
  - `parentContractId`
  - `renewalVersion`
  - `renewedAt`
- Added user-to-notification relation.

### Reminder + notification + audit integration

- Reminder run now integrates:
  - candidate + dedupe checks
  - real email send
  - notification creation for reminder/failed reminder events
  - per-item audit log (`SEND_REMINDER_EMAIL` / `FAIL_REMINDER_EMAIL`)
  - batch audit summary (`RUN_REMINDER_JOB`)
- Renewal action logs `RENEW_CONTRACT` and optionally renewal email outcome.

### Required environment variables (email)

- `MAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`

### Current limitations

- No background queue/retry worker yet (batch runs in-process).
- No provider failover yet (single SMTP provider path).
- Notification Center is backend foundation only (no dedicated UI in this sprint).

### Recommended Sprint 6

- Add retry/backoff queue for failed reminder emails.
- Add notification preference settings per user.
- Add renewal lifecycle states and approval checkpoints.
- Add integration tests for reminder mail flow, notification endpoints, and renewal workflow.

### Sprint 5 audit refinement

- Tightened reminder dedupe to block repeated same-day processing for the same `contractId + reminderType` regardless of prior outcome.
- Added explicit `FAIL_REMINDER_EMAIL` audit logging in reminder processing exception paths to ensure complete delivery-failure traceability.

## Sprint 6 - Admin CMS + Permission Control + Approval + Report Export

### Admin CMS backend foundation

- Added admin-focused endpoints for user management, contract oversight, and approval queue:
  - `GET /api/admin/users`
  - `GET /api/admin/users/[id]`
  - `PATCH /api/admin/users/[id]`
  - `GET /api/admin/contracts`
  - `GET /api/admin/approvals`
- Added dedicated `admin.service.ts` with pagination, filters, and safe user field responses.

### Permission model chosen

- Implemented centralized code-defined role-to-permission mapping in `lib/permissions.ts`.
- Added reusable guards:
  - `requirePermission(request, permission)`
  - `requireAnyPermission(request, permissions)`
- This keeps DB schema simple while enabling fine-grained authorization checks.

### Approval workflow status design chosen

- Added separate approval state (`ApprovalStatus`) instead of overloading `ContractStatus`.
- Approval fields on `Contract`:
  - `approvalStatus`
  - `submittedForApprovalAt`
  - `approvedAt`
  - `rejectedAt`
  - `approvedById`
  - `rejectionReason`
- Added approval endpoints:
  - `POST /api/contracts/[id]/submit-approval`
  - `POST /api/contracts/[id]/approve`
  - `POST /api/contracts/[id]/reject`

### Report and export APIs

- Added summary and contracts reporting endpoints:
  - `GET /api/admin/reports/summary`
  - `GET /api/admin/reports/contracts`
  - `GET /api/admin/reports/contracts/export`
- CSV export:
  - deterministic column order
  - UTF-8 text/csv response
  - filename pattern `contracts-report-YYYY-MM-DD.csv`
  - safe CSV escaping via `lib/csv.ts`

### Schema updates

- Added `UserStatus` enum and `User.status`.
- Added `ApprovalStatus` enum and approval metadata fields on `Contract`.
- Added contract approver relation (`approvedById -> User`).
- Added indexes for approval querying.

### Audit and notification integration

- Added audit actions for:
  - `UPDATE_USER_ROLE`
  - `UPDATE_USER_STATUS`
  - `SUBMIT_CONTRACT_FOR_APPROVAL`
  - `APPROVE_CONTRACT`
  - `REJECT_CONTRACT`
  - `EXPORT_CONTRACT_REPORT`
  - `VIEW_ADMIN_REPORT_SUMMARY`
- Approval actions create concise owner/admin notifications where relevant.

### Current limitations

- Permission mapping is code-defined (not DB-managed role profiles yet).
- Approval history is represented by contract-level metadata + audit logs (no separate approval history table yet).
- CSV export is synchronous for current scale.

### Recommended Sprint 7

- Add DB-managed custom roles/permissions for enterprise policy control.
- Add dedicated approval history timeline model for multi-step approvals.
- Add report caching and async export jobs for large datasets.
- Add admin activity dashboard and integration tests for permission matrix and workflow transitions.

### Sprint 6 audit refinement

- Enforced account `status` checks in auth resolution so inactive/blocked users cannot pass permission guards.
- Hardened login flow to reject non-active accounts before session issuance.
- Tightened admin CMS protection for `/api/admin/contracts` using explicit admin-level permission.
- Refined approval transition rule to prevent re-submitting already approved contracts.

## Sprint 7 - Frontend Admin Application Layer

### Frontend architecture approach

- Introduced App Router dashboard shell architecture with route grouping:
  - `app/(dashboard)/...` for authenticated internal app pages
- Added frontend layering:
  - `components/admin/*` for admin pages
  - `components/notifications/*` for notification center
  - `components/shared/*` for reusable UI blocks
  - `hooks/use-current-user.ts` for session/user state
  - `lib/api-client.ts` for request abstraction
  - `lib/permissions-client.ts` for UX-level permission checks

### Admin modules added

- Admin Dashboard UI:
  - summary stat cards from `/api/admin/reports/summary`
- Approval Queue UI:
  - pending approvals table, approve/reject actions with reason support
- Admin Users UI:
  - list/search/pagination and role/status updates (permission-aware actions)
- Admin Contracts UI:
  - admin contracts table with filters and submit-approval action
- Reports UI:
  - summary page + contracts report table with filters
  - CSV export button wired to backend export endpoint
- Notification Center UI:
  - list, unread/read filter, and mark-as-read action
  - notification bell in dashboard header with unread count

### Routes/pages added

- `/admin/dashboard`
- `/admin/approvals`
- `/admin/users`
- `/admin/contracts`
- `/admin/reports`
- `/admin/reports/contracts`
- `/notifications`

### Permission-aware UI behavior

- Sidebar navigation visibility is role/permission-aware.
- Page-level guards show unauthorized fallback for missing permissions.
- Action buttons are conditionally rendered by permission intent:
  - approval actions
  - user management actions
  - report export action

### Shared UI patterns

- Reusable table, badges, stat cards, pagination, loading/error/empty states.
- Consistent internal-app shell with sidebar + top header context.
- Professional internal-business style focused on clarity and usability.

### Current limitations

- UI uses lightweight native controls (no heavy component framework yet).
- Some mutations use immediate refresh instead of optimistic updates.
- No dedicated toast system yet; feedback is currently basic.
- No frontend E2E tests yet.

### Recommended Sprint 8

- Add reusable modal/dialog system for approval/reject/user edit flows.
- Add richer contract detail drawer with renewal/approval timeline.
- Add frontend query caching layer (e.g., React Query) for better UX/performance.
- Add end-to-end tests for admin permission matrix and critical workflows.

### Sprint 7 audit refinement

- Improved mutation safety in frontend admin/notification modules by using centralized API request error handling instead of unchecked `fetch` calls.
- Added clearer failure feedback for approval reject/approve, submit-approval, notification read, and CSV export actions.
- Made header notification bell permission-aware so users without notification access do not see or trigger notification badge fetch logic.

## Sprint 8 - Final Hardening, QA Foundation, and Delivery Assets

### What was completed

- Added a practical testing foundation using Vitest with unit tests targeting high-risk business utilities.
- Added quality scripts for final checks:
  - `typecheck`
  - `test`
  - `test:watch`
  - `test:coverage`
- Expanded operational documentation and delivery artifacts under `docs/`:
  - architecture, ERD, use-case, sequence, activity diagrams
  - deployment guide
  - runbook
  - demo checklist
  - demo script with lecturer Q&A guidance
- Refined `.env.example` for clearer final-stage setup.

### Test coverage focus (Sprint 8)

- Permission mapping behavior (server/client helpers)
- Reminder core decision logic and payload building
- CSV escaping utility correctness
- Upload PDF validation guards
- Report query validator defaults and date-range safety

### Final delivery status

- Repository is demo-ready, testable, and documentation-complete for thesis/project presentation.
- Remaining scale-up enhancements (queue workers, cloud storage, deeper integration/E2E tests) are documented as future improvements rather than overstated as completed features.

### Sprint 8 final audit refinement

- Removed remaining React hook dependency warnings by stabilizing data-fetch handlers with `useCallback` in key admin/notification pages.
- Improved cross-platform execution clarity by adding PowerShell alternatives for environment setup and reminder run commands.
- Simplified CI push trigger configuration to avoid ambiguous wildcard branch matching behavior.

### Auth/Admin access quick troubleshooting

- If header shows `Khách` and admin pages show permission warning, the most common cause is that you are not logged in yet (no valid `auth_token` cookie in browser session).
- Login page is available at `/login`.
- After successful login, `/api/auth/me` should return the current user and the admin header should show your name + role instead of `Khách`.
- Admin pages require `admin.dashboard.view` permission (granted to `ADMIN` role).

### Test admin account

- Seed command: `npm run prisma:seed`
- Default dev admin:
  - Email: `admin@example.com`
  - Password: `Admin@12345`
- Seed now enforces this account as `ACTIVE` so it can authenticate and access admin pages with correct permissions.

### UI theme refactor note

- Frontend UI has been polished with a cohesive nâu + trắng design system (brown + white) using shared style tokens in `app/globals.css`.
- Key screens refreshed: đăng nhập/đăng ký, layout quản trị, dashboard, users, contracts, approvals, notifications, reports.
- Visual consistency improved across cards, bảng dữ liệu, toolbar, trạng thái, phân trang, and empty/loading/error states.
- Backend business logic, auth/session architecture, API integrations, and permission guards remain unchanged.

### Auth flow completion note

- Hệ thống auth đã được hoàn thiện theo luồng thực tế:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Public registration chỉ tạo tài khoản `USER` (không cho client tự gán `ADMIN/STAFF`).
- Chính sách role/status:
  - Role: `ADMIN`, `STAFF`, `USER`
  - Status: `ACTIVE`, `INACTIVE`, `BLOCKED`
  - Tài khoản `BLOCKED` / `INACTIVE` không thể đăng nhập.
- Session sử dụng JWT HttpOnly cookie (`auth_token`), frontend dùng `/api/auth/me` để resolve user hiện tại.

### Demo auth accounts

- Chạy seed: `npm run prisma:seed`
- Tài khoản demo:
  - `admin@example.com` / `Admin@12345`
  - `staff@example.com` / `Staff@12345`
  - `user@example.com` / `User@12345`

### Manual auth test quick steps

1. `npm run prisma:seed`
2. `npm run dev`
3. Truy cập `/register` để tạo tài khoản public (`USER`) mới.
4. Truy cập `/login` và đăng nhập bằng một trong các tài khoản demo.
5. Gọi `/api/auth/me` (qua frontend flow) để xác nhận session hợp lệ.
6. Dùng nút `Đăng xuất` trên header để kiểm tra logout và trạng thái session.

## Sprint 9 - Reminder Queue + Worker (Production-minded)

### Muc tieu

- Tach reminder email dispatch khoi request sync.
- `POST /api/reminders/run` giu API contract cu, nhung chuyen sang enqueue jobs.
- Worker doc jobs den han, xu ly gui email, retry/backoff, va dead-letter.

### Data model queue

- Them `ReminderJob` model:
  - `status`: `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `DEAD_LETTER`
  - `attempts`, `maxAttempts`
  - `scheduledAt`, `nextAttemptAt`, `processingAt`, `processedAt`
  - `errorMessage`, `payload`
- Index:
  - `(status, nextAttemptAt)` de worker pick nhanh
  - `(contractId, type, createdAt)` de truy vet theo nghiep vu

### Luong reminder moi

1. `GET /api/reminders/preview` khong doi.
2. `POST /api/reminders/run`:
   - van scan candidate + dedupe nhu cu
   - enqueue `ReminderJob` thay vi gui email sync
   - tra summary tuong thich (khong pha flow cu)
3. Worker (`npm run worker:reminder`):
   - pick jobs `PENDING/FAILED` den han
   - lock sang `PROCESSING`
   - gui email, ghi `ReminderLog`, tao notification, audit
   - thanh cong -> `SUCCESS`
   - that bai -> `FAILED` + `nextAttemptAt` theo exponential backoff
   - vuot `maxAttempts` -> `DEAD_LETTER`

### Env moi cho queue

- `REMINDER_MAX_ATTEMPTS` (default: `3`)
- `REMINDER_RETRY_BASE_MS` (default: `30000`)
- `REMINDER_WORKER_BATCH_SIZE` (default: `20`)

### Lenh van hanh

```bash
# Enqueue jobs (admin hoac cron secret)
curl -X POST "http://localhost:3000/api/reminders/run" -H "x-cron-secret: your_cron_secret"

# Process queue mot lan
npm run worker:reminder
```
