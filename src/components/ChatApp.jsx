import { useEffect, useRef, useState } from 'react';
import { ChatHeader } from './ChatHeader.jsx';
import { MessageList } from './MessageList.jsx';
import { MessageComposer } from './MessageComposer.jsx';
import { MediaViewer } from './MediaViewer.jsx';
import { clearPrivateSession } from '../services/auth.js';
import { clearRoom, loadMessages, markSeen, subscribeMessages } from '../services/chat.js';
import { startPresence } from '../services/presence.js';

export function ChatApp({ session, onLock }) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [error, setError] = useState('');
  const presence = useRef(null);

  useEffect(() => {
    let alive = true;
    const refreshMessages = () => loadMessages(session).then((rows) => {
      if (alive) {
        setMessages((current) => {
          const currentIds = new Set(current.map((message) => message.id));
          const hasNewMessages = rows.some((message) => !currentIds.has(message.id));
          return hasNewMessages || rows.length !== current.length ? rows : current;
        });
      }
      markSeen(session, session.user.id);
    }).catch(() => setError('Messages are unavailable right now.'));
    refreshMessages();
    const refreshTimer = window.setInterval(refreshMessages, 1800);
    const unsubscribe = subscribeMessages(session, (row) => {
      setMessages((current) => current.some((message) => message.id === row.id) ? current : [...current, row]);
      markSeen(session, session.user.id);
    });
    presence.current = startPresence(session, session.user, { onTyping: setTyping, onOnline: setOnline });
    return () => {
      alive = false;
      window.clearInterval(refreshTimer);
      unsubscribe();
      presence.current?.stop();
    };
  }, [session]);

  function lock() {
    clearPrivateSession();
    onLock();
  }

  async function handleClear() {
    if (!window.confirm('Clear conversation?')) return;
    try {
      await clearRoom(session);
      setMessages([]);
    } catch {
      setError('Conversation could not be cleared right now.');
    }
  }

  const media = messages.filter((message) => message.file_path);

  return (
    <section className="chat-shell" aria-label="Conversation workspace">
      <div className="chat-panel">
        <ChatHeader online={online} onLock={lock} onClear={handleClear} onMedia={() => setViewer({ items: media, index: 0 })} />
        {error && <div className="chat-error" role="status">{error}</div>}
        <MessageList messages={messages} currentUserId={session.user.id} typing={typing} onOpenMedia={(item) => {
          const index = Math.max(0, media.findIndex((message) => message.id === item.id));
          setViewer({ items: media, index });
        }} />
        <MessageComposer
          session={session}
          onTyping={(value) => presence.current?.setTyping(value)}
          onSent={(message) => setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message])}
        />
      </div>
      {viewer && <MediaViewer items={viewer.items} index={viewer.index} onClose={() => setViewer(null)} />}
    </section>
  );
}
