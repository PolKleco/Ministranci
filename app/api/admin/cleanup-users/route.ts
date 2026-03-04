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

    const adminEmail = (authUser.email || '').toLowerCase();
    const allowedEmails = (process.env.INTERNAL_ADMIN_EMAILS || '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);

    if (allowedEmails.length === 0) {
      return NextResponse.json({ error: 'Cleanup endpoint disabled: INTERNAL_ADMIN_EMAILS is not configured' }, { status: 403 });
    }

    if (!adminEmail || !allowedEmails.includes(adminEmail)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { emails } = await request.json();

    // Pobierz listę userów z auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) {
      return NextResponse.json({ error: 'Failed to list users', details: listError.message }, { status: 500 });
    }

    // Tryb listowania
    if (!emails || emails.length === 0) {
      const allUsers = users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at }));
      return NextResponse.json({ ok: true, users: allUsers });
    }

    const results: { email: string; status: string; error?: string }[] = [];

    for (const email of emails) {
      const user = users.find(u => u.email === email);
      if (!user) {
        results.push({ email, status: 'not_found' });
        continue;
      }

      // Wyczyść dane z public schema
      const tables = [
        { table: 'ankiety_odpowiedzi', column: 'respondent_id' },
        { table: 'tablica_przeczytane', column: 'user_id' },
        { table: 'tablica_wiadomosci', column: 'autor_id' },
        { table: 'tablica_watki', column: 'autor_id' },
        { table: 'powiadomienia', column: 'odbiorca_id' },
        { table: 'push_subscriptions', column: 'user_id' },
        { table: 'odznaki_zdobyte', column: 'ministrant_id' },
        { table: 'ranking', column: 'ministrant_id' },
        { table: 'minusowe_punkty', column: 'ministrant_id' },
        { table: 'funkcje', column: 'ministrant_id' },
        { table: 'obecnosci', column: 'ministrant_id' },
        { table: 'dyzury', column: 'ministrant_id' },
        { table: 'parafia_members', column: 'profile_id' },
        { table: 'profiles', column: 'id' },
      ];

      for (const { table, column } of tables) {
        await supabaseAdmin.from(table).delete().eq(column, user.id);
      }

      // Usuń konto auth przez oficjalne API
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        results.push({ email, status: 'error', error: deleteError.message });
      } else {
        results.push({ email, status: 'deleted' });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error('Cleanup error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
