import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { checkConnection } from '../../lib/supabase';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkSupabaseConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsConnected(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection check
    checkSupabaseConnection();

    // Periodic connection check
    const interval = setInterval(checkSupabaseConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkSupabaseConnection = async () => {
    try {
      const connected = await checkConnection();
      setIsConnected(connected);
      
      if (!connected && isOnline) {
        setShowStatus(true);
      } else if (connected && showStatus) {
        // Hide status after 3 seconds when connection is restored
        setTimeout(() => setShowStatus(false), 3000);
      }
    } catch (error) {
      setIsConnected(false);
      setShowStatus(true);
    }
  };

  if (!showStatus && isOnline && isConnected) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg transition-all duration-300 ${
      !isOnline || !isConnected 
        ? 'bg-error-100 border border-error-200' 
        : 'bg-success-100 border border-success-200'
    }`}>
      <div className="flex items-center space-x-2">
        {!isOnline ? (
          <WifiOff className="w-5 h-5 text-error-600" />
        ) : !isConnected ? (
          <AlertCircle className="w-5 h-5 text-error-600" />
        ) : (
          <Wifi className="w-5 h-5 text-success-600" />
        )}
        
        <span className={`text-sm font-medium ${
          !isOnline || !isConnected ? 'text-error-700' : 'text-success-700'
        }`}>
          {!isOnline 
            ? 'No internet connection' 
            : !isConnected 
            ? 'Connection issues' 
            : 'Connection restored'
          }
        </span>
      </div>
    </div>
  );
}