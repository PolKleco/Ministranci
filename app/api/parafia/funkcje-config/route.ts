import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const PARISH_ADMIN_ROLE = '__parafia_admin__';
const MANAGE_FUNCTION_TEMPLATES_PERMISSION_TOKEN = '__perm__:manage_function_templates';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type AccessResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

type FunkcjaConfigPayload = {
  id?: unknown;
  nazwa?: unknown;
  opis?: unknown;
  emoji?: unknown;
  kolor?: unknown;
  obrazek_url?: unknown;
  dlugi_opis?: unknown;
  zdjecia?: unknown;
  youtube_url?: unknown;
};

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
    && (message.includes('does not exist') || message.includes('Could not find the table'))
  );
}

async function canManageFunkcjeConfig(parafiaId: string, authUserId: string): Promise<AccessResult> {
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
    .select('typ, role')
    .eq('parafia_id', parafiaId)
    .eq('profile_id', authUserId)
    .maybeSingle();

  if (memberError) {
    return { ok: false, status: 500, error: memberError.message || 'Błąd sprawdzania członkostwa w parafii' };
  }

  if (member) {
    const roles = normalizeRoles(member.role);
    if (
      member.typ === 'ksiadz'
      || roles.includes(PARISH_ADMIN_ROLE)
      || roles.includes(MANAGE_FUNCTION_TEMPLATES_PERMISSION_TOKEN)
    ) {
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
      return { ok: false, status: 403, error: 'Brak uprawnień do zarządzania funkcjami' };
    }
    return { ok: false, status: 500, error: impersonationError.message || 'Błąd sprawdzania sesji admina' };
  }

  if (impersonationSession) return { ok: true };
  return { ok: false, status: 403, error: 'Brak uprawnień do zarządzania funkcjami' };
}

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const asNullableString = (value: unknown) => (typeof value === 'string' ? value.trim() || null : null);

const normalizeFunkcjeConfig = (input: unknown) => {
  if (!Array.isArray(input)) return [] as Array<Record<string, unknown>>;
  const rows = input as FunkcjaConfigPayload[];
  return rows
    .map((row) => {
      const id = asString(row.id);
      const nazwa = asString(row.nazwa);
      if (!id || !nazwa) return null;

      const zdjecia = Array.isArray(row.zdjecia)
        ? row.zdjecia.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
        : undefined;

      return {
        id,
        nazwa,
        opis: asString(row.opis),
        emoji: asString(row.emoji) || '⭐',
        kolor: asString(row.kolor) || 'gray',
        obrazek_url: asNullableString(row.obrazek_url),
        dlugi_opis: asString(row.dlugi_opis),
        zdjecia: zdjecia && zdjecia.length > 0 ? zdjecia : undefined,
        youtube_url: asString(row.youtube_url) || undefined,
      };
    })
    .filter(Boolean) as Array<Record<string, unknown>>;
};

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;
    const parafiaId = asString(body.parafiaId);
    const funkcjeConfig = normalizeFunkcjeConfig(body.funkcjeConfig);

    if (!parafiaId) {
      return NextResponse.json({ error: 'parafiaId jest wymagane' }, { status: 400 });
    }

    const access = await canManageFunkcjeConfig(parafiaId, authUser.id);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { error: updateError } = await supabaseAdmin
      .from('parafie')
      .update({ funkcje_config: funkcjeConfig })
      .eq('id', parafiaId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Nie udało się zapisać konfiguracji funkcji' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, funkcjeConfig });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Błąd serwera' },
      { status: 500 }
    );
  }
}
