import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';
import './styles/public.css';
import './styles/chat.css';

const root = document.getElementById('root');

try {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Woodcrest app failed to start', error);
  root.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;padding:24px;font-family:system-ui;background:#f5f1ea;color:#1d1a17"><section style="max-width:560px"><h1>Woodcrest Interiors</h1><p>We could not load the interactive website on this browser. Please refresh the page or try again in a moment.</p></section></main>';
}

if ('serviceWorker' in navigator && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {});
}
