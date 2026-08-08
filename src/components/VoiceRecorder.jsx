import { Mic, Square, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

export function VoiceRecorder({ onReady }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks.current = [];
    recorder.current = new MediaRecorder(stream);
    recorder.current.ondataavailable = (event) => chunks.current.push(event.data);
    recorder.current.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks.current, { type: recorder.current.mimeType || 'audio/webm' });
      onReady(new File([blob], `voice-${Date.now()}.webm`, { type: blob.type }), seconds);
    };
    recorder.current.start();
    setRecording(true);
    setSeconds(0);
    timer.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
  }

  function stop(send) {
    window.clearInterval(timer.current);
    setRecording(false);
    if (send) recorder.current?.stop();
    else {
      recorder.current?.stream?.getTracks().forEach((track) => track.stop());
      chunks.current = [];
    }
  }

  if (!recording) {
    return <button className="icon-button" type="button" onClick={start} aria-label="Record voice note"><Mic size={20} /></button>;
  }

  return (
    <div className="recording-bar">
      <span>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span>
      <button type="button" onClick={() => stop(true)} aria-label="Stop and send"><Square size={16} /></button>
      <button type="button" onClick={() => stop(false)} aria-label="Cancel recording"><Trash2 size={16} /></button>
    </div>
  );
}
