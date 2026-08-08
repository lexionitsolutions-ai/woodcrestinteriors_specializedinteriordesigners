import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { signedUrl } from '../services/storage.js';

export function MediaViewer({ items, index, onClose }) {
  const [current, setCurrent] = useState(index);
  const [url, setUrl] = useState('');
  const item = items[current];

  useEffect(() => {
    let alive = true;
    if (item?.file_path) signedUrl(item.file_path).then((value) => alive && setUrl(value)).catch(() => setUrl(''));
    return () => { alive = false; };
  }, [item]);

  if (!item) return null;

  return (
    <div className="media-viewer" role="dialog" aria-modal="true">
      <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={24} /></button>
      <button className="viewer-nav prev" type="button" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0} aria-label="Previous"><ChevronLeft /></button>
      <div className="viewer-content">
        {item.message_type === 'image' && <img src={url} alt={item.file_name || 'Shared image'} />}
        {item.message_type === 'video' && <video src={url} controls autoPlay={false} />}
        {item.message_type === 'audio' && <audio src={url} controls />}
        {item.message_type === 'file' && <a href={url} download={item.file_name}>{item.file_name || 'Download file'}</a>}
      </div>
      <button className="viewer-nav next" type="button" onClick={() => setCurrent((value) => Math.min(items.length - 1, value + 1))} disabled={current >= items.length - 1} aria-label="Next"><ChevronRight /></button>
    </div>
  );
}
