import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpush = require('web-push');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

webpush.setVapidDetails(
  'mailto:admin@ministranci.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { parafia_id, grupa_docelowa, title, body, url, kategoria, autor_id, target_user_id } = await request.json();

    if (!parafia_id || !title) {
      return NextResponse.json({ error: 'Missing parafia_id or title' }, { status: 400 });
    }

    // Get target user IDs
    let targetUserIds: string[] = [];

    // If targeting a specific user, skip group logic
    if (target_user_id) {
      targetUserIds = [target_user_id];
    } else if (!grupa_docelowa || grupa_docelowa === 'wszyscy') {
      const { data: members } = await supabaseAdmin
        .from('parafia_members')
        .select('profile_id')
        .eq('parafia_id', parafia_id)
        .eq('typ', 'ministrant');

      targetUserIds = (members || []).map((m: { profile_id: string }) => m.profile_id);
    } else {
      // grupa_docelowa contains comma-separated group NAMES — resolve to IDs
      const groupNames = grupa_docelowa.split(',').map((s: string) => s.trim()).filter(Boolean);

      const { data: parafia } = await supabaseAdmin
        .from('parafie')
        .select('grupy')
        .eq('id', parafia_id)
        .single();

      const grupyConfig: Array<{ id: string; nazwa: string }> = (parafia?.grupy as Array<{ id: string; nazwa: string }>) || [];
      const targetGroupIds = groupNames
        .map((name: string) => grupyConfig.find(g => g.nazwa === name)?.id)
        .filter(Boolean);

      if (targetGroupIds.length === 0) {
        // Fallback: send to everyone
        const { data: members } = await supabaseAdmin
          .from('parafia_members')
          .select('profile_id')
          .eq('parafia_id', parafia_id)
          .eq('typ', 'ministrant');

        targetUserIds = (members || []).map((m: { profile_id: string }) => m.profile_id);
      } else {
        const { data: members } = await supabaseAdmin
          .from('parafia_members')
          .select('profile_id, grupa')
          .eq('parafia_id', parafia_id)
          .eq('typ', 'ministrant')
          .in('grupa', targetGroupIds);

        targetUserIds = (members || []).map((m: { profile_id: string }) => m.profile_id);
      }
    }

    // Exclude the author
    if (autor_id) {
      targetUserIds = targetUserIds.filter(id => id !== autor_id);
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    // Get push subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    // Send push notifications
    const payload = JSON.stringify({
      title,
      body: body || '',
      url: url || '/app',
      tag: kategoria || 'default',
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
          }
          throw err;
        }
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({ ok: true, sent, failed });
  } catch (err) {
    console.error('Push send error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
