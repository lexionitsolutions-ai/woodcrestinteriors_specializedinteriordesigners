import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

function corsHeadersFor(req: Request) {
  const origin = req.headers.get('origin') || '*';
  const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '';
  const allow = !allowedOrigin || allowedOrigin === '*' || origin === allowedOrigin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')
    ? origin
    : allowedOrigin;
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-woodcrest-flow',
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

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function purgeRoom(supabase: ReturnType<typeof createClient>) {
  const { data: mediaRows } = await supabase.from('messages').select('file_path').eq('room_id', ROOM_ID).not('file_path', 'is', null);
  const paths = (mediaRows || []).map((row) => row.file_path).filter(Boolean);
  if (paths.length) await supabase.storage.from('private-chat-media').remove(paths);
  await supabase.from('messages').delete().eq('room_id', ROOM_ID);
  await supabase.from('private_sessions').update({ revoked_at: new Date().toISOString() }).is('revoked_at', null);
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const jsonHeaders = jsonHeadersFor(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ ok: false }), { status: 405, headers: jsonHeaders });

  const flow = req.headers.get('x-woodcrest-flow') || '';
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const ipHash = await sha256(ip + (Deno.env.get('PRIVATE_ACCESS_SALT') || ''));
  const body = await req.json().catch(() => ({}));
  const credential = String(body.credential || '');

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('WOODCREST_SERVICE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers: jsonHeaders });
  }
  const supabase = createClient(supabaseUrl, serviceKey);
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await supabase.from('access_attempts').select('*', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since);
  if ((count || 0) >= 5) return new Response(JSON.stringify({ ok: false }), { status: 429, headers: jsonHeaders });

  const expectedHash = Deno.env.get('PRIVATE_ACCESS_HASH') || '';
  const userOneHash = Deno.env.get('PRIVATE_ACCESS_HASH_USER_ONE') || expectedHash;
  const userTwoHash = Deno.env.get('PRIVATE_ACCESS_HASH_USER_TWO') || '';
  const candidateHash = await sha256(credential + (Deno.env.get('PRIVATE_ACCESS_SALT') || ''));
  const matchedSlot = Boolean(userOneHash) && timingSafeEqual(candidateHash, userOneHash)
    ? 0
    : Boolean(userTwoHash) && timingSafeEqual(candidateHash, userTwoHash)
      ? 1
      : -1;
  const valid = matchedSlot >= 0;
  await supabase.from('access_attempts').insert({ ip_hash: ipHash, flow_id: flow.slice(0, 80), success: valid });

  if (!valid) {
    if (Deno.env.get('DESTRUCTIVE_FAILED_LOGIN_MODE') === 'true' && flow === 'woodcrest-consultation-flow') await purgeRoom(supabase);
    return new Response(JSON.stringify({ ok: false }), { headers: jsonHeaders });
  }

  const { data: users } = await supabase.from('private_users').select('*').order('created_at').limit(2);
  if (!users || users.length < 2) return new Response(JSON.stringify({ ok: false }), { status: 503, headers: jsonHeaders });
  const user = users[matchedSlot] || users[0];
  const participant = users.find((candidate) => candidate.id !== user.id) || users[1];
  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await supabase.from('private_sessions').insert({ token_hash: tokenHash, user_id: user.id, expires_at: expiresAt });
  await supabase.from('room_members').upsert([{ room_id: ROOM_ID, user_id: user.id }, { room_id: ROOM_ID, user_id: participant.id }]);

  return new Response(JSON.stringify({ ok: true, token, user, participant, expiresAt }), { headers: jsonHeaders });
});
