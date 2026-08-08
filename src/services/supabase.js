import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
let privateClientCache = null;
let privateClientToken = null;

export const supabase = url && anonKey
  ? createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

export function supabaseConfig() {
  return { url, anonKey };
}

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export function privateClient(session) {
  if (!url || !anonKey) throw new Error('Supabase is not configured.');
  if (!session?.token) throw new Error('Private session is missing.');
  if (privateClientCache && privateClientToken === session.token) return privateClientCache;
  privateClientToken = session.token;
  privateClientCache = createClient(url, anonKey, {
    global: {
      headers: {
        authorization: `Bearer ${anonKey}`,
        'x-private-token': session.token
      }
    },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return privateClientCache;
}
