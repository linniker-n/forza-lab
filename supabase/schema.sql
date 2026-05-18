create table if not exists public.saved_tunes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tune jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.saved_tunes enable row level security;

create policy "Users can read their saved tunes"
  on public.saved_tunes
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their saved tunes"
  on public.saved_tunes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their saved tunes"
  on public.saved_tunes
  for delete
  using (auth.uid() = user_id);
