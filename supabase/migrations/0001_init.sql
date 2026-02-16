-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

