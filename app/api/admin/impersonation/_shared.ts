import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const allowedAdminEmails = (process.env.INTERNAL_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedAdmin(email?: string | null) {
  if (!email) return false;
  return allowedAdminEmails.includes(email.toLowerCase());
}

export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export function isMissingImpersonationSchema(error: { message?: string } | null) {
  const message = error?.message || '';
  return (
    message.includes('admin_impersonation_sessions') &&
    (message.includes('does not exist') || message.includes("Could not find the table"))
  );
}

export type ImpersonationRole = 'ksiadz' | 'ministrant';

export type ActiveImpersonationSession = {
  id: string;
  admin_user_id: string;
  admin_email: string;
  target_parafia_id: string;
  impersonated_typ: ImpersonationRole;
  previous_typ: 'ksiadz' | 'ministrant' | 'nowy';
  previous_parafia_id: string | null;
  previous_member_data: Record<string, unknown> | null;
  started_at: string;
  ended_at: string | null;
};

export async function getActiveImpersonationSession(adminUserId: string) {
  const { data, error } = await supabaseAdmin
    .from('admin_impersonation_sessions')
    .select('*')
    .eq('admin_user_id', adminUserId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    data: (data as ActiveImpersonationSession | null),
    error,
  };
}
