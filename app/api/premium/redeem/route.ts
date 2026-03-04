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

    const { code, parafiaId } = await request.json();
    const normalizedCode = String(code || '').trim();
    const normalizedParafiaId = String(parafiaId || '').trim();

    if (!normalizedCode || !normalizedParafiaId) {
      return NextResponse.json({ error: 'Missing code or parafiaId' }, { status: 400 });
    }

    // Priest/admin only for this parish
    const { data: parish, error: parishError } = await supabaseAdmin
      .from('parafie')
      .select('id, admin_id')
      .eq('id', normalizedParafiaId)
      .single();
    if (parishError || !parish) {
      return NextResponse.json({ error: 'Parish not found' }, { status: 404 });
    }
    if (parish.admin_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: rabat, error: rabatError } = await supabaseAdmin
      .from('rabaty')
      .select('id, kod, procent_znizki, uzycia, max_uzyc, wazny_do')
      .ilike('kod', normalizedCode)
      .limit(1)
      .maybeSingle();

    if (rabatError || !rabat) {
      return NextResponse.json({ error: 'Nieprawidłowy kod rabatowy.' }, { status: 400 });
    }

    if (rabat.wazny_do && new Date(rabat.wazny_do) < new Date()) {
      return NextResponse.json({ error: 'Ten kod rabatowy już wygasł.' }, { status: 400 });
    }

    if (rabat.max_uzyc && rabat.uzycia >= rabat.max_uzyc) {
      return NextResponse.json({ error: 'Ten kod został już wykorzystany maksymalną liczbę razy.' }, { status: 400 });
    }

    // CAS update: succeeds only if no one incremented this code in the meantime.
    const { data: casUpdate, error: casError } = await supabaseAdmin
      .from('rabaty')
      .update({ uzycia: rabat.uzycia + 1 })
      .eq('id', rabat.id)
      .eq('uzycia', rabat.uzycia)
      .select('id, kod, procent_znizki, uzycia')
      .limit(1);

    if (casError) {
      return NextResponse.json({ error: 'Nie udało się aktywować kodu. Spróbuj ponownie.' }, { status: 409 });
    }

    const selectedCode = casUpdate?.[0] || null;
    if (!selectedCode) {
      return NextResponse.json({ error: 'Kod został właśnie wykorzystany. Spróbuj ponownie.' }, { status: 409 });
    }

    const { error: updateParafiaError } = await supabaseAdmin
      .from('parafie')
      .update({ tier: 'premium', rabat_id: selectedCode.id })
      .eq('id', normalizedParafiaId)
      .eq('admin_id', authUser.id);

    if (updateParafiaError) {
      // Compensating action: rollback only if usage counter is still unchanged since reservation.
      await supabaseAdmin
        .from('rabaty')
        .update({ uzycia: Math.max(0, selectedCode.uzycia - 1) })
        .eq('id', selectedCode.id)
        .eq('uzycia', selectedCode.uzycia);

      return NextResponse.json({ error: 'Błąd aktywacji Premium: ' + updateParafiaError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Pakiet Premium został aktywowany!',
      rabat: { kod: selectedCode.kod, procent_znizki: selectedCode.procent_znizki },
    });
  } catch (err) {
    console.error('Premium redeem error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
