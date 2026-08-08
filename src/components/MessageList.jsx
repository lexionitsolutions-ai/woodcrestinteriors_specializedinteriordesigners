import { useEffect, useMemo, useRef } from 'react';
import { MessageBubble } from './MessageBubble.jsx';

function dayLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function MessageList({ messages, currentUserId, typing, onOpenMedia }) {
  const listRef = useRef(null);
  const grouped = useMemo(() => messages.reduce((items, message, index) => {
    const previous = messages[index - 1];
    if (!previous || dayLabel(previous.created_at) !== dayLabel(message.created_at)) {
      items.push({ type: 'day', label: dayLabel(message.created_at), id: `day-${message.created_at}` });
    }
    items.push({ type: 'message', message });
    return items;
  }, []), [messages]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 180;
    if (nearBottom) node.scrollTop = node.scrollHeight;
  }, [messages.length, typing]);

  return (
    <div className="message-list" ref={listRef}>
      {messages.length === 0 && <div className="empty-chat">Start a conversation</div>}
      {grouped.map((item) => item.type === 'day'
        ? <div className="day-separator" key={item.id}>{item.label}</div>
        : <MessageBubble key={item.message.id} message={item.message} mine={item.message.sender_id === currentUserId} onOpenMedia={onOpenMedia} />
      )}
      {typing && <div className="typing-indicator">typing...</div>}
    </div>
  );
}
