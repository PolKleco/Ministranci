import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { emails, adminPassword } = await request.json();

    // Proste zabezpieczenie
    if (adminPassword !== process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
