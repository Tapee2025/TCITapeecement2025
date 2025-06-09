import { useState, useEffect } from 'react';
import { Download, X, Bell, Smartphone, Share, Plus } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, notificationPermission, installApp, requestNotificationPermission } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [installPromptDismissed, setInstallPromptDismissed] = useState(false);
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(false);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    // Check if prompts were previously dismissed
    const installDismissed = localStorage.getItem('installPromptDismissed') === 'true';
    const notificationDismissed = localStorage.getItem('notificationPromptDismissed') === 'true';
    setInstallPromptDismissed(installDismissed);
    setNotificationPromptDismissed(notificationDismissed);
  }, []);

  useEffect(() => {
    // Show install prompt after 5 seconds if not installed and not dismissed
    if (!isInstalled && !installPromptDismissed && !isInStandaloneMode) {
      const timer = setTimeout(() => {
        if (isInstallable) {
          setShowInstallPrompt(true);
        } else if (isIOS) {
          setShowIOSInstructions(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, installPromptDismissed, isInStandaloneMode, isIOS]);

  useEffect(() => {
    // Show notification prompt only after user interaction and if not dismissed
    if (isInstalled && notificationPermission === 'default' && !notificationPromptDismissed) {
      const timer = setTimeout(() => {
        setShowNotificationPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, notificationPermission, notificationPromptDismissed]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowInstallPrompt(false);
      setInstallPromptDismissed(true);
      localStorage.setItem('installPromptDismissed', 'true');
    }
  };

  const handleNotificationRequest = async () => {
    const success = await requestNotificationPermission();
    setShowNotificationPrompt(false);
    setNotificationPromptDismissed(true);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setInstallPromptDismissed(true);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  const dismissIOSInstructions = () => {
    setShowIOSInstructions(false);
    setInstallPromptDismissed(true);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  const dismissNotificationPrompt = () => {
    setShowNotificationPrompt(false);
    setNotificationPromptDismissed(true);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  return (
    <>
      {/* Android/Desktop Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-primary-100 p-2 rounded-full flex-shrink-0">
                <Download className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">Install Tapee Cement App</h3>
                <p className="text-gray-600 text-xs mt-1">
                  Add to your home screen for quick access and offline features
                </p>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
                  >
                    Install App
                  </button>
                  <button
                    onClick={dismissInstallPrompt}
                    className="text-gray-500 px-3 py-1.5 rounded-lg text-xs hover:text-gray-700 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                onClick={dismissInstallPrompt}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instructions */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="bg-primary-100 p-3 rounded-full w-16 h-16 mx-auto mb-4">
                <Smartphone className="w-10 h-10 text-primary-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Install Tapee Cement App</h3>
              <p className="text-gray-600 text-sm mb-6">
                Add this app to your home screen for easy access
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xs">1</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Share className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Tap the Share button</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Look for the share icon in your browser's toolbar
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xs">2</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Plus className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Add to Home Screen</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Scroll down and tap "Add to Home Screen"
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xs">3</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Download className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Confirm Installation</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Tap "Add" to install the app on your home screen
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={dismissIOSInstructions}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Got it!
              </button>
              <button
                onClick={dismissIOSInstructions}
                className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Permission Prompt - Only show when appropriate */}
      {showNotificationPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-accent-100 p-2 rounded-full flex-shrink-0">
                <Bell className="w-5 h-5 text-accent-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">Stay Updated</h3>
                <p className="text-gray-600 text-xs mt-1">
                  Get notified about point approvals and rewards
                </p>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={handleNotificationRequest}
                    className="bg-accent-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-accent-700 transition-colors"
                  >
                    Enable
                  </button>
                  <button
                    onClick={dismissNotificationPrompt}
                    className="text-gray-500 px-3 py-1.5 rounded-lg text-xs hover:text-gray-700 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                onClick={dismissNotificationPrompt}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}