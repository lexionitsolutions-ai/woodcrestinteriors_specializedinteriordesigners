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

const BUCKET = 'private-chat-media';

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function privateUserForToken(supabase: ReturnType<typeof createClient>, token: string) {
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

  const body = await req.json().catch(() => ({}));
  const token = String(body.token || '');
  const action = String(body.action || '');
  const supabase = createClient(supabaseUrl, serviceKey);
  const userId = await privateUserForToken(supabase, token);
  if (!userId) return new Response(JSON.stringify({ ok: false }), { status: 401, headers: jsonHeaders });

  if (action === 'signed-upload') {
    const fileName = String(body.fileName || 'upload.bin').replace(/[^\w.\-]+/g, '-');
    const extension = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) return new Response(JSON.stringify({ ok: false }), { status: 500, headers: jsonHeaders });
    return new Response(JSON.stringify({ ok: true, path, signedUrl: data.signedUrl, uploadToken: data.token }), { headers: jsonHeaders });
  }

  if (action === 'signed-read') {
    const path = String(body.path || '');
    if (!path) return new Response(JSON.stringify({ ok: false }), { status: 400, headers: jsonHeaders });
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
    if (error) return new Response(JSON.stringify({ ok: false }), { status: 500, headers: jsonHeaders });
    return new Response(JSON.stringify({ ok: true, signedUrl: data.signedUrl }), { headers: jsonHeaders });
  }

  return new Response(JSON.stringify({ ok: false }), { status: 400, headers: jsonHeaders });
});
