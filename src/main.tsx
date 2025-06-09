import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import PWAInstallPrompt from './components/PWAInstallPrompt.tsx';
import ConnectionStatus from './components/ui/ConnectionStatus.tsx';
import './index.css';

// Register service worker for better caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PWAInstallPrompt />
    <ConnectionStatus />
  </StrictMode>
);