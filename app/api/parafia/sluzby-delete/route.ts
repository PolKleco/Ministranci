import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const PARISH_ADMIN_ROLE = '__parafia_admin__';
const MANAGE_EVENTS_PERMISSION_TOKEN = '__perm__:manage_events';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type AccessResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

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
    (message.includes('does not exist') || message.includes('Could not find the table'))
  );
}

async function canDeleteSluzba(parafiaId: string, authUserId: string): Promise<AccessResult> {
  const { data: parafia, error: parafiaError } = await supabaseAdmin
    .from('parafie')
    .select('id, admin_id')
    .eq('id', parafiaId)
    .maybeSingle();

  if (parafiaError) {
    return { ok: false, status: 500, error: parafiaError.message || 'Błąd sprawdzania parafii' };
  }
  if (!parafia) {
    return { ok: false, status: 404, error: 'Parafia nie istnieje' };
  }
  if (parafia.admin_id === authUserId) return { ok: true };

  const { data: member, error: memberError } = await supabaseAdmin
    .from('parafia_members')
    .select('role')
    .eq('parafia_id', parafiaId)
    .eq('profile_id', authUserId)
    .maybeSingle();

  if (memberError) {
    return { ok: false, status: 500, error: memberError.message || 'Błąd sprawdzania członkostwa w parafii' };
  }

  if (member) {
    const roles = normalizeRoles(member.role);
    if (roles.includes(PARISH_ADMIN_ROLE) || roles.includes(MANAGE_EVENTS_PERMISSION_TOKEN)) {
      return { ok: true };
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
      return { ok: false, status: 403, error: 'Brak uprawnień do usunięcia wydarzenia' };
    }
    return { ok: false, status: 500, error: impersonationError.message || 'Błąd sprawdzania sesji admina' };
  }

  if (impersonationSession) return { ok: true };
  return { ok: false, status: 403, error: 'Brak uprawnień do usunięcia wydarzenia' };
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;
    const sluzbaId = typeof body.sluzbaId === 'string' ? body.sluzbaId : '';
    const parafiaId = typeof body.parafiaId === 'string' ? body.parafiaId : '';

    if (!sluzbaId || !parafiaId) {
      return NextResponse.json({ error: 'sluzbaId i parafiaId są wymagane' }, { status: 400 });
    }

    const access = await canDeleteSluzba(parafiaId, authUser.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { data: deletedRows, error: deleteError } = await supabaseAdmin
      .from('sluzby')
      .delete()
      .eq('id', sluzbaId)
      .eq('parafia_id', parafiaId)
      .select('id');

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message || 'Nie udało się usunąć wydarzenia' }, { status: 500 });
    }

    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json({ error: 'Wydarzenie nie istnieje lub zostało już usunięte' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd serwera' },
      { status: 500 }
    );
  }
}
