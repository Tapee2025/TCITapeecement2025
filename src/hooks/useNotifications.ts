import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Notification as AppNotification } from '../types/notifications';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const subscribeToNotifications = useCallback(() => {
    if (!currentUser) return null;

    // Clean up previous subscription if it exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          const newNotification = payload.new as AppNotification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if permission granted
          if (Notification && Notification.permission === 'granted') {
            try {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/logo.png'
              });
            } catch (error) {
              console.error('Error showing browser notification:', error);
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;
    return subscription;
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const subscription = subscribeToNotifications();
      
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [currentUser, fetchNotifications, subscribeToNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [currentUser]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}