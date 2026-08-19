-- ============================================================
-- Centric MVP - Supabase Schema (replaces MongoDB collections)
-- Run this in the Supabase SQL Editor on your project.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text not null,
  role text not null check (role in ('SENDER', 'TRAVELER')),
  phone text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. traveler_profiles
-- ------------------------------------------------------------
create table if not exists traveler_profiles (
  id uuid primary key default gen_random_uuid(),
  "user" uuid not null unique references users (id) on delete cascade,
  "isVerified" boolean not null default false,
  "verificationDetails" jsonb,
  "trustScore" numeric not null default 50 check ("trustScore" between 0 and 100),
  "completedDeliveries" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. journeys
-- ------------------------------------------------------------
create table if not exists journeys (
  id uuid primary key default gen_random_uuid(),
  "user" uuid not null references users (id) on delete cascade,
  origin jsonb not null,
  destination jsonb not null,
  "departureTime" timestamptz not null,
  "availableCapacity" numeric not null check ("availableCapacity" >= 0),
  status text not null default 'CREATED'
    check (status in ('CREATED', 'MATCHED', 'COMPLETED', 'CANCELLED')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists journeys_user_idx on journeys ("user");

-- ------------------------------------------------------------
-- 4. packages
-- ------------------------------------------------------------
create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  "user" uuid not null references users (id) on delete cascade,
  "pickupLocation" jsonb not null,
  destination jsonb not null,
  description text not null,
  category text not null,
  weight numeric not null check (weight >= 0),
  "declaredValue" numeric not null check ("declaredValue" >= 0),
  recipient jsonb not null,
  status text not null default 'CREATED'
    check (
      status in (
        'CREATED', 'MATCHED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT',
        'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'
      )
    ),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists packages_user_idx on packages ("user");

-- ------------------------------------------------------------
-- 5. matches
-- ------------------------------------------------------------
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  package uuid not null references packages (id) on delete cascade,
  journey uuid not null references journeys (id) on delete cascade,
  "matchScore" numeric not null,
  "estimatedDetour" numeric not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique (package, journey)
);

-- ------------------------------------------------------------
-- 6. deliveries
-- ------------------------------------------------------------
create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  package uuid not null unique references packages (id) on delete cascade,
  journey uuid not null references journeys (id) on delete cascade,
  traveler uuid not null references users (id) on delete cascade,
  sender uuid not null references users (id) on delete cascade,
  status text not null default 'ASSIGNED'
    check (
      status in ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED')
    ),
  otp text not null,
  "otpExpiresAt" timestamptz not null,
  "otpFailedAttempts" integer not null default 0,
  "pickupEvidence" jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists deliveries_journey_idx on deliveries (journey);
create index if not exists deliveries_traveler_idx on deliveries (traveler);
create index if not exists deliveries_sender_idx on deliveries (sender);

-- ------------------------------------------------------------
-- 7. evidence
-- ------------------------------------------------------------
create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  delivery uuid not null references deliveries (id) on delete cascade,
  "photoUrl" text not null,
  timestamp timestamptz not null default now(),
  gps jsonb not null,
  note text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists evidence_delivery_idx on evidence (delivery);

-- ------------------------------------------------------------
-- 8. verifications
-- ------------------------------------------------------------
create table if not exists verifications (
  id uuid primary key default gen_random_uuid(),
  "user" uuid not null unique references users (id) on delete cascade,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'VERIFIED', 'REJECTED')),
  "documentType" text not null,
  "documentNumber" text not null,
  "verifiedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 9. earnings
-- ------------------------------------------------------------
create table if not exists earnings (
  id uuid primary key default gen_random_uuid(),
  traveler uuid not null references users (id) on delete cascade,
  delivery uuid not null references deliveries (id) on delete cascade,
  amount numeric not null check (amount >= 0),
  "platformFee" numeric not null check ("platformFee" >= 0),
  "payoutAmount" numeric not null check ("payoutAmount" >= 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists earnings_traveler_idx on earnings (traveler);
create index if not exists earnings_delivery_idx on earnings (delivery);

-- ------------------------------------------------------------
-- 10. trust_score_logs
-- ------------------------------------------------------------
create table if not exists trust_score_logs (
  id uuid primary key default gen_random_uuid(),
  traveler uuid not null references users (id) on delete cascade,
  score numeric not null check (score between 0 and 100),
  delta numeric not null,
  reason text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists trust_score_logs_traveler_idx on trust_score_logs (traveler);
