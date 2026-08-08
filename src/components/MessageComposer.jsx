import { Paperclip, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { MAX_AUDIO_MB, MAX_FILE_MB, MAX_IMAGE_MB, MAX_VIDEO_MB } from '../config.js';
import { sendMessage } from '../services/chat.js';
import { uploadPrivateFile } from '../services/storage.js';
import { AttachmentMenu } from './AttachmentMenu.jsx';
import { VoiceRecorder } from './VoiceRecorder.jsx';

function typeFor(file) {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'file';
}

function limitFor(type) {
  return { image: MAX_IMAGE_MB, video: MAX_VIDEO_MB, audio: MAX_AUDIO_MB, file: MAX_FILE_MB }[type];
}

export function MessageComposer({ session, onTyping, onSent }) {
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState('');
  const typingTimer = useRef(null);

  async function submitText() {
    const content = text.trim();
    if (!content) return;
    setText('');
    try {
      const message = await sendMessage(session, { sender_id: session.user.id, receiver_id: session.participant.id, message_type: 'text', text_content: content, delivered_at: new Date().toISOString() });
      onSent?.(message);
    } catch (error) {
      setText(content);
      setStatus('Message could not be sent. Please try again.');
      console.error('Message send failed', error);
    }
  }

  async function submitFile(file, duration) {
    const messageType = typeFor(file);
    const max = limitFor(messageType);
    if (file.size > max * 1024 * 1024) {
      setStatus(`File is larger than ${max} MB.`);
      return;
    }
    try {
      setStatus('Uploading...');
      const filePath = await uploadPrivateFile(file, session);
      await sendMessage(session, {
        sender_id: session.user.id,
        receiver_id: session.participant.id,
        message_type: messageType,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        duration: duration || null,
        delivered_at: new Date().toISOString()
      }).then((message) => onSent?.(message));
      setStatus('');
      setMenuOpen(false);
    } catch {
      setStatus('Upload failed. Please try again.');
    }
  }

  function updateText(value) {
    setText(value);
    onTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => onTyping(false), 1000);
  }

  return (
    <footer className="composer">
      {menuOpen && <AttachmentMenu onSelect={submitFile} />}
      {status && <div className="upload-status">{status}</div>}
      <button className="icon-button" type="button" aria-label="Attach file" onClick={() => setMenuOpen((value) => !value)}><Paperclip size={20} /></button>
      <textarea
        value={text}
        rows="1"
        placeholder="Message..."
        onChange={(event) => updateText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submitText();
          }
        }}
      />
      <VoiceRecorder onReady={submitFile} />
      <button className="send-button" type="button" aria-label="Send" onClick={submitText}><Send size={19} /></button>
    </footer>
  );
}
