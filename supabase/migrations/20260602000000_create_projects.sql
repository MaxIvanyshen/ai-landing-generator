create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  prompt      text not null,
  draft       jsonb,
  html        text,
  status      text not null default 'pending',
  created_at  timestamptz not null default now()
);

alter table projects enable row level security;

create policy "users see own projects"
  on projects
  for all
  using (auth.uid() = user_id);
