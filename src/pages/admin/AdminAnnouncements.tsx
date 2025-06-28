import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Megaphone, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Announcement } from '../../types/notifications';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';

export default function AdminAnnouncements() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general' as const,
    target_roles: ['dealer', 'contractor'],
    priority: 'medium' as const,
    starts_at: '',
    ends_at: '',
    is_active: true
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          creator:users!announcements_created_by_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;

    setSubmitting(true);
    try {
      const announcementData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        target_roles: formData.target_roles,
        priority: formData.priority,
        starts_at: formData.starts_at || new Date().toISOString(),
        ends_at: formData.ends_at || null,
        is_active: formData.is_active,
        created_by: currentUser.id
      };

      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        toast.success('Announcement updated successfully');
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([announcementData]);

        if (error) throw error;
        toast.success('Announcement created successfully');
      }

      setShowModal(false);
      setEditingAnnouncement(null);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(announcementId: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  }

  async function toggleActive(announcementId: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !isActive })
        .eq('id', announcementId);

      if (error) throw error;
      toast.success(`Announcement ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error('Failed to update announcement');
    }
  }

  function openModal(announcement?: Announcement) {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        target_roles: announcement.target_roles,
        priority: announcement.priority,
        starts_at: announcement.starts_at.split('T')[0],
        ends_at: announcement.ends_at ? announcement.ends_at.split('T')[0] : '',
        is_active: announcement.is_active
      });
    } else {
      setEditingAnnouncement(null);
      resetForm();
    }
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      title: '',
      content: '',
      type: 'general',
      target_roles: ['dealer', 'contractor'],
      priority: 'medium',
      starts_at: '',
      ends_at: '',
      is_active: true
    });
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'promotion': return 'bg-green-100 text-green-800';
      case 'feature': return 'bg-purple-100 text-purple-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">Manage company-wide announcements and notifications</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          New Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {announcements.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                        {announcement.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(announcement.type)}`}>
                        {announcement.type}
                      </span>
                      {announcement.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div 
                      className="text-gray-600 mb-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: announcement.content }}
                    />
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Target: {announcement.target_roles.join(', ')}</span>
                      <span>•</span>
                      <span>Starts: {new Date(announcement.starts_at).toLocaleDateString()}</span>
                      {announcement.ends_at && (
                        <>
                          <span>•</span>
                          <span>Ends: {new Date(announcement.ends_at).toLocaleDateString()}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Created: {new Date(announcement.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleActive(announcement.id, announcement.is_active)}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                      title={announcement.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {announcement.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => openModal(announcement)}
                      className="p-2 text-blue-600 hover:text-blue-900 rounded-lg hover:bg-blue-50"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-red-600 hover:text-red-900 rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Megaphone size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Announcements</h3>
            <p className="text-gray-500 mb-4">Create your first announcement to notify users</p>
            <button
              onClick={() => openModal()}
              className="btn btn-primary"
            >
              <Plus size={20} className="mr-2" />
              Create Announcement
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Content *</label>
                  <textarea
                    className="form-input"
                    rows={5}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    HTML formatting is supported for rich text
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Type</label>
                    <select
                      className="form-input"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <option value="general">General</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="feature">New Feature</option>
                      <option value="promotion">Promotion</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Priority</label>
                    <select
                      className="form-input"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="form-label">Target Audience</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.target_roles.includes('dealer')}
                        onChange={(e) => {
                          const newRoles = e.target.checked
                            ? [...formData.target_roles, 'dealer']
                            : formData.target_roles.filter(r => r !== 'dealer');
                          setFormData({ ...formData, target_roles: newRoles });
                        }}
                      />
                      <span>Dealers</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.target_roles.includes('contractor')}
                        onChange={(e) => {
                          const newRoles = e.target.checked
                            ? [...formData.target_roles, 'contractor']
                            : formData.target_roles.filter(r => r !== 'contractor');
                          setFormData({ ...formData, target_roles: newRoles });
                        }}
                      />
                      <span>Contractors</span>
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">End Date (Optional)</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_active">
                    Make announcement active
                  </label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingAnnouncement(null);
                      resetForm();
                    }}
                    className="btn btn-outline"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {editingAnnouncement ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingAnnouncement ? 'Update Announcement' : 'Create Announcement'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}