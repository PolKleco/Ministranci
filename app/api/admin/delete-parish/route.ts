import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { parafiaId, requesterId } = await request.json();

    if (!parafiaId || !requesterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sprawdź czy requester jest adminem (księdzem) parafii
    const { data: parafia } = await supabaseAdmin
      .from('parafie')
      .select('admin_id')
      .eq('id', parafiaId)
      .single();

    if (!parafia || parafia.admin_id !== requesterId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Pobierz wszystkich członków parafii (włącznie z księdzem)
    const { data: allMembers } = await supabaseAdmin
      .from('parafia_members')
      .select('profile_id')
      .eq('parafia_id', parafiaId);

    const profileIds = allMembers?.map(m => m.profile_id) || [];
    // Dodaj admina jeśli nie jest w members
    if (!profileIds.includes(requesterId)) {
      profileIds.push(requesterId);
    }

    // Wyczyść dane powiązane z profilami (tabele bez cascade na parafia_id)
    for (const profileId of profileIds) {
      await supabaseAdmin.from('ankiety_odpowiedzi').delete().eq('respondent_id', profileId);
      await supabaseAdmin.from('tablica_przeczytane').delete().eq('user_id', profileId);
      await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', profileId);
    }

    // Wyczyść app_config powiązany z parafią
    await supabaseAdmin.from('app_config').delete().like('klucz', `%${parafiaId}%`);

    // Odepnij profiles od parafii (fk_parafia bez cascade)
    for (const profileId of profileIds) {
      await supabaseAdmin.from('profiles').update({ parafia_id: null }).eq('id', profileId);
    }

    // Usuń parafię — cascade usunie: parafia_members, sluzby, funkcje, dyzury,
    // obecnosci, ranking, minusowe_punkty, punktacja_config, rangi_config,
    // odznaki_config, odznaki_zdobyte, harmonogram, tablica_watki, tablica_wiadomosci,
    // ankiety, powiadomienia, poslugi, szablony_wydarzen
    const { error: deleteParafiaError } = await supabaseAdmin
      .from('parafie')
      .delete()
      .eq('id', parafiaId);

    if (deleteParafiaError) {
      console.error('Error deleting parish:', deleteParafiaError);
      return NextResponse.json({ error: 'Failed to delete parish: ' + deleteParafiaError.message }, { status: 500 });
    }

    // Usuń profile i konta auth wszystkich członków
    for (const profileId of profileIds) {
      await supabaseAdmin.from('profiles').delete().eq('id', profileId);
      await supabaseAdmin.auth.admin.deleteUser(profileId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete parish error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
