# Centric Backend MVP (Hackaholics 7.0)

Crowd-sourced logistics backend — connects **Senders** with verified **Travelers** who carry packages along their journeys. Built for the Hackaholics 7.0 MVP demo: clean, modular Express + TypeScript, backed by **Supabase (PostgreSQL)** instead of MongoDB.

## Stack

- Node.js + Express + TypeScript
- Supabase (PostgreSQL) — accessed through the Supabase REST API (`@supabase/supabase-js`)
- JWT authentication (HS256, `JWT_SECRET`)
- Zod request validation, role authorization, centralized error handling
- Socket.IO realtime delivery events
- Swagger UI at `/api-docs`

## Prerequisites

- Node.js 18+
- A Supabase project. The tables must exist — see [Database Setup](#database-setup).

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + key
npm run dev            # http://localhost:3000
```

Verify:

```bash
npm run build   # typecheck + compile
npm test        # integration tests (matching, delivery, OTP, trust)
npm run seed    # demo data: sender@centric.com / traveler@centric.com (password123)
npm run demo    # full end-to-end demo flow against the API
```

## Database Setup (Supabase)

The backend reads/writes via the Supabase REST API using the publishable key — **no database connection string is needed at runtime**.

1. Open your project → **SQL Editor** → New query
2. Run the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
3. The 10 tables are created with RLS disabled (fine for the MVP)

`.env`:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
JWT_SECRET=<any long random string>   # used to sign app JWTs
```

## MVP Demo Flow (fully automated)

```
npm run demo
```

Covers: sender registers → traveler registers → mock verification → journey (Yaba → Ikeja) → package created → matching engine ranks matches (score + detour) → traveler accepts → delivery assigned → pickup evidence → IN_TRANSIT → OUT_FOR_DELIVERY → OTP verified → COMPLETED → earnings recorded → trust score updated.

## API Overview (`/api/v1`)

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Verification | `POST /verification/verify` (mock KYC) |
| Journeys | `POST /journeys`, `GET /journeys`, `GET /journeys/all` |
| Packages | `POST /packages` (triggers matching), `GET /packages`, `GET /packages/:id` |
| Matching | `GET /matching/packages/:packageId` (on-demand), `GET /matches/package/:packageId`, `GET /matches/journey/:journeyId`, `POST /matches/:id/accept` |
| Deliveries | `GET /deliveries/:id`, `POST /deliveries/:id/pickup`, `POST /deliveries/:id/transit`, `POST /deliveries/:id/out-for-delivery`, `POST /deliveries/:id/verify-otp`, `POST /deliveries/:id/cancel` |
| Evidence | `GET /evidence/:deliveryId` |
| Earnings | `GET /earnings` |
| Trust | `GET /trust/history` |
| AI | `POST /ai/classify` (rule-based fallback, Gemini optional via `GEMINI_API_KEY`) |

Full interactive docs: **http://localhost:3000/api-docs**

Realtime Socket.IO events: `delivery:matched`, `delivery:accepted`, `delivery:picked_up`, `delivery:in_transit`, `delivery:completed`.

## Project Structure

```
src/
  config/        # supabase client, socket.io, swagger
  db/            # Supabase data layer (Mongoose-like API: create/find/save/populate)
  middleware/    # auth (JWT), role guard, validation, error handler
  modules/       # auth, users, verification, journeys, packages, matching,
                 # deliveries, earnings, trust, ai, evidence
  routes/        # /api/v1 router
  app.ts         # express app
  server.ts      # entrypoint
  seed.ts        # demo data
  demo-flow.ts   # end-to-end demo simulation
supabase/
  migrations/    # SQL schema (run in Supabase SQL Editor)
```

## Tests

`npm test` runs against your Supabase project (the tables must exist). Tests wipe and reseed the tables, so run `npm run seed` afterwards to restore the demo data.