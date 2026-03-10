import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveImpersonationSession,
  getAuthUser,
  isAllowedAdmin,
  isMissingImpersonationSchema,
  supabaseAdmin,
} from '../_shared';

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
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

    const { data: activeSession, error: activeSessionError } = await getActiveImpersonationSession(authUser.id);
    if (activeSessionError) {
      if (isMissingImpersonationSchema(activeSessionError)) {
        return NextResponse.json({
          error: 'Brak tabeli admin_impersonation_sessions. Uruchom migracje add-admin-impersonation.sql.',
        }, { status: 500 });
      }
      return NextResponse.json({ error: activeSessionError.message }, { status: 500 });
    }

    if (!activeSession) {
      return NextResponse.json({ ok: true, active: false });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, imie, nazwisko')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: profileError?.message || 'Profile not found' }, { status: 404 });
    }

    const { error: restoreProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        typ: activeSession.previous_typ,
        parafia_id: activeSession.previous_parafia_id,
      })
      .eq('id', authUser.id);

    if (restoreProfileError) {
      return NextResponse.json({ error: restoreProfileError.message }, { status: 500 });
    }

    const { error: deleteCurrentMemberError } = await supabaseAdmin
      .from('parafia_members')
      .delete()
      .eq('profile_id', authUser.id)
      .eq('parafia_id', activeSession.target_parafia_id);

    if (deleteCurrentMemberError) {
      return NextResponse.json({ error: deleteCurrentMemberError.message }, { status: 500 });
    }

    const previousMemberData = activeSession.previous_member_data;
    if (previousMemberData && typeof previousMemberData === 'object') {
      const prev = previousMemberData as Record<string, unknown>;
      const restoredMember = {
        id: typeof prev.id === 'string' ? prev.id : undefined,
        profile_id: authUser.id,
        parafia_id: activeSession.target_parafia_id,
        email: typeof prev.email === 'string' ? prev.email : profile.email,
        imie: typeof prev.imie === 'string' ? prev.imie : profile.imie,
        nazwisko: typeof prev.nazwisko === 'string' ? prev.nazwisko : profile.nazwisko,
        typ: prev.typ === 'ksiadz' ? 'ksiadz' : 'ministrant',
        grupa: typeof prev.grupa === 'string' ? prev.grupa : null,
        role: parseStringArray(prev.role),
        zatwierdzony: typeof prev.zatwierdzony === 'boolean' ? prev.zatwierdzony : true,
      };

      const { error: restoreMemberError } = await supabaseAdmin
        .from('parafia_members')
        .insert(restoredMember);

      if (restoreMemberError) {
        return NextResponse.json({ error: restoreMemberError.message }, { status: 500 });
      }
    }

    const { error: closeSessionError } = await supabaseAdmin
      .from('admin_impersonation_sessions')
      .update({
        ended_at: new Date().toISOString(),
        ended_reason: 'manual',
      })
      .eq('id', activeSession.id);

    if (closeSessionError) {
      return NextResponse.json({ error: closeSessionError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, active: false });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
