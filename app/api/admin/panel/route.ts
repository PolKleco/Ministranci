import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

type AdminAction =
  | 'loadStats'
  | 'loadParafie'
  | 'loadProfiles'
  | 'loadMembers'
  | 'loadWatki'
  | 'loadPunktacja'
  | 'loadRangi'
  | 'loadOdznaki'
  | 'loadBanery'
  | 'saveBanery'
  | 'findParafiaByCode'
  | 'updateParafia'
  | 'deleteProfile'
  | 'updateProfileType'
  | 'updateMemberGroup'
  | 'deleteMember'
  | 'sendAnnouncement'
  | 'updateAnnouncement'
  | 'deleteWatek'
  | 'updatePunktacjaValue'
  | 'toggleOdznaka'
  | 'fetchRabaty'
  | 'createRabat'
  | 'deleteRabat'
  | 'publishKsiadzPanelTemplate';

type AdminBody = {
  action: AdminAction;
  payload?: Record<string, unknown>;
};

type KsiadzTemplate = {
  parafia: {
    grupy: unknown;
    funkcje_config: unknown;
  };
  poslugi: Array<{
    slug: string;
    nazwa: string;
    opis: string;
    emoji: string;
    kolor: string;
    kolejnosc: number;
    obrazek_url: string | null;
    dlugi_opis: string | null;
    zdjecia: string[] | null;
    youtube_url: string | null;
  }>;
  punktacja: Array<{ klucz: string; wartosc: number; opis: string }>;
  rangi: Array<{ nazwa: string; min_pkt: number; kolor: string; kolejnosc: number }>;
  odznaki: Array<{ nazwa: string; opis: string; warunek_typ: string; warunek_wartosc: number; bonus_pkt: number; aktywna: boolean }>;
  modlitwy: {
    przed: string;
    po: string;
    lacina: string;
  };
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const allowedAdminEmails = (process.env.INTERNAL_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function isAllowedAdmin(email?: string | null) {
  if (!email) return false;
  return allowedAdminEmails.includes(email.toLowerCase());
}

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function asOptionalString(value: unknown) {
  if (typeof value !== 'string') return null;
  return value;
}

function asNumber(value: unknown) {
  if (typeof value === 'number') return value;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

function normalizeFunkcjaKey(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function toFunkcjaId(value: string) {
  const base = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-ząćęłńóśźż0-9_]/gi, '');
  return base || 'funkcja';
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAllowedAdmin(authUser.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as AdminBody;
    const { action, payload = {} } = body;

    switch (action) {
      case 'loadStats': {
        const [p, pr, ob, w] = await Promise.all([
          supabaseAdmin.from('parafie').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('profiles').select('id, typ', { count: 'exact' }),
          supabaseAdmin
            .from('obecnosci')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          supabaseAdmin.from('tablica_watki').select('id', { count: 'exact', head: true }),
        ]);

        if (p.error || pr.error || ob.error || w.error) {
          const error = p.error || pr.error || ob.error || w.error;
          return NextResponse.json({ error: error?.message || 'Failed to load stats' }, { status: 500 });
        }

        const allProfiles = pr.data || [];
        const stats = {
          parafie: p.count || 0,
          profiles: pr.count || 0,
          ministranci: allProfiles.filter((x) => x.typ === 'ministrant').length,
          ksieza: allProfiles.filter((x) => x.typ === 'ksiadz').length,
          obecnosci30: ob.count || 0,
          watki: w.count || 0,
        };

        return NextResponse.json({ ok: true, data: stats });
      }

      case 'loadParafie': {
        const { data, error } = await supabaseAdmin.from('parafie').select('*').order('created_at', { ascending: false });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, data: data || [] });
      }

      case 'loadProfiles': {
        const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, data: data || [] });
      }

      case 'loadMembers': {
        const parafiaId = asString(payload.parafiaId);
        if (!parafiaId) return NextResponse.json({ error: 'parafiaId is required' }, { status: 400 });
        const { data, error } = await supabaseAdmin.from('parafia_members').select('*').eq('parafia_id', parafiaId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, data: data || [] });
      }

      case 'loadWatki': {
        const parafiaId = asOptionalString(payload.parafiaId);
        let query = supabaseAdmin.from('tablica_watki').select('*').order('created_at', { ascending: false });
        if (parafiaId) query = query.eq('parafia_id', parafiaId);
        const { data, error } = await query.limit(50);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, data: data || [] });
      }

      case 'loadPunktacja': {
        const parafiaId = asOptionalString(payload.parafiaId);
        let query = supabaseAdmin.from('punktacja_config').select('*');
        if (parafiaId) query = query.eq('parafia_id', parafiaId);
        const { data, error } = await query.order('klucz');
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, data: data || [] });
      }

      case 'loadRangi': {
        const parafiaId = asOptionalString(payload.parafiaId);
        let query = supabaseAdmin.from('rangi_config').select('*');
        if (parafiaId) query = query.eq('parafia_id', parafiaId);
        const { data, error } = await query.order('kolejnosc');
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, data: data || [] });
      }

      case 'loadOdznaki': {
        const parafiaId = asOptionalString(payload.parafiaId);
        let query = supabaseAdmin.from('odznaki_config').select('*');
        if (parafiaId) query = query.eq('parafia_id', parafiaId);
        const { data, error } = await query.order('nazwa');
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, data: data || [] });
      }

      case 'loadBanery': {
        const { data, error } = await supabaseAdmin
          .from('app_config')
          .select('*')
          .in('klucz', [
            'baner_powitalny_v2',
            'baner_ministrant_aktywny',
            'baner_ministrant_tytul',
            'baner_ministrant_opis',
            'baner_ksiadz_aktywny',
            'baner_ksiadz_tytul',
            'baner_ksiadz_opis',
          ]);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, data: data || [] });
      }

      case 'saveBanery': {
        const rows = payload.rows as Array<{ klucz: string; wartosc: string }> | undefined;
        if (!rows || !Array.isArray(rows)) return NextResponse.json({ error: 'rows are required' }, { status: 400 });
        for (const row of rows) {
          const { error } = await supabaseAdmin.from('app_config').upsert(row, { onConflict: 'klucz' });
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true });
      }

      case 'findParafiaByCode': {
        const code = asString(payload.kodParafii).trim();
        if (!code) return NextResponse.json({ error: 'kodParafii is required' }, { status: 400 });
        const { data, error } = await supabaseAdmin.from('parafie').select('*').eq('kod_zaproszenia', code).single();
        if (error) return NextResponse.json({ ok: true, data: null });
        return NextResponse.json({ ok: true, data });
      }

      case 'updateParafia': {
        const id = asString(payload.id);
        const nazwa = asString(payload.nazwa);
        const miasto = asString(payload.miasto);
        const adres = asString(payload.adres);
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

        const { error } = await supabaseAdmin.from('parafie').update({ nazwa, miasto, adres }).eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }

      case 'deleteProfile': {
        const id = asString(payload.id);
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
        if (id === authUser.id) {
          return NextResponse.json({ error: 'Nie mozna usunac wlasnego konta z panelu' }, { status: 400 });
        }

        const deleteSteps: Array<{ label: string; run: () => PromiseLike<{ error: { message: string } | null }> }> = [
          { label: 'ankiety_odpowiedzi', run: () => supabaseAdmin.from('ankiety_odpowiedzi').delete().eq('respondent_id', id) },
          { label: 'tablica_przeczytane', run: () => supabaseAdmin.from('tablica_przeczytane').delete().eq('user_id', id) },
          { label: 'tablica_wiadomosci', run: () => supabaseAdmin.from('tablica_wiadomosci').delete().eq('autor_id', id) },
          { label: 'tablica_watki', run: () => supabaseAdmin.from('tablica_watki').delete().eq('autor_id', id) },
          { label: 'powiadomienia', run: () => supabaseAdmin.from('powiadomienia').delete().eq('odbiorca_id', id) },
          { label: 'push_subscriptions', run: () => supabaseAdmin.from('push_subscriptions').delete().eq('user_id', id) },
          { label: 'odznaki_zdobyte', run: () => supabaseAdmin.from('odznaki_zdobyte').delete().eq('ministrant_id', id) },
          { label: 'ranking', run: () => supabaseAdmin.from('ranking').delete().eq('ministrant_id', id) },
          { label: 'minusowe_punkty', run: () => supabaseAdmin.from('minusowe_punkty').delete().eq('ministrant_id', id) },
          { label: 'obecnosci', run: () => supabaseAdmin.from('obecnosci').delete().eq('ministrant_id', id) },
          { label: 'dyzury', run: () => supabaseAdmin.from('dyzury').delete().eq('ministrant_id', id) },
          { label: 'funkcje', run: () => supabaseAdmin.from('funkcje').delete().eq('ministrant_id', id) },
          { label: 'parafia_members', run: () => supabaseAdmin.from('parafia_members').delete().eq('profile_id', id) },
          { label: 'profiles', run: () => supabaseAdmin.from('profiles').delete().eq('id', id) },
        ];

        for (const step of deleteSteps) {
          const { error } = await step.run();
          if (error) {
            return NextResponse.json({ error: `${step.label}: ${error.message}` }, { status: 500 });
          }
        }

        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (authDeleteError && !authDeleteError.message.toLowerCase().includes('not found')) {
          return NextResponse.json(
            { error: `auth.users: ${authDeleteError.message}`, partial: true },
            { status: 500 }
          );
        }

        return NextResponse.json({ ok: true });
      }

      case 'updateProfileType': {
        const id = asString(payload.id);
        const typ = asString(payload.typ);
        if (!id || (typ !== 'ksiadz' && typ !== 'ministrant')) {
          return NextResponse.json({ error: 'id and valid typ are required' }, { status: 400 });
        }
        const { error } = await supabaseAdmin.from('profiles').update({ typ }).eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }

      case 'updateMemberGroup': {
        const memberId = asString(payload.memberId);
        const grupa = payload.grupa === null ? null : asString(payload.grupa);
        if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
        const { error } = await supabaseAdmin.from('parafia_members').update({ grupa }).eq('id', memberId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }

      case 'deleteMember': {
        const memberId = asString(payload.memberId);
        if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
        const { error } = await supabaseAdmin.from('parafia_members').delete().eq('id', memberId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }

      case 'sendAnnouncement': {
        const scope = asString(payload.scope);
        const tresc = asString(payload.tresc);
        const grupaDocelowa = asString(payload.grupaDocelowa) || 'wszyscy';
        if (!tresc) return NextResponse.json({ error: 'tresc is required' }, { status: 400 });

        const plainText = tresc.replace(/<[^>]*>/g, '').trim();
        const tytul = plainText ? `[ADMIN] ${plainText.substring(0, 50)}${plainText.length > 50 ? '...' : ''}` : '[ADMIN] Ogloszenie';

        if (scope === 'global') {
          const { data: allParafie, error: fetchErr } = await supabaseAdmin.from('parafie').select('id, admin_id');
          if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

          if (allParafie && allParafie.length > 0) {
            const inserts = allParafie.map((p) => ({
              parafia_id: p.id,
              autor_id: p.admin_id,
              tytul,
              tresc,
              kategoria: 'ogłoszenie',
              grupa_docelowa: grupaDocelowa,
              przypiety: true,
            }));
            const { error } = await supabaseAdmin.from('tablica_watki').insert(inserts);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ ok: true, data: { count: allParafie.length } });
          }
          return NextResponse.json({ ok: true, data: { count: 0 } });
        }

        if (scope === 'parafia') {
          const parafiaId = asString(payload.parafiaId);
          const autorId = asString(payload.autorId);
          if (!parafiaId || !autorId) {
            return NextResponse.json({ error: 'parafiaId and autorId are required' }, { status: 400 });
          }
          const { error } = await supabaseAdmin.from('tablica_watki').insert({
            parafia_id: parafiaId,
            autor_id: autorId,
            tytul,
            tresc,
            kategoria: 'ogłoszenie',
            grupa_docelowa: grupaDocelowa,
            przypiety: true,
          });
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
          return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
      }

      case 'updateAnnouncement': {
        const id = asString(payload.id);
        const tresc = asString(payload.tresc);
        const grupaDocelowa = asString(payload.grupaDocelowa) || 'wszyscy';
        if (!id || !tresc) return NextResponse.json({ error: 'id and tresc are required' }, { status: 400 });

        const plainText = tresc.replace(/<[^>]*>/g, '').trim();
        const tytul = plainText ? `[ADMIN] ${plainText.substring(0, 50)}${plainText.length > 50 ? '...' : ''}` : '[ADMIN] Ogloszenie';

        const { error } = await supabaseAdmin
          .from('tablica_watki')
          .update({ tytul, tresc, grupa_docelowa: grupaDocelowa })
          .eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ ok: true });
      }

      case 'deleteWatek': {
        const id = asString(payload.id);
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
        const { error } = await supabaseAdmin.from('tablica_watki').delete().eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }

      case 'updatePunktacjaValue': {
        const scope = asString(payload.scope);
        const wartosc = asNumber(payload.wartosc);
        if (!Number.isFinite(wartosc)) return NextResponse.json({ error: 'wartosc is invalid' }, { status: 400 });

        if (scope === 'global') {
          const klucz = asString(payload.klucz);
          if (!klucz) return NextResponse.json({ error: 'klucz is required for global mode' }, { status: 400 });
          const { error } = await supabaseAdmin.from('punktacja_config').update({ wartosc }).eq('klucz', klucz);
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
          return NextResponse.json({ ok: true });
        }

        const id = asString(payload.id);
        if (!id) return NextResponse.json({ error: 'id is required for parish mode' }, { status: 400 });
        const { error } = await supabaseAdmin.from('punktacja_config').update({ wartosc }).eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }

      case 'toggleOdznaka': {
        const id = asString(payload.id);
        const aktywna = Boolean(payload.aktywna);
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
        const { error } = await supabaseAdmin.from('odznaki_config').update({ aktywna: !aktywna }).eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }

      case 'fetchRabaty': {
        const { data, error } = await supabaseAdmin.from('rabaty').select('*');
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, data: data || [] });
      }

      case 'createRabat': {
        const kod = asString(payload.kod);
        const procentZnizki = asNumber(payload.procent_znizki);
        const maxUzyc = asNumber(payload.max_uzyc);
        const waznyDo = asOptionalString(payload.wazny_do);

        if (!kod || !Number.isFinite(procentZnizki) || !Number.isFinite(maxUzyc)) {
          return NextResponse.json({ error: 'Invalid rabat payload' }, { status: 400 });
        }

        const { error } = await supabaseAdmin.from('rabaty').insert({
          kod,
          procent_znizki: procentZnizki,
          max_uzyc: maxUzyc,
          wazny_do: waznyDo || null,
          jednorazowy: maxUzyc === 1,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }

      case 'deleteRabat': {
        const id = asString(payload.id);
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
        const { error } = await supabaseAdmin.from('rabaty').delete().eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }

      case 'publishKsiadzPanelTemplate': {
        const sourceParafiaId = asString(payload.sourceParafiaId);
        const scope = asString(payload.scope);
        const targetParafiaIds = asStringArray(payload.targetParafiaIds);

        if (!sourceParafiaId) return NextResponse.json({ error: 'sourceParafiaId is required' }, { status: 400 });
        if (scope !== 'all' && scope !== 'new' && scope !== 'specific') {
          return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
        }
        if (scope === 'specific' && targetParafiaIds.length === 0) {
          return NextResponse.json({ error: 'targetParafiaIds are required for specific scope' }, { status: 400 });
        }

        const [{ data: sourceParafia, error: sourceParafiaError }, poslugiRes, punktacjaRes, rangiRes, odznakiRes, modlitwyRes, sluzbyRes] = await Promise.all([
          supabaseAdmin.from('parafie').select('grupy, funkcje_config').eq('id', sourceParafiaId).single(),
          supabaseAdmin
            .from('poslugi')
            .select('slug, nazwa, opis, emoji, kolor, kolejnosc, obrazek_url, dlugi_opis, zdjecia, youtube_url')
            .eq('parafia_id', sourceParafiaId)
            .order('kolejnosc'),
          supabaseAdmin
            .from('punktacja_config')
            .select('klucz, wartosc, opis')
            .eq('parafia_id', sourceParafiaId)
            .order('klucz'),
          supabaseAdmin
            .from('rangi_config')
            .select('nazwa, min_pkt, kolor, kolejnosc')
            .eq('parafia_id', sourceParafiaId)
            .order('kolejnosc'),
          supabaseAdmin
            .from('odznaki_config')
            .select('nazwa, opis, warunek_typ, warunek_wartosc, bonus_pkt, aktywna')
            .eq('parafia_id', sourceParafiaId)
            .order('nazwa'),
          supabaseAdmin
            .from('app_config')
            .select('klucz, wartosc')
            .in('klucz', [
              `modlitwa_przed_${sourceParafiaId}`,
              `modlitwa_po_${sourceParafiaId}`,
              `modlitwa_lacina_${sourceParafiaId}`,
            ]),
          supabaseAdmin
            .from('sluzby')
            .select('id')
            .eq('parafia_id', sourceParafiaId),
        ]);

        const sourceError = sourceParafiaError || poslugiRes.error || punktacjaRes.error || rangiRes.error || odznakiRes.error || modlitwyRes.error || sluzbyRes.error;
        if (sourceError) return NextResponse.json({ error: sourceError.message }, { status: 500 });
        if (!sourceParafia) return NextResponse.json({ error: 'Source parish not found' }, { status: 404 });

        const sourceFunkcjeConfigRaw = Array.isArray(sourceParafia.funkcje_config)
          ? sourceParafia.funkcje_config.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          : [];
        const sourceSluzbyIds = (sluzbyRes.data || []).map((row) => asString(row.id)).filter(Boolean);
        let sourceEventFunctionTypes: string[] = [];
        if (sourceSluzbyIds.length > 0) {
          const { data: funkcjeRows, error: funkcjeError } = await supabaseAdmin
            .from('funkcje')
            .select('typ')
            .in('sluzba_id', sourceSluzbyIds);
          if (funkcjeError) return NextResponse.json({ error: funkcjeError.message }, { status: 500 });
          sourceEventFunctionTypes = Array.from(new Set((funkcjeRows || []).map((row) => asString(row.typ)).filter(Boolean)));
        }

        const existingNameKeys = new Set(
          sourceFunkcjeConfigRaw
            .map((row) => normalizeFunkcjaKey(asString(row.nazwa)))
            .filter(Boolean)
        );
        const existingIds = new Set(
          sourceFunkcjeConfigRaw
            .map((row) => asString(row.id))
            .filter(Boolean)
        );

        const recoveredFunkcjeConfig = sourceEventFunctionTypes
          .filter((name) => !existingNameKeys.has(normalizeFunkcjaKey(name)))
          .map((nazwa) => {
            const baseId = toFunkcjaId(nazwa);
            let nextId = baseId;
            let suffix = 2;
            while (existingIds.has(nextId)) {
              nextId = `${baseId}_${suffix}`;
              suffix += 1;
            }
            existingIds.add(nextId);
            existingNameKeys.add(normalizeFunkcjaKey(nazwa));
            return {
              id: nextId,
              nazwa,
              opis: '',
              emoji: '⭐',
              kolor: 'gray',
            };
          });

        const mergedFunkcjeConfig = [...sourceFunkcjeConfigRaw, ...recoveredFunkcjeConfig];
        if (recoveredFunkcjeConfig.length > 0) {
          const { error: syncSourceFunkcjeError } = await supabaseAdmin
            .from('parafie')
            .update({ funkcje_config: mergedFunkcjeConfig })
            .eq('id', sourceParafiaId);
          if (syncSourceFunkcjeError) {
            return NextResponse.json({ error: syncSourceFunkcjeError.message }, { status: 500 });
          }
        }

        const modlitwyRows = modlitwyRes.data || [];
        const getModlitwa = (key: string) => modlitwyRows.find((row) => row.klucz === key)?.wartosc || '';

        const template: KsiadzTemplate = {
          parafia: {
            grupy: sourceParafia.grupy ?? null,
            funkcje_config: mergedFunkcjeConfig,
          },
          poslugi: (poslugiRes.data || []).map((row) => ({
            slug: asString(row.slug),
            nazwa: asString(row.nazwa),
            opis: asString(row.opis),
            emoji: asString(row.emoji) || '⭐',
            kolor: asString(row.kolor) || 'gray',
            kolejnosc: Number.isFinite(Number(row.kolejnosc)) ? Number(row.kolejnosc) : 0,
            obrazek_url: asOptionalString(row.obrazek_url),
            dlugi_opis: asOptionalString(row.dlugi_opis),
            zdjecia: Array.isArray(row.zdjecia) ? row.zdjecia.filter((x): x is string => typeof x === 'string') : null,
            youtube_url: asOptionalString(row.youtube_url),
          })),
          punktacja: (punktacjaRes.data || []).map((row) => ({
            klucz: asString(row.klucz),
            wartosc: Number.isFinite(Number(row.wartosc)) ? Number(row.wartosc) : 0,
            opis: asString(row.opis),
          })),
          rangi: (rangiRes.data || []).map((row) => ({
            nazwa: asString(row.nazwa),
            min_pkt: Number.isFinite(Number(row.min_pkt)) ? Number(row.min_pkt) : 0,
            kolor: asString(row.kolor),
            kolejnosc: Number.isFinite(Number(row.kolejnosc)) ? Number(row.kolejnosc) : 0,
          })),
          odznaki: (odznakiRes.data || []).map((row) => ({
            nazwa: asString(row.nazwa),
            opis: asString(row.opis),
            warunek_typ: asString(row.warunek_typ),
            warunek_wartosc: Number.isFinite(Number(row.warunek_wartosc)) ? Number(row.warunek_wartosc) : 0,
            bonus_pkt: Number.isFinite(Number(row.bonus_pkt)) ? Number(row.bonus_pkt) : 0,
            aktywna: Boolean(row.aktywna),
          })),
          modlitwy: {
            przed: getModlitwa(`modlitwa_przed_${sourceParafiaId}`),
            po: getModlitwa(`modlitwa_po_${sourceParafiaId}`),
            lacina: getModlitwa(`modlitwa_lacina_${sourceParafiaId}`),
          },
        };

        if (scope === 'new') {
          const { error } = await supabaseAdmin.from('app_config').upsert(
            { klucz: 'ksiadz_panel_template_default', wartosc: JSON.stringify(template) },
            { onConflict: 'klucz' }
          );
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
          return NextResponse.json({ ok: true, data: { affected: 0 } });
        }

        let targetIds = targetParafiaIds;
        if (scope === 'all') {
          const { data, error } = await supabaseAdmin.from('parafie').select('id');
          if (error) return NextResponse.json({ error: error.message }, { status: 500 });
          targetIds = (data || []).map((row) => row.id).filter(Boolean);
        }

        const uniqueTargetIds = Array.from(new Set(targetIds));
        if (uniqueTargetIds.length === 0) {
          return NextResponse.json({ error: 'No target parishes found' }, { status: 400 });
        }

        const applyTemplateToParafia = async (parafiaId: string) => {
          const { error: parafiaUpdateError } = await supabaseAdmin
            .from('parafie')
            .update({
              grupy: template.parafia.grupy,
              funkcje_config: template.parafia.funkcje_config,
            })
            .eq('id', parafiaId);
          if (parafiaUpdateError) throw new Error(`parafie: ${parafiaUpdateError.message}`);

          const replaceRows = async (table: 'poslugi' | 'punktacja_config' | 'rangi_config' | 'odznaki_config', rows: Record<string, unknown>[]) => {
            const { error: deleteError } = await supabaseAdmin.from(table).delete().eq('parafia_id', parafiaId);
            if (deleteError) throw new Error(`${table} delete: ${deleteError.message}`);
            if (rows.length === 0) return;
            const { error: insertError } = await supabaseAdmin.from(table).insert(rows);
            if (insertError) throw new Error(`${table} insert: ${insertError.message}`);
          };

          await replaceRows('poslugi', template.poslugi.map((row) => ({
            id: crypto.randomUUID(),
            parafia_id: parafiaId,
            slug: row.slug,
            nazwa: row.nazwa,
            opis: row.opis,
            emoji: row.emoji,
            kolor: row.kolor,
            kolejnosc: row.kolejnosc,
            obrazek_url: row.obrazek_url,
            dlugi_opis: row.dlugi_opis || '',
            zdjecia: row.zdjecia || [],
            youtube_url: row.youtube_url || '',
          })));

          await replaceRows('punktacja_config', template.punktacja.map((row) => ({
            id: crypto.randomUUID(),
            parafia_id: parafiaId,
            klucz: row.klucz,
            wartosc: row.wartosc,
            opis: row.opis,
          })));

          await replaceRows('rangi_config', template.rangi.map((row) => ({
            id: crypto.randomUUID(),
            parafia_id: parafiaId,
            nazwa: row.nazwa,
            min_pkt: row.min_pkt,
            kolor: row.kolor,
            kolejnosc: row.kolejnosc,
          })));

          await replaceRows('odznaki_config', template.odznaki.map((row) => ({
            id: crypto.randomUUID(),
            parafia_id: parafiaId,
            nazwa: row.nazwa,
            opis: row.opis,
            warunek_typ: row.warunek_typ,
            warunek_wartosc: row.warunek_wartosc,
            bonus_pkt: row.bonus_pkt,
            aktywna: row.aktywna,
          })));

          const configRows = [
            { klucz: `modlitwa_przed_${parafiaId}`, wartosc: template.modlitwy.przed },
            { klucz: `modlitwa_po_${parafiaId}`, wartosc: template.modlitwy.po },
            { klucz: `modlitwa_lacina_${parafiaId}`, wartosc: template.modlitwy.lacina },
          ];
          const { error: modlitwyUpsertError } = await supabaseAdmin.from('app_config').upsert(configRows, { onConflict: 'klucz' });
          if (modlitwyUpsertError) throw new Error(`app_config modlitwy: ${modlitwyUpsertError.message}`);
        };

        try {
          for (const targetId of uniqueTargetIds) {
            await applyTemplateToParafia(targetId);
          }
        } catch (applyError) {
          return NextResponse.json(
            { error: applyError instanceof Error ? applyError.message : 'Failed to publish template' },
            { status: 500 }
          );
        }

        return NextResponse.json({ ok: true, data: { affected: uniqueTargetIds.length } });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('Admin panel API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
