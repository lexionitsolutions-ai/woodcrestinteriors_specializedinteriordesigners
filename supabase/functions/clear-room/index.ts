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

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const jsonHeaders = jsonHeadersFor(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ ok: false }), { status: 405, headers: jsonHeaders });
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: jsonHeaders });
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('WOODCREST_SERVICE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers: jsonHeaders });
  }
  const supabase = createClient(supabaseUrl, serviceKey);
  const tokenHash = await sha256(token);
  const { data: session } = await supabase.from('private_sessions').select('user_id, expires_at, revoked_at').eq('token_hash', tokenHash).single();
  if (!session || session.revoked_at || new Date(session.expires_at) <= new Date()) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: jsonHeaders });

  const { data: messages } = await supabase.from('messages').select('file_path').eq('room_id', ROOM_ID).not('file_path', 'is', null);
  const paths = (messages || []).map((message) => message.file_path).filter(Boolean);
  if (paths.length) await supabase.storage.from('private-chat-media').remove(paths);
  await supabase.from('messages').delete().eq('room_id', ROOM_ID);
  return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
});
