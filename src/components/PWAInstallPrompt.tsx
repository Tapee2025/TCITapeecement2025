import { useState, useEffect } from 'react';
import { Download, X, Bell } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, notificationPermission, installApp, requestNotificationPermission } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [installPromptDismissed, setInstallPromptDismissed] = useState(false);
  const [notificationPromptDismissed, setNotificationPromptDismissed] = useState(false);

  useEffect(() => {
    // Show install prompt after 3 seconds if installable and not dismissed
    if (isInstallable && !installPromptDismissed) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, installPromptDismissed]);

  useEffect(() => {
    // Show notification prompt after app is installed or after 5 seconds
    if ((isInstalled || !isInstallable) && notificationPermission === 'default' && !notificationPromptDismissed) {
      const timer = setTimeout(() => {
        setShowNotificationPrompt(true);
      }, isInstalled ? 2000 : 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, isInstallable, notificationPermission, notificationPromptDismissed]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setShowInstallPrompt(false);
      // Show notification prompt after successful install
      setTimeout(() => {
        if (notificationPermission === 'default' && !notificationPromptDismissed) {
          setShowNotificationPrompt(true);
        }
      }, 2000);
    }
  };

  const handleNotificationRequest = async () => {
    await requestNotificationPermission();
    setShowNotificationPrompt(false);
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setInstallPromptDismissed(true);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  const dismissNotificationPrompt = () => {
    setShowNotificationPrompt(false);
    setNotificationPromptDismissed(true);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  // Check if prompts were previously dismissed
  useEffect(() => {
    const installDismissed = localStorage.getItem('installPromptDismissed') === 'true';
    const notificationDismissed = localStorage.getItem('notificationPromptDismissed') === 'true';
    setInstallPromptDismissed(installDismissed);
    setNotificationPromptDismissed(notificationDismissed);
  }, []);

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-primary-100 p-2 rounded-full">
                <Download className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Install Tapee Cement App</h3>
                <p className="text-gray-600 text-xs mt-1">
                  Add to your home screen for quick access and offline features
                </p>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="bg-primary-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-primary-700 transition-colors"
                  >
                    Install
                  </button>
                  <button
                    onClick={dismissInstallPrompt}
                    className="text-gray-500 px-3 py-1.5 rounded text-xs hover:text-gray-700 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                onClick={dismissInstallPrompt}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Permission Prompt */}
      {showNotificationPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-accent-100 p-2 rounded-full">
                <Bell className="w-5 h-5 text-accent-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Enable Notifications</h3>
                <p className="text-gray-600 text-xs mt-1">
                  Get notified about point approvals, rewards, and important updates
                </p>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={handleNotificationRequest}
                    className="bg-accent-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-accent-700 transition-colors"
                  >
                    Allow
                  </button>
                  <button
                    onClick={dismissNotificationPrompt}
                    className="text-gray-500 px-3 py-1.5 rounded text-xs hover:text-gray-700 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                onClick={dismissNotificationPrompt}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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