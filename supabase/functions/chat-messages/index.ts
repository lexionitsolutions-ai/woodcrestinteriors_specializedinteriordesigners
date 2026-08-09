/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type SupabaseAdmin = ReturnType<typeof createClient>;

type MessagePayload = {
  sender_id?: string;
  receiver_id?: string;
  message_type?: 'text' | 'image' | 'video' | 'audio' | 'file';
  text_content?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  duration?: number;
  delivered_at?: string;
};

type ChatRequestBody = {
  token?: string;
  action?: 'list' | 'seen' | 'send';
  message?: MessagePayload;
};

function corsHeadersFor(req: Request) {
  const origin = req.headers.get('origin') || '*';
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '';
  const allow = !allowedOrigin || allowedOrigin === '*' || origin === allowedOrigin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')
    ? origin
    : allowedOrigin;
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

function jsonHeadersFor(req: Request) {
  return { ...corsHeadersFor(req), 'Content-Type': 'application/json' };
}

const ROOM_ID = '00000000-0000-4000-8000-000000000001';

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function privateUserForToken(supabase: SupabaseAdmin, token: string) {
  const tokenHash = await sha256(token);
  const { data } = await supabase
    .from('private_sessions')
    .select('user_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .single();
  if (!data || data.revoked_at || new Date(data.expires_at) <= new Date()) return null;
  return data.user_id as string;
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const jsonHeaders = jsonHeadersFor(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ ok: false }), { status: 405, headers: jsonHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('WOODCREST_SERVICE_KEY');
  if (!supabaseUrl || !serviceKey) return new Response(JSON.stringify({ ok: false }), { status: 500, headers: jsonHeaders });

  const body = await req.json().catch(() => ({})) as ChatRequestBody;
  const token = String(body.token || '');
  const action = String(body.action || '');
  const supabase = createClient(supabaseUrl, serviceKey);
  const userId = await privateUserForToken(supabase, token);
  if (!userId) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: jsonHeaders });

  if (action === 'list') {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', ROOM_ID)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    if (error) return new Response(JSON.stringify({ ok: false }), { status: 500, headers: jsonHeaders });
    return new Response(JSON.stringify({ ok: true, messages: data || [] }), { headers: jsonHeaders });
  }

  if (action === 'seen') {
    await supabase
      .from('messages')
      .update({ seen_at: new Date().toISOString() })
      .eq('room_id', ROOM_ID)
      .neq('sender_id', userId)
      .is('seen_at', null);
    return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
  }

  if (action === 'send') {
    const payload: MessagePayload = body.message || {};
    if (!payload.sender_id || !payload.receiver_id || !payload.message_type) {
      return new Response(JSON.stringify({ ok: false }), { status: 400, headers: jsonHeaders });
    }
    if (payload.sender_id !== userId) return new Response(JSON.stringify({ ok: false }), { status: 403, headers: jsonHeaders });
    const { data: receiverIsMember } = await supabase.rpc('is_room_member', { room: ROOM_ID, member: payload.receiver_id });
    if (!receiverIsMember) return new Response(JSON.stringify({ ok: false }), { status: 403, headers: jsonHeaders });
    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: ROOM_ID,
        sender_id: payload.sender_id,
        receiver_id: payload.receiver_id,
        message_type: payload.message_type,
        text_content: payload.text_content || null,
        file_path: payload.file_path || null,
        file_name: payload.file_name || null,
        file_size: payload.file_size || null,
        mime_type: payload.mime_type || null,
        duration: payload.duration || null,
        delivered_at: payload.delivered_at || new Date().toISOString()
      })
      .select()
      .single();
    if (error) return new Response(JSON.stringify({ ok: false }), { status: 500, headers: jsonHeaders });
    return new Response(JSON.stringify({ ok: true, message: data }), { headers: jsonHeaders });
  }

  return new Response(JSON.stringify({ ok: false }), { status: 400, headers: jsonHeaders });
});
