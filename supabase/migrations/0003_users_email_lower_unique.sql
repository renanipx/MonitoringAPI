-- Enforce case-insensitive uniqueness for emails
create unique index if not exists users_email_lower_unique on public.users (lower(email));

