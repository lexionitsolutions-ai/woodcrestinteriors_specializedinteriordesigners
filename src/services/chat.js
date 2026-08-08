import { CHAT_ROOM_ID } from '../config.js';
import { privateClient, requireSupabase, supabaseConfig } from './supabase.js';

let localMessages = [];
let localListeners = [];

export async function loadMessages(session) {
  if (session?.localDev) return localMessages;
  const data = await chatFunction(session, { action: 'list' });
  return data.messages || [];
}

export async function sendMessage(session, payload) {
  if (session?.localDev) {
    const row = {
      id: crypto.randomUUID(),
      room_id: CHAT_ROOM_ID,
      created_at: new Date().toISOString(),
      is_deleted: false,
      ...payload
    };
    localMessages = [...localMessages, row];
    localListeners.forEach((listener) => listener(row));
    return row;
  }
  const data = await chatFunction(session, { action: 'send', message: { room_id: CHAT_ROOM_ID, ...payload } });
  return data.message;
}

export async function markSeen(session, userId) {
  if (session?.localDev) return;
  await chatFunction(session, { action: 'seen' });
}

export function subscribeMessages(session, onInsert) {
  if (session?.localDev) {
    localListeners = [...localListeners, onInsert];
    return () => {
      localListeners = localListeners.filter((listener) => listener !== onInsert);
    };
  }
  const supabase = privateClient(session);
  const channel = supabase.channel(`messages:${CHAT_ROOM_ID}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${CHAT_ROOM_ID}` }, ({ new: row }) => onInsert(row))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function clearRoom(session) {
  if (session?.localDev) {
    localMessages = [];
    localListeners = [];
    return { ok: true };
  }
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke('clear-room', {
    body: { token: session.token },
    headers: { authorization: `Bearer ${session.token}` }
  });
  if (error) throw error;
  return data;
}

async function chatFunction(session, body) {
  const { url, anonKey } = supabaseConfig();
  const response = await fetch(`${url}/functions/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`
    },
    body: JSON.stringify({ ...body, token: session.token })
  });
  if (!response.ok) throw new Error(`Chat request failed with HTTP ${response.status}`);
  const data = await response.json();
  if (!data.ok) throw new Error('Chat request was rejected.');
  return data;
}
