import { CHAT_ROOM_ID } from '../config.js';
import { privateClient } from './supabase.js';

export function startPresence(session, user, { onTyping, onOnline }) {
  if (session?.localDev) {
    onOnline?.(true);
    return {
      setTyping() {},
      stop() {}
    };
  }
  const supabase = privateClient(session);
  const channel = supabase.channel(`presence:${CHAT_ROOM_ID}`, { config: { presence: { key: user.id } } });
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      onOnline?.(Object.keys(state).filter((id) => id !== user.id).length > 0);
    })
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.userId !== user.id) onTyping?.(payload.typing);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString(), display_name: user.display_name });
    });
  return {
    setTyping(typing) {
      channel.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id, typing } });
    },
    stop() {
      supabase.removeChannel(channel);
    }
  };
}
