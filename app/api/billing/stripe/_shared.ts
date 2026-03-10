import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function isMissingColumnError(error: { message?: string } | null) {
  const message = error?.message || '';
  return (
    message.includes('does not exist') ||
    message.includes("Could not find the '") ||
    message.includes('schema cache')
  );
}

function isMissingImpersonationSchema(error: { message?: string } | null) {
  const message = error?.message || '';
  return (
    message.includes('admin_impersonation_sessions') &&
    (message.includes('does not exist') || message.includes("Could not find the table"))
  );
}

export async function findParafiaForAdmin(parafiaId: string, adminId: string) {
  const { data, error } = await supabaseAdmin
    .from('parafie')
    .select('*')
    .eq('id', parafiaId)
    .single();

  if (error || !data) return null;
  if (data.admin_id === adminId) return data as Record<string, unknown>;

  const { data: impersonationSession, error: impersonationError } = await supabaseAdmin
    .from('admin_impersonation_sessions')
    .select('id')
    .eq('admin_user_id', adminId)
    .eq('target_parafia_id', parafiaId)
    .eq('impersonated_typ', 'ksiadz')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (impersonationError) {
    if (isMissingImpersonationSchema(impersonationError)) {
      return null;
    }
    console.error('findParafiaForAdmin impersonation check error:', impersonationError);
    return null;
  }

  if (!impersonationSession) return null;

  return data as Record<string, unknown>;
}
