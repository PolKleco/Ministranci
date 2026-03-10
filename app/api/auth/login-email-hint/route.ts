import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type LoginEmailHintBody = {
  email?: unknown;
};

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as LoginEmailHintBody;
    const email = normalizeEmail(asString(body.email));

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, typ')
      .ilike('email', email)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile || profile.typ !== 'ministrant') {
      return NextResponse.json({ ok: true, showChangedEmailHint: false });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (authError || !authData.user?.email) {
      return NextResponse.json({ ok: true, showChangedEmailHint: false });
    }

    const profileEmail = normalizeEmail(profile.email || '');
    const authEmail = normalizeEmail(authData.user.email);
    const showChangedEmailHint = profileEmail.length > 0 && authEmail.length > 0 && profileEmail !== authEmail;

    return NextResponse.json({ ok: true, showChangedEmailHint });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}

