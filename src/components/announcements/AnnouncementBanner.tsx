import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, AlertCircle, Info, Megaphone } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'maintenance' | 'feature' | 'promotion' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchAnnouncements();
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated and has a role
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's role from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user role:', userError);
        setError('Failed to fetch user information');
        setLoading(false);
        return;
      }

      if (!userData?.role) {
        setLoading(false);
        return;
      }

      // Fetch active announcements for the user's role
      const now = new Date().toISOString();
      const { data, error: fetchError } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .contains('target_roles', [userData.role])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching announcements:', fetchError);
        setError('Failed to fetch announcements');
        setLoading(false);
        return;
      }

      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Network error while fetching announcements');
    } finally {
      setLoading(false);
    }
  };

  const dismissAnnouncement = (id: string) => {
    setDismissedAnnouncements(prev => new Set([...prev, id]));
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="h-5 w-5" />;
      case 'maintenance':
        return <AlertCircle className="h-5 w-5" />;
      case 'feature':
        return <Info className="h-5 w-5" />;
      case 'promotion':
        return <Megaphone className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAnnouncementStyles = (type: string, priority: string) => {
    const baseStyles = "border-l-4 p-4 mb-4 rounded-r-lg shadow-sm";
    
    if (priority === 'urgent' || type === 'urgent') {
      return `${baseStyles} bg-red-50 border-red-500 text-red-800`;
    }
    
    switch (type) {
      case 'maintenance':
        return `${baseStyles} bg-yellow-50 border-yellow-500 text-yellow-800`;
      case 'feature':
        return `${baseStyles} bg-blue-50 border-blue-500 text-blue-800`;
      case 'promotion':
        return `${baseStyles} bg-green-50 border-green-500 text-green-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-500 text-gray-800`;
    }
  };

  // Don't render anything if loading, error, or no announcements
  if (loading || error || announcements.length === 0) {
    return null;
  }

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedAnnouncements.has(announcement.id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={getAnnouncementStyles(announcement.type, announcement.priority)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAnnouncementIcon(announcement.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  {announcement.title}
                </h3>
                <p className="text-sm opacity-90">
                  {announcement.content}
                </p>
              </div>
            </div>
            <button
              onClick={() => dismissAnnouncement(announcement.id)}
              className="flex-shrink-0 ml-4 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}