import { FileAudio, FileText, Image, Video } from 'lucide-react';

const options = [
  ['Photo', 'image/*', Image],
  ['Video', 'video/mp4,video/webm,video/quicktime', Video],
  ['Audio', 'audio/*', FileAudio],
  ['Document', '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip', FileText]
];

export function AttachmentMenu({ onSelect }) {
  return (
    <div className="attachment-menu">
      {options.map(([label, accept, Icon]) => (
        <label key={label}>
          <Icon size={18} />
          <span>{label}</span>
          <input type="file" accept={accept} hidden onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelect(file);
            event.target.value = '';
          }} />
        </label>
      ))}
    </div>
  );
}
