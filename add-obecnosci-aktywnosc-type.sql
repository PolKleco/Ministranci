alter table public.obecnosci
  drop constraint if exists obecnosci_typ_check;

alter table public.obecnosci
  add constraint obecnosci_typ_check
  check (typ in ('msza', 'nabożeństwo', 'wydarzenie', 'aktywnosc'));
