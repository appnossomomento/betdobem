alter table public.profiles add column if not exists cpf text;

create unique index if not exists profiles_cpf_idx on public.profiles (cpf) where cpf is not null and cpf <> '';
