# MAHE Admission Portal

A complete admission portal built with **Next.js 14 App Router**, **TypeScript**, and **Supabase** (database only, no Supabase Auth). Custom OTP-based registration and login via SmartPing SMS.

## Prerequisites

- Node.js 18+
- A Supabase project with the required tables

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_ENV=development

SMS_API_BASE_URL=https://pgapi.smartping.ai/fe/api/v1/send
SMS_API_USERNAME=
SMS_API_PASSWORD=
SMS_API_FROM=
```

> **Tip:** When `APP_ENV=development`, the API returns `dev_otp` in the response body so you can verify without a real phone.

## Database Tables Required

| Table | Purpose |
|---|---|
| `portal_users` | User accounts (phone, email, name, course, verification flags) |
| `otp_requests` | OTP transactions (channel, purpose, code, expiry, attempts) |
| `portal_sessions` | Custom session tokens (httpOnly cookie-based) |
| `applications` | One application per user |
| `application_basic_details` | Application form fields |
| `lsq_sync_logs` | Reserved for future LSQ sync |

## Running Locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Pages

| Path | Description |
|---|---|
| `/` | Redirects to `/dashboard` or `/login` based on session |
| `/signup` | New user registration |
| `/login` | Existing user login |
| `/verify-otp` | OTP entry (shared for register & login) |
| `/dashboard` | Applicant dashboard |
| `/application` | Application form |

## API Routes

### Auth
- `POST /api/auth/register-check` — Check if phone/email exists
- `POST /api/auth/register-start` — Create user, send SMS OTP
- `POST /api/auth/register-verify-phone-otp` — Verify OTP, activate user, create session
- `POST /api/auth/send-email-otp` — Send email OTP (alternate channel)
- `POST /api/auth/verify-email-otp` — Verify email OTP
- `POST /api/auth/login-check` — Look up user by phone or email
- `POST /api/auth/login-start` — Send login OTP via SMS or email
- `POST /api/auth/login-verify-otp` — Verify login OTP, create session
- `POST /api/auth/resend-otp` — Resend OTP (30s cooldown enforced)
- `POST /api/auth/logout` — Revoke session, clear cookie
- `GET /api/auth/me` — Get current authenticated user

### Application
- `GET /api/application/dashboard` — Dashboard data (requires session)
- `GET /api/application/basic-details` — Load saved form data
- `POST /api/application/basic-details` — Save/update form data

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (via `@supabase/supabase-js`)
- **Validation:** Zod v4
- **Styling:** Tailwind CSS v4 + custom CSS variables
- **Session:** httpOnly cookie (`portal_session`), 7-day expiry
- **SMS:** SmartPing API
