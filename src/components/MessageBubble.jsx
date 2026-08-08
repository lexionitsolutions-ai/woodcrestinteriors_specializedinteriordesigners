import { Check, CheckCheck, Download, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { signedUrl } from '../services/storage.js';

function Delivery({ message }) {
  if (message.seen_at) return <CheckCheck size={14} aria-label="seen" />;
  if (message.delivered_at) return <CheckCheck size={14} aria-label="delivered" />;
  return <Check size={14} aria-label="sent" />;
}

export function MessageBubble({ message, mine, onOpenMedia }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let alive = true;
    if (message.file_path) signedUrl(message.file_path).then((value) => alive && setUrl(value)).catch(() => {});
    return () => { alive = false; };
  }, [message.file_path]);

  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const media = message.message_type === 'image'
    ? <button className="media-thumb" type="button" onClick={() => onOpenMedia(message)}><img src={url} alt={message.file_name || 'Shared image'} loading="lazy" /></button>
    : message.message_type === 'video'
      ? <video controls preload="metadata" src={url} />
      : message.message_type === 'audio'
        ? <audio controls src={url} />
        : message.file_path
          ? <a className="file-chip" href={url} download={message.file_name}><FileText size={18} />{message.file_name || 'Download file'}<Download size={16} /></a>
          : null;

  return (
    <article className={mine ? 'message mine' : 'message'}>
      <div className="bubble">
        {media}
        {message.text_content && <p>{message.text_content}</p>}
        <footer><span>{time}</span>{mine && <Delivery message={message} />}</footer>
      </div>
    </article>
  );
}
