import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const PARISH_ADMIN_ROLE = '__parafia_admin__';
const PARISH_PERMISSION_PREFIX = '__perm__:';
const PARISH_PERMISSION_KEYS = [
  'manage_news',
  'manage_members',
  'approve_ranking_submissions',
  'manage_ranking_settings',
  'manage_events',
  'manage_function_templates',
  'manage_poslugi_catalog',
  'edit_prayers',
  'manage_invites',
  'manage_premium',
] as const;
type ParishPermissionKey = typeof PARISH_PERMISSION_KEYS[number];
const LEGACY_PERMISSION_ALIASES: Record<string, ParishPermissionKey[]> = {
  manage_ranking: ['approve_ranking_submissions', 'manage_ranking_settings'],
};
const isParishPermissionKey = (value: string): value is ParishPermissionKey => (
  PARISH_PERMISSION_KEYS.includes(value as ParishPermissionKey)
);
const toPermissionToken = (permission: ParishPermissionKey) => `${PARISH_PERMISSION_PREFIX}${permission}`;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const normalizeRoles = (roles: unknown): string[] => {
  if (!Array.isArray(roles)) return [];
  return Array.from(new Set(roles.filter((role): role is string => typeof role === 'string').map((role) => role.trim()).filter(Boolean)));
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
    message.includes('admin_impersonation_sessions') &&
    (message.includes('does not exist') || message.includes("Could not find the table"))
  );
}

async function canManageParafia(parafiaId: string, authUserId: string) {
  const { data: parafia, error: parafiaError } = await supabaseAdmin
    .from('parafie')
    .select('id, admin_id')
    .eq('id', parafiaId)
    .maybeSingle();

  if (parafiaError || !parafia) {
    return { ok: false as const, status: 404 as const, error: 'Parafia nie istnieje' };
  }

  if (parafia.admin_id === authUserId) {
    return { ok: true as const, parafia };
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
      return {
        ok: false as const,
        status: 403 as const,
        error: 'Tylko ksiądz zarządzający parafią może nadawać uprawnienia',
      };
    }
    return {
      ok: false as const,
      status: 500 as const,
      error: impersonationError.message || 'Błąd sprawdzania uprawnień',
    };
  }

  if (!impersonationSession) {
    return {
      ok: false as const,
      status: 403 as const,
      error: 'Tylko ksiądz zarządzający parafią może nadawać uprawnienia',
    };
  }

  return { ok: true as const, parafia };
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;
    const memberId = typeof body.memberId === 'string' ? body.memberId : '';
    const parafiaId = typeof body.parafiaId === 'string' ? body.parafiaId : '';
    const rawPermissions: unknown[] = Array.isArray(body.permissions)
      ? body.permissions
      : (body.makeAdmin ? [...PARISH_PERMISSION_KEYS] : []);
    const permissionsPayload = rawPermissions.filter((value): value is string => typeof value === 'string');
    const requestedPermissions = Array.from(new Set(
      permissionsPayload.flatMap((permission) => {
        if (isParishPermissionKey(permission)) return [permission];
        return LEGACY_PERMISSION_ALIASES[permission] || [];
      })
    ));

    if (!memberId || !parafiaId) {
      return NextResponse.json({ error: 'memberId i parafiaId są wymagane' }, { status: 400 });
    }

    const access = await canManageParafia(parafiaId, authUser.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { data: targetMember, error: targetError } = await supabaseAdmin
      .from('parafia_members')
      .select('id, typ, role, parafia_id')
      .eq('id', memberId)
      .eq('parafia_id', parafiaId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Nie znaleziono ministranta' }, { status: 404 });
    }

    if (targetMember.typ !== 'ministrant') {
      return NextResponse.json({ error: 'Rolę admina można nadać tylko ministrantowi' }, { status: 400 });
    }

    const currentRoles = normalizeRoles(targetMember.role);
    const baseRoles = currentRoles.filter((role) => role !== PARISH_ADMIN_ROLE && !role.startsWith(PARISH_PERMISSION_PREFIX));
    const permissionRoles = requestedPermissions.map((permission) => toPermissionToken(permission));
    const nextRoles = Array.from(new Set([...baseRoles, ...permissionRoles]));

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('parafia_members')
      .update({ role: nextRoles })
      .eq('id', memberId)
      .eq('parafia_id', parafiaId)
      .select('id, role')
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: updateError?.message || 'Nie udało się zapisać uprawnień' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, member: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd serwera' },
      { status: 500 }
    );
  }
}
