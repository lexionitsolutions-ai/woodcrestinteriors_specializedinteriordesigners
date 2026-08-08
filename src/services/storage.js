import { STORAGE_BUCKET } from '../config.js';
import { requireSupabase, supabaseConfig } from './supabase.js';

export async function uploadPrivateFile(file, session, onProgress) {
  if (session?.localDev) {
    onProgress?.(100);
    return URL.createObjectURL(file);
  }
  const supabase = requireSupabase();
  const signed = await mediaFunction(session, { action: 'signed-upload', fileName: file.name });
  onProgress?.(20);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).uploadToSignedUrl(signed.path, signed.uploadToken, file, {
    contentType: file.type || 'application/octet-stream'
  });
  if (error) throw error;
  onProgress?.(100);
  return signed.path;
}

export async function signedUrl(path) {
  if (path?.startsWith('blob:')) return path;
  const session = window.__WOODCREST_PRIVATE_SESSION__;
  const data = await mediaFunction(session, { action: 'signed-read', path });
  return data.signedUrl;
}

async function mediaFunction(session, body) {
  const { url, anonKey } = supabaseConfig();
  const response = await fetch(`${url}/functions/v1/media-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`
    },
    body: JSON.stringify({ ...body, token: session.token })
  });
  if (!response.ok) throw new Error(`Media request failed with HTTP ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error('Media request was rejected.');
  return data;
}
