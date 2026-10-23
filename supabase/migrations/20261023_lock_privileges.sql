-- Saldo, patrimônio e VIP não podem ser gravados pelo client.
-- O papel authenticated só lê o ledger e os capitais. VIP, admin e suspensão
-- só mudam quando a sessão é service_role (ações de admin e jobs).

alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists banned_at timestamptz;

revoke update on table public.profiles from anon, authenticated;
revoke insert, update, delete on table public.ledger from anon, authenticated;
revoke insert, update, delete on table public.week_capitals from anon, authenticated;
revoke insert, update, delete on table public.month_capitals from anon, authenticated;
revoke insert, update, delete on table public.league_capital_events from anon, authenticated;
revoke insert, update, delete on table public.bets from anon, authenticated;
revoke insert, update, delete on table public.bet_legs from anon, authenticated;

grant select on table public.ledger to authenticated;
grant select on table public.week_capitals to authenticated;
grant select on table public.month_capitals to authenticated;
grant select on table public.bets to authenticated;
grant select on table public.bet_legs to authenticated;
grant select on table public.profiles to authenticated;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role')
     or coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  new.vip := old.vip;
  new.vip_until := old.vip_until;
  new.is_admin := old.is_admin;
  new.banned_at := old.banned_at;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();
