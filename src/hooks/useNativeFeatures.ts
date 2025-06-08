import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function useNativeFeatures() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Configure keyboard
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.transform = `translateY(-${info.keyboardHeight / 4}px)`;
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.transform = 'translateY(0px)';
    });

    return () => {
      Keyboard.removeAllListeners();
    };
  }, []);

  const setStatusBarStyle = (style: Style) => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style });
    }
  };

  const hapticFeedback = (style: ImpactStyle = ImpactStyle.Medium) => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style });
    }
  };

  const hideKeyboard = () => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.hide();
    }
  };

  return {
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    setStatusBarStyle,
    hapticFeedback,
    hideKeyboard
  };
}