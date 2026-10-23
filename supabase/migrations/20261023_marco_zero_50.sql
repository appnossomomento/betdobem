create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_name text := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Jogador');
  initials text;
begin
  initials := upper(left(regexp_replace(raw_name, '[^A-Za-zÀ-ÿ]', '', 'g') || 'XX', 2));
  insert into public.profiles (id, display_name, initials)
  values (new.id, raw_name, initials)
  on conflict (id) do nothing;
  insert into public.ledger (user_id, kind, amount, week_key)
  values (new.id, 'marco_zero', 50, to_char(timezone('America/Sao_Paulo', now()), '"W"IW-IYYY'));
  return new;
end;
$$;
