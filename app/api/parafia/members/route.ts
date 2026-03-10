import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const PARISH_ADMIN_ROLE = '__parafia_admin__';
const PARISH_PERMISSION_PREFIX = '__perm__:';
const MANAGE_MEMBERS_PERMISSION = `${PARISH_PERMISSION_PREFIX}manage_members`;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type MemberAction = 'approve' | 'setGroup' | 'reject';

type MemberMutationBody = {
  action?: MemberAction;
  memberId?: string;
  parafiaId?: string;
  grupa?: string | null;
};

type RoleValue = string[] | null;

const normalizeRoles = (roles: unknown): string[] => {
  if (!Array.isArray(roles)) return [];
  return Array.from(new Set(
    roles
      .filter((role): role is string => typeof role === 'string')
      .map((role) => role.trim())
      .filter(Boolean)
  ));
};

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function isMissingImpersonationSchema(error: { message?: string } | null) {
  const message = error?.message || '';
  return (
    message.includes('admin_impersonation_sessions')
    && (message.includes('does not exist') || message.includes("Could not find the table"))
  );
}

async function canManageMembers(parafiaId: string, authUserId: string) {
  const { data: parafia, error: parafiaError } = await supabaseAdmin
    .from('parafie')
    .select('id, admin_id')
    .eq('id', parafiaId)
    .maybeSingle();

  if (parafiaError || !parafia) {
    return { ok: false as const, status: 404 as const, error: 'Parafia nie istnieje' };
  }

  if (parafia.admin_id === authUserId) {
    return { ok: true as const };
  }

  const { data: memberRow } = await supabaseAdmin
    .from('parafia_members')
    .select('typ, role')
    .eq('parafia_id', parafiaId)
    .eq('profile_id', authUserId)
    .maybeSingle();

  if (memberRow) {
    const roles = normalizeRoles((memberRow as { role?: RoleValue }).role);
    const canByRole = (memberRow as { typ?: string }).typ === 'ksiadz'
      || roles.includes(PARISH_ADMIN_ROLE)
      || roles.includes(MANAGE_MEMBERS_PERMISSION);

    if (canByRole) {
      return { ok: true as const };
    }
  }

  const { data: impersonationSession, error: impersonationError } = await supabaseAdmin
    .from('admin_impersonation_sessions')
    .select('id')
    .eq('admin_user_id', authUserId)
    .eq('target_parafia_id', parafiaId)
    .eq('impersonated_typ', 'ksiadz')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (impersonationError) {
    if (isMissingImpersonationSchema(impersonationError)) {
      return { ok: false as const, status: 403 as const, error: 'Brak uprawnień do zarządzania ministrantami' };
    }
    return {
      ok: false as const,
      status: 500 as const,
      error: impersonationError.message || 'Błąd sprawdzania uprawnień',
    };
  }

  if (impersonationSession) {
    return { ok: true as const };
  }

  return { ok: false as const, status: 403 as const, error: 'Brak uprawnień do zarządzania ministrantami' };
}

const asString = (value: unknown) => (typeof value === 'string' ? value : '');
const asOptionalString = (value: unknown) => (typeof value === 'string' ? value : null);

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as MemberMutationBody;
    const action = body.action;
    const memberId = asString(body.memberId);
    const parafiaId = asString(body.parafiaId);

    if (!action || !memberId || !parafiaId) {
      return NextResponse.json({ error: 'action, memberId i parafiaId są wymagane' }, { status: 400 });
    }

    const access = await canManageMembers(parafiaId, authUser.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { data: targetMember, error: targetError } = await supabaseAdmin
      .from('parafia_members')
      .select('id, profile_id, typ, parafia_id')
      .eq('id', memberId)
      .eq('parafia_id', parafiaId)
      .maybeSingle();

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Nie znaleziono ministranta' }, { status: 404 });
    }

    if (targetMember.typ !== 'ministrant') {
      return NextResponse.json({ error: 'Można zarządzać tylko kontami ministrantów' }, { status: 400 });
    }

    if (action === 'approve') {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('parafia_members')
        .update({ zatwierdzony: true })
        .eq('id', memberId)
        .eq('parafia_id', parafiaId)
        .select('id, zatwierdzony')
        .single();

      if (updateError || !updated) {
        return NextResponse.json({ error: updateError?.message || 'Nie udało się zatwierdzić ministranta' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, member: updated });
    }

    if (action === 'setGroup') {
      const grupa = asOptionalString(body.grupa);
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('parafia_members')
        .update({ grupa, zatwierdzony: true })
        .eq('id', memberId)
        .eq('parafia_id', parafiaId)
        .select('id, grupa, zatwierdzony')
        .single();

      if (updateError || !updated) {
        return NextResponse.json({ error: updateError?.message || 'Nie udało się przypisać grupy' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, member: updated });
    }

    if (action === 'reject') {
      const { error: deleteError } = await supabaseAdmin
        .from('parafia_members')
        .delete()
        .eq('id', memberId)
        .eq('parafia_id', parafiaId);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message || 'Nie udało się usunąć ministranta' }, { status: 500 });
      }

      await supabaseAdmin
        .from('profiles')
        .update({ parafia_id: null })
        .eq('id', targetMember.profile_id)
        .eq('parafia_id', parafiaId);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Nieobsługiwana akcja' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd serwera' },
      { status: 500 }
    );
  }
}
