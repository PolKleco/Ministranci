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

    const { profileId, parafiaId } = await request.json();

    if (!profileId || !parafiaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (profileId === authUser.id) {
      return NextResponse.json({ error: 'Cannot delete self account with this endpoint' }, { status: 400 });
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

    const runStep = async (label: string, action: () => Promise<{ error: { message: string } | null }>) => {
      const { error } = await action();
      if (error) {
        throw new Error(`${label}: ${error.message}`);
      }
    };

    // Usuń wszystkie powiązane dane (fail-fast na pierwszym błędzie)
    await runStep('delete ankiety_odpowiedzi', () =>
      supabaseAdmin.from('ankiety_odpowiedzi').delete().eq('respondent_id', profileId)
    );
    await runStep('delete tablica_przeczytane', () =>
      supabaseAdmin.from('tablica_przeczytane').delete().eq('user_id', profileId)
    );
    await runStep('delete tablica_wiadomosci', () =>
      supabaseAdmin.from('tablica_wiadomosci').delete().eq('autor_id', profileId)
    );
    await runStep('delete tablica_watki', () =>
      supabaseAdmin.from('tablica_watki').delete().eq('autor_id', profileId).eq('parafia_id', parafiaId)
    );
    await runStep('delete powiadomienia', () =>
      supabaseAdmin.from('powiadomienia').delete().eq('odbiorca_id', profileId).eq('parafia_id', parafiaId)
    );
    await runStep('delete push_subscriptions', () =>
      supabaseAdmin.from('push_subscriptions').delete().eq('user_id', profileId)
    );
    await runStep('delete odznaki_zdobyte', () =>
      supabaseAdmin.from('odznaki_zdobyte').delete().eq('ministrant_id', profileId)
    );
    await runStep('delete ranking', () =>
      supabaseAdmin.from('ranking').delete().eq('ministrant_id', profileId).eq('parafia_id', parafiaId)
    );
    await runStep('delete minusowe_punkty', () =>
      supabaseAdmin.from('minusowe_punkty').delete().eq('ministrant_id', profileId).eq('parafia_id', parafiaId)
    );
    await runStep('delete obecnosci', () =>
      supabaseAdmin.from('obecnosci').delete().eq('ministrant_id', profileId).eq('parafia_id', parafiaId)
    );
    await runStep('delete dyzury', () =>
      supabaseAdmin.from('dyzury').delete().eq('ministrant_id', profileId).eq('parafia_id', parafiaId)
    );
    await runStep('delete funkcje', () =>
      supabaseAdmin.from('funkcje').delete().eq('ministrant_id', profileId)
    );
    await runStep('delete parafia_members', () =>
      supabaseAdmin.from('parafia_members').delete().eq('profile_id', profileId).eq('parafia_id', parafiaId)
    );
    await runStep('delete profile', () =>
      supabaseAdmin.from('profiles').delete().eq('id', profileId)
    );

    // Usuń konto auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(profileId);
    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json({
        error: 'Failed to delete auth user',
        details: authError.message,
        partial: true,
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Server error',
      partial: true,
    }, { status: 500 });
  }
}
