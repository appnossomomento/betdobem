alter table public.profiles add column if not exists nick text;
alter table public.profiles add column if not exists age int;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists favorite_team text;
alter table public.profiles add column if not exists bottom_size text;
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.bet_legs add column if not exists competition text;

create unique index if not exists profiles_nick_lower_idx on public.profiles (lower(nick));

update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'wellerson.lima96@gmail.com');
