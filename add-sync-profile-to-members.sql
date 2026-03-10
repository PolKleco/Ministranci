-- =============================================
-- SYNC: profile (imie/nazwisko/email) -> parafia_members
-- =============================================
-- Problem: po zmianie danych w profilu ministranta, lista u księdza
-- (oparta o parafia_members) mogła pokazywać stare dane.

create or replace function public.sync_profile_to_parafia_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.parafia_members
  set
    imie = new.imie,
    nazwisko = new.nazwisko,
    email = new.email
  where profile_id = new.id;

  return new;
end;
$$;

drop trigger if exists on_profile_updated_sync_member_data on public.profiles;

create trigger on_profile_updated_sync_member_data
  after update of imie, nazwisko, email on public.profiles
  for each row
  when (
    old.imie is distinct from new.imie
    or old.nazwisko is distinct from new.nazwisko
    or old.email is distinct from new.email
  )
  execute function public.sync_profile_to_parafia_members();

-- Jednorazowe wyrównanie historycznych rozjazdów
update public.parafia_members pm
set
  imie = p.imie,
  nazwisko = p.nazwisko,
  email = p.email
from public.profiles p
where p.id = pm.profile_id
  and (
    pm.imie is distinct from p.imie
    or pm.nazwisko is distinct from p.nazwisko
    or pm.email is distinct from p.email
  );
