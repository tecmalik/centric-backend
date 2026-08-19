-- Centric Backend MVP — Supabase schema
-- Run this file in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- RLS is DISABLED for the hackathon MVP so the publishable key can read/write freely.

-- ============================= users =============================
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

alter table users disable row level security;

-- ========================= traveler_profiles ======================
create table if not exists traveler_profiles (
  id uuid primary key default gen_random_uuid(),
  "user" uuid not null unique references users(id) on delete cascade,
  "isVerified" boolean not null default false,
  "verificationDetails" jsonb,
  "trustScore" numeric not null default 50 check ("trustScore" >= 0 and "trustScore" <= 100),
  "completedDeliveries" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table traveler_profiles disable row level security;

-- ============================= journeys ===========================
create table if not exists journeys (
  id uuid primary key default gen_random_uuid(),
  "user" uuid not null references users(id) on delete cascade,
  origin jsonb not null,
  destination jsonb not null,
  "departureTime" timestamptz not null,
  "availableCapacity" numeric not null check ("availableCapacity" >= 0),
  status text not null default 'CREATED'
    check (status in ('CREATED', 'MATCHED', 'COMPLETED', 'CANCELLED')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_journeys_status_departure on journeys (status, "departureTime");
alter table journeys disable row level security;

-- ============================= packages ===========================
create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  "user" uuid not null references users(id) on delete cascade,
  "pickupLocation" jsonb not null,
  destination jsonb not null,
  description text not null,
  category text not null,
  weight numeric not null check (weight >= 0),
  "declaredValue" numeric not null check ("declaredValue" >= 0),
  recipient jsonb not null,
  status text not null default 'CREATED'
    check (status in ('CREATED', 'MATCHED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_packages_user on packages ("user");
create index if not exists idx_packages_status on packages (status);
alter table packages disable row level security;

-- ============================= matches ============================
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  package uuid not null references packages(id) on delete cascade,
  journey uuid not null references journeys(id) on delete cascade,
  "matchScore" numeric not null,
  "estimatedDetour" numeric not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  unique (package, journey)
);

create index if not exists idx_matches_package on matches (package);
create index if not exists idx_matches_journey on matches (journey);
alter table matches disable row level security;

-- ============================ deliveries ==========================
create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  package uuid not null unique references packages(id) on delete cascade,
  journey uuid not null references journeys(id) on delete cascade,
  traveler uuid not null references users(id) on delete cascade,
  sender uuid not null references users(id) on delete cascade,
  status text not null default 'ASSIGNED'
    check (status in ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED')),
  otp text not null,
  "otpExpiresAt" timestamptz not null,
  "otpFailedAttempts" integer not null default 0,
  "pickupEvidence" jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_deliveries_traveler on deliveries (traveler);
create index if not exists idx_deliveries_sender on deliveries (sender);
alter table deliveries disable row level security;

-- ============================= evidence ===========================
create table if not exists evidence (
  id uuid primary key default gen_random_uuid(),
  delivery uuid not null references deliveries(id) on delete cascade,
  "photoUrl" text not null,
  timestamp timestamptz not null default now(),
  gps jsonb not null,
  note text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_evidence_delivery on evidence (delivery);
alter table evidence disable row level security;

-- =========================== verifications ========================
create table if not exists verifications (
  id uuid primary key default gen_random_uuid(),
  "user" uuid not null unique references users(id) on delete cascade,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'VERIFIED', 'REJECTED')),
  "documentType" text not null,
  "documentNumber" text not null,
  "verifiedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table verifications disable row level security;

-- ========================= trust_score_logs =======================
create table if not exists trust_score_logs (
  id uuid primary key default gen_random_uuid(),
  traveler uuid not null references users(id) on delete cascade,
  score numeric not null check (score >= 0 and score <= 100),
  delta numeric not null,
  reason text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_trust_logs_traveler on trust_score_logs (traveler);
alter table trust_score_logs disable row level security;

-- ============================= earnings ===========================
create table if not exists earnings (
  id uuid primary key default gen_random_uuid(),
  traveler uuid not null references users(id) on delete cascade,
  delivery uuid not null references deliveries(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  "platformFee" numeric not null check ("platformFee" >= 0),
  "payoutAmount" numeric not null check ("payoutAmount" >= 0),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'PAID')),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_earnings_traveler on earnings (traveler);
alter table earnings disable row level security;