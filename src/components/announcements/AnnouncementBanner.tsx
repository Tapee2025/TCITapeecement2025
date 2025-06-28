import { useState, useEffect, useRef, useCallback } from 'react';
import { X, AlertCircle, Info, Megaphone, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Announcement } from '../../types/notifications';
import { useAuth } from '../../contexts/AuthContext';

export default function AnnouncementBanner() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .contains('target_roles', [currentUser.role])
        .lte('starts_at', new Date().toISOString())
        .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  }, [currentUser]);

  const subscribeToAnnouncements = useCallback(() => {
    if (!currentUser) return;

    // Clean up previous subscription if it exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    const subscription = supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        () => {
          // Refetch announcements when there are changes
          fetchAnnouncements();
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;
  }, [currentUser, fetchAnnouncements]);

  useEffect(() => {
    if (currentUser) {
      fetchAnnouncements();
      subscribeToAnnouncements();
      
      // Get dismissed announcements from localStorage
      const dismissed = localStorage.getItem('dismissedAnnouncements');
      if (dismissed) {
        try {
          setDismissedIds(JSON.parse(dismissed));
        } catch (error) {
          console.error('Error parsing dismissed announcements:', error);
          localStorage.removeItem('dismissedAnnouncements');
        }
      }
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [currentUser, fetchAnnouncements, subscribeToAnnouncements]);

  const handleDismiss = useCallback((announcementId: string) => {
    const newDismissed = [...dismissedIds, announcementId];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  }, [dismissedIds]);

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'urgent': return AlertCircle;
      case 'promotion': return Star;
      case 'feature': return Megaphone;
      default: return Info;
    }
  };

  const getAnnouncementStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-error-100 border-error-500 text-error-800';
      case 'high':
        return 'bg-warning-100 border-warning-500 text-warning-800';
      case 'medium':
        return 'bg-primary-100 border-primary-500 text-primary-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const activeAnnouncements = announcements.filter(
    announcement => !dismissedIds.includes(announcement.id)
  );

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2">
      {activeAnnouncements.map((announcement) => {
        const Icon = getAnnouncementIcon(announcement.type);
        
        return (
          <div
            key={announcement.id}
            className={`border-l-4 p-4 rounded-r-lg ${getAnnouncementStyle(announcement.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Icon size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">{announcement.title}</h4>
                  <div 
                    className="text-sm mt-1"
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />
                </div>
              </div>
              <button
                onClick={() => handleDismiss(announcement.id)}
                className="text-current opacity-70 hover:opacity-100 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}