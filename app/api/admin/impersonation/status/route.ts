import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveImpersonationSession,
  getAuthUser,
  isAllowedAdmin,
  isMissingImpersonationSchema,
  supabaseAdmin,
} from '../_shared';

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ ok: true, active: false, session: null });
    }

    const { data: parafia, error: parafiaError } = await supabaseAdmin
      .from('parafie')
      .select('id, nazwa')
      .eq('id', activeSession.target_parafia_id)
      .maybeSingle();

    if (parafiaError) {
      return NextResponse.json({ error: parafiaError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      active: true,
      session: {
        id: activeSession.id,
        target_parafia_id: activeSession.target_parafia_id,
        target_parafia_nazwa: parafia?.nazwa || null,
        impersonated_typ: activeSession.impersonated_typ,
        started_at: activeSession.started_at,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
