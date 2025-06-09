import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import PWAInstallPrompt from './components/PWAInstallPrompt.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PWAInstallPrompt />
  </StrictMode>
);