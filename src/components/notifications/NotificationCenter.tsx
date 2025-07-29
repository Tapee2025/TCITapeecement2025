import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, ExternalLink, Info, CheckCircle, AlertTriangle, AlertCircle, Gift, TrendingUp } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Notification as AppNotification } from '../../types/notifications';

export default function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  // Refresh notifications when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.notification-panel') && !target.closest('.notification-toggle')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-error-500" />;
      case 'achievement': return <Gift className="h-5 w-5 text-purple-500" />;
      case 'reward': return <Gift className="h-5 w-5 text-accent-500" />;
      case 'transaction': return <TrendingUp className="h-5 w-5 text-primary-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-success-500 bg-success-50';
      case 'warning': return 'border-l-warning-500 bg-warning-50';
      case 'error': return 'border-l-error-500 bg-error-50';
      case 'achievement': return 'border-l-purple-500 bg-purple-50';
      case 'reward': return 'border-l-accent-500 bg-accent-50';
      case 'transaction': return 'border-l-primary-500 bg-primary-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // For mobile, show notification detail view
    if (window.innerWidth < 768) {
      setSelectedNotification(notification);
    }
  };

  const closeDetailView = () => {
    setSelectedNotification(null);
  };

  // Filter notifications to show only recent ones unless showAllNotifications is true
  const displayedNotifications = showAllNotifications 
    ? notifications 
    : notifications.slice(0, 5);

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="notification-toggle relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="notification-panel fixed md:absolute z-50 inset-0 md:inset-auto md:right-0 md:top-full md:mt-2 bg-white md:rounded-lg shadow-xl border border-gray-200 w-full md:w-96 max-h-screen md:max-h-[85vh] flex flex-col md:transform md:translate-x-0">
          {/* Mobile Back Button (only shown when viewing a notification detail) */}
          {selectedNotification && window.innerWidth < 768 ? (
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <button
                onClick={closeDetailView}
                className="flex items-center text-gray-600"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to notifications
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-900 text-lg">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                  >
                    <CheckCheck size={14} className="mr-1" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Notification Detail View (Mobile) */}
          {selectedNotification && window.innerWidth < 768 ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className={`p-4 rounded-lg mb-2 ${getNotificationColor(selectedNotification.type)}`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-medium text-gray-900 break-words">{selectedNotification.title}</h4>
                    <p className="text-gray-700 mt-1 break-words">{selectedNotification.message}</p>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-2">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(selectedNotification.created_at), { addSuffix: true })}
                      </span>
                      {selectedNotification.action_url && (
                        <Link
                          to={selectedNotification.action_url}
                          className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                          onClick={() => setIsOpen(false)}
                        >
                          {selectedNotification.action_text || 'View'}
                          <ExternalLink size={14} className="ml-1" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Notification List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-100 max-h-[60vh] md:max-h-[65vh] overflow-y-auto">
                    {displayedNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                          !notification.read ? 'bg-blue-50/50' : ''
                        } ${!notification.read ? 'border-l-primary-500' : 'border-l-transparent'}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex justify-between items-start">
                              <h4 className={`text-sm font-medium break-words pr-2 flex-1 ${
                                !notification.read ? 'text-gray-900 font-semibold' : 'text-gray-900'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="ml-2 flex-shrink-0 text-primary-600 hover:text-primary-700 p-1.5 rounded-full hover:bg-primary-50 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                            </div>
                            <p className={`text-sm mt-1 break-words line-clamp-2 ${
                              !notification.read ? 'text-gray-700' : 'text-gray-600'
                            }`}>
                              {notification.message}
                            </p>
                            <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              {notification.action_url && window.innerWidth >= 768 && (
                                <Link
                                  to={notification.action_url}
                                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                  }}
                                >
                                  {notification.action_text || 'View'}
                                  <ExternalLink size={12} className="ml-1" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <Bell size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">No notifications yet</p>
                    <p className="text-sm text-gray-500 mt-1">You'll see updates about your rewards here</p>
                  </div>
                )}
              </div>

              {/* Footer with View All/View Less toggle */}
              {notifications.length > 5 && (
                <div className="p-4 border-t border-gray-200 text-center bg-gray-50">
                  <button
                    onClick={() => setShowAllNotifications(!showAllNotifications)}
                    className="text-sm text-primary-600 hover:text-primary-700 px-3 py-2 rounded hover:bg-primary-50 transition-colors font-medium"
                  >
                    {showAllNotifications ? 'Show less' : `View all (${notifications.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}