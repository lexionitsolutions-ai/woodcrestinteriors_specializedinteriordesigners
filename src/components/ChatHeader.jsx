import { ArrowLeft, EllipsisVertical, Images, Lock, LogOut, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PRIVATE_DISPLAY_NAME } from '../config.js';

export function ChatHeader({ online, onLock, onClear, onMedia }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="chat-header">
      <button className="icon-button" type="button" onClick={onLock} aria-label="Back">
        <ArrowLeft size={20} />
      </button>
      <div className="chat-title">
        <strong>{PRIVATE_DISPLAY_NAME}</strong>
        <span>{online ? 'Online' : 'Last active recently'}</span>
      </div>
      <div className="menu-wrap">
        <button className="icon-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Menu">
          <EllipsisVertical size={20} />
        </button>
        {open && (
          <div className="chat-menu" role="menu">
            <button type="button" onClick={() => { setOpen(false); onMedia(); }}><Images size={16} />Media</button>
            <button type="button" onClick={() => { setOpen(false); onClear(); }}><Trash2 size={16} />Clear Chat</button>
            <button type="button" onClick={() => { setOpen(false); onLock(); }}><Lock size={16} />Lock Chat</button>
            <button type="button" onClick={() => { setOpen(false); onLock(); }}><LogOut size={16} />Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}
