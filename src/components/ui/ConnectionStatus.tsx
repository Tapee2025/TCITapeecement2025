import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineStatus, setShowOfflineStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineStatus(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineStatus(true);
      
      // Hide offline status after 10 seconds
      setTimeout(() => {
        setShowOfflineStatus(false);
      }, 10000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show status when actually offline (no internet)
  if (!showOfflineStatus || isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg transition-all duration-300 bg-error-100 border border-error-200">
      <div className="flex items-center">
        <WifiOff className="w-5 h-5 text-error-600 mr-2" />
        <span className="text-sm font-medium text-error-700">
          No internet connection
        </span>
      </div>
    </div>
  );
}