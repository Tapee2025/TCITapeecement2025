import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { checkConnection, recoverConnection } from '../../lib/supabase';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  const checkSupabaseConnection = useCallback(async () => {
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
  }, [isOnline, showStatus]);

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
  }, [checkSupabaseConnection]);

  const handleRecoverConnection = async () => {
    setIsRecovering(true);
    try {
      const recovered = await recoverConnection();
      if (recovered) {
        setIsConnected(true);
        setTimeout(() => setShowStatus(false), 3000);
      }
    } catch (error) {
      console.error('Error recovering connection:', error);
    } finally {
      setIsRecovering(false);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {!isOnline ? (
            <WifiOff className="w-5 h-5 text-error-600 mr-2" />
          ) : !isConnected ? (
            <AlertCircle className="w-5 h-5 text-error-600 mr-2" />
          ) : (
            <Wifi className="w-5 h-5 text-success-600 mr-2" />
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
        
        {(!isOnline || !isConnected) && (
          <button
            onClick={handleRecoverConnection}
            disabled={isRecovering}
            className="ml-3 p-1 rounded-full bg-white text-error-600 hover:bg-error-50 transition-colors"
          >
            <RefreshCw size={16} className={isRecovering ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    </div>
  );
}