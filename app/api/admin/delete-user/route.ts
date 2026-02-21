import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { profileId, parafiaId, requesterId } = await request.json();

    if (!profileId || !parafiaId || !requesterId) {
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

    // Sprawdź czy usuwany user należy do tej parafii
    const { data: membership } = await supabaseAdmin
      .from('parafia_members')
      .select('id')
      .eq('profile_id', profileId)
      .eq('parafia_id', parafiaId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'User not in parish' }, { status: 404 });
    }

    // Usuń wszystkie powiązane dane (wszystkie tabele referencjujące profiles)
    await supabaseAdmin.from('ankiety_odpowiedzi').delete().eq('respondent_id', profileId);
    await supabaseAdmin.from('tablica_przeczytane').delete().eq('user_id', profileId);
    await supabaseAdmin.from('tablica_wiadomosci').delete().eq('autor_id', profileId);
    await supabaseAdmin.from('tablica_watki').delete().eq('autor_id', profileId);
    await supabaseAdmin.from('powiadomienia').delete().eq('odbiorca_id', profileId);
    await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', profileId);
    await supabaseAdmin.from('odznaki_zdobyte').delete().eq('ministrant_id', profileId);
    await supabaseAdmin.from('ranking').delete().eq('ministrant_id', profileId).eq('parafia_id', parafiaId);
    await supabaseAdmin.from('minusowe_punkty').delete().eq('ministrant_id', profileId).eq('parafia_id', parafiaId);
    await supabaseAdmin.from('obecnosci').delete().eq('ministrant_id', profileId).eq('parafia_id', parafiaId);
    await supabaseAdmin.from('dyzury').delete().eq('ministrant_id', profileId).eq('parafia_id', parafiaId);
    await supabaseAdmin.from('funkcje').delete().eq('ministrant_id', profileId);
    await supabaseAdmin.from('parafia_members').delete().eq('profile_id', profileId).eq('parafia_id', parafiaId);

    // Usuń profil
    await supabaseAdmin.from('profiles').delete().eq('id', profileId);

    // Usuń konto auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(profileId);
    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
