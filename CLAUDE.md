# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (watch mode)
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Lint (auto-fix)
npm run lint

# Format
npm run format

# Tests
npm run test               # all unit tests
npm run test:watch         # watch mode
npm run test:cov           # with coverage
npm run test:e2e           # e2e (test/jest-e2e.json config)

# Run a single test file
npx jest src/expenses/expenses.service.spec.ts
```

## Environment Variables

```
PORT                  # default 3030
ALLOWED_ORIGINS       # comma-separated origins (or * for all)
DATABASE_URL          # PostgreSQL connection string (takes precedence)
POSTGRES_HOST
POSTGRES_PORT         # default 5430
POSTGRES_NAME
POSTGRES_USER
POSTGRES_PASSWORD
JWT_SECRET
RESEND_API_KEY        # for reminder emails
RESEND_FROM           # sender address, e.g. "GastoFácil <no-reply@example.com>"
```

TypeORM runs with `synchronize: true`, so the schema auto-updates on startup — no manual migrations needed in development.

Static file uploads are served from `./uploads` at `/uploads`.

## Architecture

NestJS 11 + TypeORM + PostgreSQL backend for a personal finance app called **GastoFácil**. Each feature is a self-contained NestJS module under `src/`.

### Core modules

**`auth`** — JWT authentication. Issues short-lived access tokens (30 min) and refresh tokens (7 days) via `AuthService.createJwtToken`. Two Passport strategies: `jwt` (access token) and `refresh-token`. Guards are applied via the `@Auth()` and `@AuthRefreshToken()` decorators in `src/auth/decorators/`.

**`users`** — User entity with UUID PK, soft-delete (`deletedAt`), and roles (`USER` | `ADMIN`). Password is excluded from default selects (`select: false`).

**`expenses` / `incomes`** — CRUD for transactions. Both support `moneyType: ARS | USD`. When `moneyType === USD`, the official ARS rate is fetched live from `dolarapi.com/v1/dolares/oficial` (`ExchangeRateService`) and stored as `usdToArsRate` on the record. Every create/update/delete automatically adjusts the balance via `BalanceService.adjust()`.

**`categories`** — Simple lookup table; `Expense` has a `ManyToOne` relation to `Category` (eager-loaded).

**`balance`** — Stores balance snapshots in `balance_snapshots`. Two named accounts: `banco` (bank) and `efectivo` (cash). The `adjust(account, delta)` method mutates the most recent snapshot for that account (ordered by `updatedAt DESC`, then `date DESC`). There is no running ledger — only the latest snapshot is authoritative.

**`import`** — Two-phase BBVA bank statement import:
1. **Preview** (`POST /import/preview`): parse uploaded XLSX → detect duplicates (exact `externalId` match or fuzzy: date ±1 day + amount within 1%) → return `ImportPreview`.
2. **Confirm** (`POST /import/confirm`): bulk-insert expenses/incomes tagged with a UUID `importBatchId` and `importSource: 'bbva_import'`; optionally set a balance snapshot from the statement's ending balance.

BBVA-imported records skip balance adjustment on individual deletion — batch deletion via `DELETE /import/batch/:batchId` removes the records and their associated balance snapshot together. This avoids double-counting since the snapshot already reflects the statement balance.

**`reminders`** — Email reminders. `RemindersCronService` runs every minute (`* * * * *`) in Argentina timezone, calls `RemindersService.processPendingReminders()`, which finds `PENDING` reminders where `notifyAt <= now` and sends via `MailService` (Resend SDK). Reminder lifecycle: `PENDING → PROCESSING → SENT | FAILED`. Failed reminders track `retryCount` and `lastError`.

### Request flow

All routes use a global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`. DTOs use `class-validator` decorators. CORS is configured from `ALLOWED_ORIGINS` env var.

### Balance invariant

When creating an expense or income, `BalanceService.adjust()` is called with a negative or positive delta respectively. On deletion, the inverse is applied — **unless** `importSource === 'bbva_import'`, which skips adjustment to avoid corrupting the statement-derived snapshot.
