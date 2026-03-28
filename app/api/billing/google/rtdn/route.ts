import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../stripe/_shared';

type PubSubEnvelope = {
  message?: {
    messageId?: string;
    data?: string;
    attributes?: Record<string, string>;
    publishTime?: string;
  };
  subscription?: string;
};

const decodePubSubData = (base64Value: string | undefined) => {
  if (!base64Value) return null;
  try {
    const json = Buffer.from(base64Value, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as PubSubEnvelope;
    const message = body.message || {};
    const decodedPayload = decodePubSubData(message.data);

    const eventId = message.messageId || null;
    const eventType =
      typeof decodedPayload?.subscriptionNotification === 'object'
        ? 'subscriptionNotification'
        : typeof decodedPayload?.oneTimeProductNotification === 'object'
          ? 'oneTimeProductNotification'
          : 'unknown';

    const nowIso = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from('billing_events')
      .insert({
        provider: 'google_play',
        event_id: eventId,
        event_type: eventType,
        payload: {
          pubsub: body,
          decodedPayload,
        },
        received_at: nowIso,
        created_at: nowIso,
      });

    if (error) {
      console.error('Google RTDN insert error:', error);
      return NextResponse.json(
        { error: 'Brak tabeli billing_events lub błąd zapisu. Uruchom migrację SQL add-google-billing-core.sql.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Google RTDN error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
