# centric-backend

Centric Backend MVP for Hackaholics 7.0 — a peer-to-peer luggage delivery platform connecting senders with verified travelers. Built with **Express + TypeScript + Supabase (PostgreSQL)**.

## Tech Stack

- **Node.js / Express** — REST API
- **TypeScript** — typed throughout
- **Supabase (PostgreSQL)** — database, accessed via the Supabase REST API (`@supabase/supabase-js`)
- **Prisma ORM** — schema source of truth + migrations synced to Supabase (`prisma/`)
- **Socket.IO** — real-time delivery event updates
- **JWT** — authentication (HS256, signed with `JWT_SECRET`)
- **Swagger UI** — interactive API docs at `/api-docs`
- **Zod** — request validation

> **Note:** MongoDB/Mongoose was fully removed in favor of Supabase. A lightweight Mongoose-like data layer in `src/db/model.ts` provides the same `create / find / findOne / findById / findOneAndUpdate / updateMany / deleteMany / save / populate` API, so controllers and services keep the original code shape.

## Prerequisites

- Node.js 18+
- A Supabase project (PostgreSQL)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase project credentials:

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
JWT_SECRET=super_secret_jwt_key_change_me_in_production
JWT_EXPIRES_IN=30d
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres?sslmode=require
```

`DATABASE_URL` is the Supabase **Session Pooler** connection string (Supabase Dashboard → Project Settings → Database → Connection string → Pooler). Use the **session** (port `5432`) variant for Prisma migrations; the direct `db.<ref>.supabase.co` host is IPv6-only.

### 3. Create the database schema

**Option A (recommended) — via Prisma:** Prisma is the schema source of truth (`prisma/schema.prisma`). To apply schema changes to Supabase:

```bash
npm run db:generate   # regenerate the Prisma Client from the schema
npm run db:migrate    # create + apply a new migration (add --name <name> for the first one)
npm run db:deploy     # apply pending migrations (CI / production)
npm run db:push       # push schema changes without a migration history
npm run db:studio     # visual database browser
```

The initial migration (`prisma/migrations/0_init`) mirrors `supabase/migrations/0001_init.sql` and is already marked as applied on the existing database.

**Option B — manual SQL:** Open your Supabase project → **SQL Editor**, paste the contents of `supabase/migrations/0001_init.sql`, and run it. This creates all 10 tables (`users`, `traveler_profiles`, `journeys`, `packages`, `matches`, `deliveries`, `evidence`, `verifications`, `earnings`, `trust_score_logs`) with UUID primary keys, foreign keys with `ON DELETE CASCADE`, and status check constraints.

> **Workflow for schema changes:** edit `prisma/schema.prisma` → run `npm run db:migrate -- --name describe_change` → Prisma generates the SQL diff and applies it directly to your Supabase database. Re-run `npm run db:generate` if you use the generated client.

### 4. Seed demo data (optional)

```bash
npm run seed
```

Creates:

- `sender@centric.com` / `password123` (SENDER)
- `traveler@centric.com` / `password123` (TRAVELER, verified, trust score 70)
- A Yaba → Ikeja journey and a sample medical package

### 5. Run the server

```bash
npm run dev        # development (ts-node-dev)
npm run build      # compile to dist/
npm start          # production (node dist/server.js)
```

- API base: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api-docs`
- Health check: `GET /health`

## Verification

```bash
npm test           # integration tests against the real Supabase project (~50s, wipes all tables)
npm run demo       # full 15-step end-to-end flow simulation
```

**Important:** `npm test` and `npm run demo` wipe all rows in the 10 tables first. Re-run `npm run seed` afterwards if you want the demo data back.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Register user (SENDER/TRAVELER) |
| POST | `/api/v1/auth/login` | Login, returns JWT |
| GET | `/api/v1/auth/me` | Current user + traveler profile |
| POST | `/api/v1/verification/verify` | Mock KYC verification (+20 trust) |
| POST | `/api/v1/journeys` | Create traveler journey |
| GET | `/api/v1/journeys` | All journeys (with traveler info) |
| POST | `/api/v1/packages` | Create package (auto-triggers matching) |
| GET | `/api/v1/packages` | All packages |
| GET | `/api/v1/packages/:id` | Package by ID |
| GET | `/api/v1/matches/package/:packageId` | Matches for a package |
| GET | `/api/v1/matches/journey/:journeyId` | Matches for a journey |
| POST | `/api/v1/matches/:id/accept` | Accept match → creates delivery + OTP |
| GET | `/api/v1/deliveries/:id` | Delivery details (populated) |
| POST | `/api/v1/deliveries/:id/pickup` | Record pickup evidence |
| POST | `/api/v1/deliveries/:id/transit` | Mark IN_TRANSIT |
| POST | `/api/v1/deliveries/:id/out-for-delivery` | Mark OUT_FOR_DELIVERY |
| POST | `/api/v1/deliveries/:id/verify-otp` | Verify OTP → COMPLETED + payout + trust |
| DELETE | `/api/v1/deliveries/:id/cancel` | Cancel delivery |
| GET | `/api/v1/earnings` | Traveler earnings |
| GET | `/api/v1/trust/history` | Traveler trust score + audit log |
| POST | `/api/v1/ai/classify` | Mock AI package classification |

## Project Structure

```
src/
├── app.ts                  # Express app, routes, Swagger, error handler
├── server.ts               # Entry point (HTTP + Socket.IO)
├── config/
│   ├── db.ts               # Supabase connectivity check
│   ├── socket.ts           # Socket.IO setup
│   └── supabase.ts         # Supabase client (env-driven)
├── db/
│   └── model.ts            # Mongoose-like data layer over Supabase REST
├── middleware/
│   ├── auth.ts             # JWT protect + role restriction
│   ├── error.ts            # Central error handler (incl. Postgres codes)
│   └── validate.ts         # Zod validation
├── modules/                # One folder per feature (controller/routes/model)
└── seed.ts / demo-flow.ts  # Seeding + end-to-end demo
```

## MVP Flow

1. Sender registers and creates a package (Yaba → Ikeja)
2. Traveler registers, gets verified (+20 trust → 70)
3. Traveler creates a journey (Yaba → Ikeja)
4. Matching engine scores compatible journeys (route overlap, detour, capacity, trust)
5. Traveler accepts a match → delivery created with a 6-digit OTP
6. Traveler records pickup evidence → IN_TRANSIT → OUT_FOR_DELIVERY
7. Recipient provides OTP → delivery COMPLETED
8. Earnings auto-calculated (base ₦1000 + ₦100/km + ₦200/kg, 80% to traveler) and trust score +10