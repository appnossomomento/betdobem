-- Lucro acumulado na plataforma (semanas fechadas). Pode ficar negativo.
-- A carteira da semana continua em ledger e nunca abaixo de zero.

alter table public.profiles
  add column if not exists saldo_total numeric(12, 2) not null default 0;

update public.profiles as person
set saldo_total = coalesce((
  select round(sum(week.capital - 50), 2)
  from public.week_capitals as week
  where week.user_id = person.id
), 0);

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
  new.saldo_total := old.saldo_total;
  return new;
end;
$$;
