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

export async function findParafiaForAdmin(parafiaId: string, adminId: string) {
  const { data, error } = await supabaseAdmin
    .from('parafie')
    .select('*')
    .eq('id', parafiaId)
    .single();

  if (error || !data) return null;
  if (data.admin_id !== adminId) return null;
  return data as Record<string, unknown>;
}
