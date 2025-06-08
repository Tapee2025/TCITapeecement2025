import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapacitorApp } from '@capacitor/app';
import App from './App.tsx';
import './index.css';

// Register service worker for PWA
if (!Capacitor.isNativePlatform()) {
  registerSW({ immediate: true });
}

// Configure native app features
if (Capacitor.isNativePlatform()) {
  // Configure status bar
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#2979f2' });
  
  // Hide splash screen after app loads
  SplashScreen.hide();
  
  // Handle app state changes
  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    console.log('App state changed. Is active?', isActive);
  });
  
  // Handle app URL open
  CapacitorApp.addListener('appUrlOpen', (event) => {
    console.log('App opened with URL:', event);
  });
  
  // Handle back button
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      CapacitorApp.exitApp();
    } else {
      window.history.back();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);