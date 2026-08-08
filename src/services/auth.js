import { isSupabaseConfigured, supabaseConfig } from './supabase.js';
import { ACCESS_FLOW_HEADER, ENABLE_LOCAL_DEV_LOGIN } from '../config.js';

let privateSession = null;

export async function verifyPrivateAccess({ credential, name }) {
  if (!isSupabaseConfigured() && ENABLE_LOCAL_DEV_LOGIN) {
    const trimmed = credential.trim();
    const userOne = { id: 'local-user-one', display_name: name || 'Mrunal' };
    const userTwo = { id: 'local-user-two', display_name: name || 'Mrunmai' };
    if (trimmed === 'Mrunal12345' || trimmed === 'Mrunmai12345') {
      const isFirst = trimmed === 'Mrunal12345';
      privateSession = {
        token: 'local-development-session',
        user: isFirst ? userOne : userTwo,
        participant: isFirst ? userTwo : userOne,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        localDev: true
      };
      window.__WOODCREST_PRIVATE_SESSION__ = privateSession;
      return { ok: true, session: privateSession };
    }
    return { ok: false };
  }

  const { url, anonKey } = supabaseConfig();
  const response = await fetch(`${url}/functions/v1/private-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      'x-woodcrest-flow': ACCESS_FLOW_HEADER
    },
    body: JSON.stringify({ credential, name })
  });
  if (!response.ok) throw new Error(`Private access failed with HTTP ${response.status}`);
  const data = await response.json();
  if (data?.ok && data?.token && data?.user) {
    privateSession = {
      token: data.token,
      user: data.user,
      participant: data.participant,
      expiresAt: data.expiresAt
    };
    window.__WOODCREST_PRIVATE_SESSION__ = privateSession;
    return { ok: true, session: privateSession };
  }
  return { ok: false };
}

export function getPrivateSession() {
  return privateSession;
}

export function clearPrivateSession() {
  privateSession = null;
  window.__WOODCREST_PRIVATE_SESSION__ = null;
}
