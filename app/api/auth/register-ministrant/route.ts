import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type RegisterBody = {
  email?: unknown;
  password?: unknown;
  imie?: unknown;
  nazwisko?: unknown;
};

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterBody;
    const email = asString(body.email).toLowerCase();
    const password = asString(body.password);
    const imie = asString(body.imie);
    const nazwisko = asString(body.nazwisko);

    if (!email || !password || !imie || !nazwisko) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password should be at least 6 characters' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        imie,
        nazwisko,
        typ: 'ministrant',
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, userId: data.user?.id || null });
  } catch (err) {
    console.error('register-ministrant error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

