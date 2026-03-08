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
  | 'deleteRabat';

type AdminBody = {
  action: AdminAction;
  payload?: Record<string, unknown>;
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
          .in('klucz', ['baner_ministrant_tytul', 'baner_ministrant_opis', 'baner_ksiadz_tytul', 'baner_ksiadz_opis']);
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

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('Admin panel API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
