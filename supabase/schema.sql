create table records (
  id          text primary key default gen_random_uuid()::text,
  artist      text not null,
  title       text not null,
  year        int,
  genre       text,
  owned       boolean not null default true,
  priority    boolean not null default false,
  img         text,
  created_at  timestamptz not null default now()
);

alter table records enable row level security;

-- Anyone can read
create policy "Public read"
  on records for select
  using (true);

-- Only the owner's Google account can write
-- Replace OWNER_EMAIL with your actual Google email address
create policy "Owner write"
  on records for all
  using  (auth.email() = 'OWNER_EMAIL')
  with check (auth.email() = 'OWNER_EMAIL');
