-- Polls: supports both lobs and trips (one of lob_id or trip_id must be set)
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  lob_id uuid references lobs(id) on delete cascade,
  trip_id uuid references trips(id) on delete cascade,
  created_by uuid references auth.users(id) on delete cascade not null,
  question text not null,
  created_at timestamptz default now() not null,
  constraint polls_has_parent check (
    (lob_id is not null)::int + (trip_id is not null)::int = 1
  )
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade not null,
  label text not null,
  order_index int not null default 0
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_option_id uuid references poll_options(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  constraint poll_votes_unique unique (poll_option_id, user_id)
);

-- RLS
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;

create policy "polls_select" on polls for select using (auth.uid() is not null);
create policy "polls_insert" on polls for insert with check (auth.uid() = created_by);
create policy "polls_delete" on polls for delete using (auth.uid() = created_by);

create policy "poll_options_select" on poll_options for select using (auth.uid() is not null);
create policy "poll_options_insert" on poll_options for insert with check (auth.uid() is not null);
create policy "poll_options_delete" on poll_options for delete using (
  auth.uid() = (select created_by from polls where id = poll_options.poll_id)
);

create policy "poll_votes_select" on poll_votes for select using (auth.uid() is not null);
create policy "poll_votes_insert" on poll_votes for insert with check (auth.uid() = user_id);
create policy "poll_votes_delete" on poll_votes for delete using (auth.uid() = user_id);
