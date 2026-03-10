alter table public.funkcje
  add column if not exists osoba_zewnetrzna text;

comment on column public.funkcje.osoba_zewnetrzna is
  'Imię i nazwisko osoby spoza aplikacji przypisanej do funkcji liturgicznej.';
