import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { parafiaId } = await request.json();

    if (!parafiaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sprawdź czy requester jest adminem (księdzem) parafii
    const { data: parafia } = await supabaseAdmin
      .from('parafie')
      .select('admin_id')
      .eq('id', parafiaId)
      .single();

    if (!parafia || parafia.admin_id !== authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const runStep = async (label: string, action: () => Promise<{ error: { message: string } | null }>) => {
      const { error } = await action();
      if (error) {
        throw new Error(`${label}: ${error.message}`);
      }
    };

    // Pobierz wszystkich członków parafii (włącznie z księdzem)
    const { data: allMembers } = await supabaseAdmin
      .from('parafia_members')
      .select('profile_id')
      .eq('parafia_id', parafiaId);

    const profileIds = allMembers?.map(m => m.profile_id) || [];
    // Dodaj admina jeśli nie jest w members
    if (!profileIds.includes(authUser.id)) {
      profileIds.push(authUser.id);
    }

    // Wyczyść dane powiązane z profilami (tabele bez cascade na parafia_id)
    for (const profileId of profileIds) {
      await runStep(`delete ankiety_odpowiedzi for ${profileId}`, () =>
        supabaseAdmin.from('ankiety_odpowiedzi').delete().eq('respondent_id', profileId)
      );
      await runStep(`delete tablica_przeczytane for ${profileId}`, () =>
        supabaseAdmin.from('tablica_przeczytane').delete().eq('user_id', profileId)
      );
      await runStep(`delete push_subscriptions for ${profileId}`, () =>
        supabaseAdmin.from('push_subscriptions').delete().eq('user_id', profileId)
      );
    }

    // Wyczyść app_config powiązany z parafią
    await runStep('delete app_config', () =>
      supabaseAdmin.from('app_config').delete().like('klucz', `%${parafiaId}%`)
    );

    // Odepnij profiles od parafii (fk_parafia bez cascade)
    for (const profileId of profileIds) {
      await runStep(`detach profile ${profileId}`, () =>
        supabaseAdmin.from('profiles').update({ parafia_id: null }).eq('id', profileId)
      );
    }

    // Usuń parafię — cascade usunie: parafia_members, sluzby, funkcje, dyzury,
    // obecnosci, ranking, minusowe_punkty, punktacja_config, rangi_config,
    // odznaki_config, odznaki_zdobyte, harmonogram, tablica_watki, tablica_wiadomosci,
    // ankiety, powiadomienia, poslugi, szablony_wydarzen
    await runStep('delete parish', () =>
      supabaseAdmin.from('parafie').delete().eq('id', parafiaId)
    );

    // Usuń profile i konta auth wszystkich członków
    for (const profileId of profileIds) {
      await runStep(`delete profile ${profileId}`, () =>
        supabaseAdmin.from('profiles').delete().eq('id', profileId)
      );
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(profileId);
      if (authError) {
        throw new Error(`delete auth user ${profileId}: ${authError.message}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete parish error:', err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Server error',
      partial: true,
    }, { status: 500 });
  }
}
