-- =============================================
-- JEDNA PARAFIA NA JEDEN EMAIL KSIĘDZA
-- =============================================
-- Ten skrypt blokuje tworzenie kolejnych parafii dla tego samego emaila admina.
-- Działa także wtedy, gdy w bazie istnieją już historyczne duplikaty.

create index if not exists parafie_admin_email_lower_idx
  on public.parafie (lower(trim(admin_email)));

create or replace function public.enforce_single_parafia_per_admin_email()
returns trigger
language plpgsql
as $$
begin
  new.admin_email := lower(trim(new.admin_email));

  if new.admin_email is null or new.admin_email = '' then
    raise exception using
      errcode = '23514',
      message = 'Adres email admina jest wymagany';
  end if;

  if exists (
    select 1
    from public.parafie p
    where lower(trim(p.admin_email)) = new.admin_email
      and p.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception using
      errcode = '23505',
      message = 'Ksiadz z tym adresem email ma juz parafie';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_single_parafia_per_admin_email on public.parafie;

create trigger trg_enforce_single_parafia_per_admin_email
before insert or update of admin_email on public.parafie
for each row
execute function public.enforce_single_parafia_per_admin_email();
