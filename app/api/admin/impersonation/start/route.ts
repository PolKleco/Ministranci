import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveImpersonationSession,
  getAuthUser,
  isAllowedAdmin,
  isMissingImpersonationSchema,
  supabaseAdmin,
  type ImpersonationRole,
} from '../_shared';

type StartBody = {
  parafiaId?: unknown;
  role?: unknown;
};

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseRole(value: unknown): ImpersonationRole | null {
  return value === 'ksiadz' || value === 'ministrant' ? value : null;
}

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

    const body = (await request.json().catch(() => ({}))) as StartBody;
    const parafiaId = asString(body.parafiaId);
    const role = parseRole(body.role);

    if (!parafiaId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    if (activeSession) {
      return NextResponse.json({
        error: 'Masz już aktywną sesję wejścia do parafii. Zakończ ją przed rozpoczęciem kolejnej.',
      }, { status: 409 });
    }

    const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, imie, nazwisko, typ, parafia_id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (adminProfileError || !adminProfile) {
      return NextResponse.json({ error: adminProfileError?.message || 'Admin profile not found' }, { status: 404 });
    }

    const { data: targetParafia, error: targetParafiaError } = await supabaseAdmin
      .from('parafie')
      .select('id, nazwa, miasto')
      .eq('id', parafiaId)
      .maybeSingle();

    if (targetParafiaError || !targetParafia) {
      return NextResponse.json({ error: targetParafiaError?.message || 'Parish not found' }, { status: 404 });
    }

    const { data: existingMember, error: existingMemberError } = await supabaseAdmin
      .from('parafia_members')
      .select('id, profile_id, parafia_id, email, imie, nazwisko, typ, grupa, role, zatwierdzony, created_at')
      .eq('profile_id', authUser.id)
      .eq('parafia_id', parafiaId)
      .maybeSingle();

    if (existingMemberError) {
      return NextResponse.json({ error: existingMemberError.message }, { status: 500 });
    }

    const previousMemberData = existingMember ? {
      id: existingMember.id,
      email: existingMember.email,
      imie: existingMember.imie,
      nazwisko: existingMember.nazwisko,
      typ: existingMember.typ,
      grupa: existingMember.grupa,
      role: parseStringArray(existingMember.role),
      zatwierdzony: existingMember.zatwierdzony,
      created_at: existingMember.created_at,
    } : null;

    const { data: startedSession, error: startSessionError } = await supabaseAdmin
      .from('admin_impersonation_sessions')
      .insert({
        admin_user_id: authUser.id,
        admin_email: authUser.email || adminProfile.email,
        target_parafia_id: parafiaId,
        impersonated_typ: role,
        previous_typ: adminProfile.typ,
        previous_parafia_id: adminProfile.parafia_id,
        previous_member_data: previousMemberData,
      })
      .select('id, started_at')
      .single();

    if (startSessionError || !startedSession) {
      if (isMissingImpersonationSchema(startSessionError)) {
        return NextResponse.json({
          error: 'Brak tabeli admin_impersonation_sessions. Uruchom migracje add-admin-impersonation.sql.',
        }, { status: 500 });
      }
      return NextResponse.json({ error: startSessionError?.message || 'Cannot start impersonation session' }, { status: 500 });
    }

    const rollbackSession = async () => {
      await supabaseAdmin.from('admin_impersonation_sessions').delete().eq('id', startedSession.id);
    };

    const rollbackProfile = async () => {
      await supabaseAdmin
        .from('profiles')
        .update({ typ: adminProfile.typ, parafia_id: adminProfile.parafia_id })
        .eq('id', authUser.id);
    };

    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ typ: role, parafia_id: parafiaId })
      .eq('id', authUser.id);

    if (profileUpdateError) {
      await rollbackSession();
      return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
    }

    const memberPayload = {
      email: adminProfile.email,
      imie: adminProfile.imie,
      nazwisko: adminProfile.nazwisko,
      typ: role,
      zatwierdzony: true,
      role: role === 'ministrant' ? [] : parseStringArray(existingMember?.role),
    };

    const memberResult = existingMember
      ? await supabaseAdmin
        .from('parafia_members')
        .update(memberPayload)
        .eq('id', existingMember.id)
      : await supabaseAdmin
        .from('parafia_members')
        .insert({
          profile_id: authUser.id,
          parafia_id: parafiaId,
          ...memberPayload,
          grupa: null,
        });

    if (memberResult.error) {
      await rollbackProfile();
      await rollbackSession();
      return NextResponse.json({ error: memberResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        sessionId: startedSession.id,
        startedAt: startedSession.started_at,
        parafiaId: targetParafia.id,
        parafiaNazwa: targetParafia.nazwa,
        role,
      },
      redirectUrl: '/app?admin_impersonation=1',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
