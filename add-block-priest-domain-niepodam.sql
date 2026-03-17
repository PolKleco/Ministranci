-- =============================================
-- BLOKADA: rejestracja księdza z domeną @niepodam.pl
-- =============================================
-- Twarda blokada na poziomie auth.users (nie da się obejść frontendem).

create or replace function public.block_priest_signup_for_blocked_domains()
returns trigger
language plpgsql
as $$
declare
  v_user_type text;
  v_email_domain text;
begin
  v_user_type := lower(coalesce(new.raw_user_meta_data->>'typ', ''));
  v_email_domain := lower(split_part(coalesce(new.email, ''), '@', 2));

  if v_user_type = 'ksiadz' and v_email_domain = 'niepodam.pl' then
    raise exception using
      errcode = '23514',
      message = 'Rejestracja księdza z domeną @niepodam.pl jest zablokowana.';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_block_priest_blocked_domains on auth.users;

create trigger on_auth_user_block_priest_blocked_domains
before insert on auth.users
for each row
execute function public.block_priest_signup_for_blocked_domains();
