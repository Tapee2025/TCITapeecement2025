import { RefreshCw } from 'lucide-react';

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  lastUpdated?: Date;
  onRefresh?: () => void;
  className?: string;
}

export default function RefreshIndicator({ 
  isRefreshing, 
  lastUpdated, 
  onRefresh,
  className = '' 
}: RefreshIndicatorProps) {
  return (
    <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center space-x-1 hover:text-gray-700 transition-colors disabled:opacity-50"
        title="Refresh data"
      >
        <RefreshCw 
          size={14} 
          className={`${isRefreshing ? 'animate-spin' : ''} transition-transform`} 
        />
        <span className="text-xs">
          {isRefreshing ? 'Updating...' : 'Refresh'}
        </span>
      </button>
      {lastUpdated && !isRefreshing && (
        <span className="text-xs text-gray-400">
          Updated {lastUpdated.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}