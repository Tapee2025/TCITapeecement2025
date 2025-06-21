import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Search, Plus, Edit, Trash, Calendar, Award } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { USER_ROLES } from '../../utils/constants';

type Reward = Database['public']['Tables']['rewards']['Row'];

export default function AdminRewards() {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    points_required: '',
    expiry_date: '',
    available: true,
    visible_to: ['builder', 'contractor'] as ('builder' | 'contractor' | 'dealer')[]
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  async function fetchRewards() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  }

  const filteredRewards = rewards.filter(reward => {
    const searchString = searchQuery.toLowerCase();
    return (
      reward.title.toLowerCase().includes(searchString) ||
      reward.description.toLowerCase().includes(searchString)
    );
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    
    if (!formData.image_url.trim()) {
      toast.error('Image URL is required');
      return;
    }
    
    if (!formData.points_required || parseInt(formData.points_required) <= 0) {
      toast.error('Points required must be a positive number');
      return;
    }
    
    if (!formData.expiry_date) {
      toast.error('Expiry date is required');
      return;
    }
    
    if (formData.visible_to.length === 0) {
      toast.error('Please select at least one user type');
      return;
    }

    // Check if expiry date is in the future
    const expiryDate = new Date(formData.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (expiryDate < today) {
      toast.error('Expiry date must be in the future');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const rewardData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        image_url: formData.image_url.trim(),
        points_required: parseInt(formData.points_required),
        expiry_date: formData.expiry_date,
        available: formData.available,
        visible_to: formData.visible_to
      };

      if (editingReward) {
        const { error } = await supabase
          .from('rewards')
          .update({
            ...rewardData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReward.id);

        if (error) throw error;
        toast.success('Reward updated successfully');
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert([{
            ...rewardData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
        toast.success('Reward created successfully');
      }

      setShowAddModal(false);
      setEditingReward(null);
      resetForm();
      fetchRewards();
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error('Failed to save reward. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReward(rewardId: string) {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', rewardId);

      if (error) throw error;
      toast.success('Reward deleted successfully');
      fetchRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Failed to delete reward');
    }
  }

  function handleEdit(reward: Reward) {
    setEditingReward(reward);
    setFormData({
      title: reward.title,
      description: reward.description,
      image_url: reward.image_url,
      points_required: reward.points_required.toString(),
      expiry_date: format(new Date(reward.expiry_date), 'yyyy-MM-dd'),
      available: reward.available,
      visible_to: reward.visible_to || ['builder', 'contractor']
    });
    setShowAddModal(true);
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      points_required: '',
      expiry_date: '',
      available: true,
      visible_to: ['builder', 'contractor']
    });
  }

  function openAddModal() {
    setEditingReward(null);
    resetForm();
    setShowAddModal(true);
  }

  function handleVisibleToChange(role: 'builder' | 'contractor' | 'dealer') {
    const currentVisibleTo = [...formData.visible_to];
    if (currentVisibleTo.includes(role)) {
      // Don't allow deselecting if it's the last selected role
      if (currentVisibleTo.length === 1) {
        toast.warning('At least one user type must be selected');
        return;
      }
      setFormData({
        ...formData,
        visible_to: currentVisibleTo.filter(r => r !== role)
      });
    } else {
      setFormData({
        ...formData,
        visible_to: [...currentVisibleTo, role]
      });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Rewards</h1>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add New Reward
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search rewards..."
              className="form-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRewards.map((reward) => (
          <div key={reward.id} className="bg-white rounded-lg shadow overflow-hidden">
            <img
              src={reward.image_url}
              alt={reward.title}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found';
              }}
            />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{reward.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  reward.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {reward.available ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-primary-600">
                  <Award size={16} className="mr-1" />
                  <span className="font-semibold">{reward.points_required} Points</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar size={16} className="mr-1" />
                  <span>Expires: {format(new Date(reward.expiry_date), 'MMM dd, yyyy')}</span>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500">Visible to:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {reward.visible_to?.map(role => (
                    <span key={role} className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 capitalize">
                      {role}s
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(reward)}
                  className="btn btn-outline btn-sm"
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteReward(reward.id)}
                  className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash size={16} className="mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRewards.length === 0 && (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <Award size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Rewards Found</h3>
          <p className="text-gray-500">
            {searchQuery 
              ? `No rewards match your search for "${searchQuery}"`
              : 'Start by adding your first reward'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingReward ? 'Edit Reward' : 'Add New Reward'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter reward title"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter reward description"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Image URL *</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use a high-quality image URL (recommended: 400x200px or larger)
                  </p>
                </div>
                <div>
                  <label className="form-label">Points Required *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.points_required}
                    onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
                    placeholder="Enter points required"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="form-label">Visible to *</label>
                  <div className="space-y-2">
                    {USER_ROLES.map(role => (
                      <label key={role.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.visible_to.includes(role.value as 'builder' | 'contractor' | 'dealer')}
                          onChange={() => handleVisibleToChange(role.value as 'builder' | 'contractor' | 'dealer')}
                          className="form-checkbox"
                        />
                        <span>{role.label}s</span>
                      </label>
                    ))}
                  </div>
                  {formData.visible_to.length === 0 && (
                    <p className="text-sm text-error-600 mt-1">
                      Please select at least one user type
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    className="mr-2"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  />
                  <label htmlFor="available" className="text-sm text-gray-700">
                    Make reward available immediately
                  </label>
                </div>

                {/* Preview */}
                {formData.image_url && formData.title && (
                  <div>
                    <label className="form-label">Preview</label>
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                        }}
                      />
                      <div className="p-3 bg-gray-50">
                        <p className="font-medium text-gray-900">{formData.title}</p>
                        {formData.description && (
                          <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                        )}
                        {formData.points_required && (
                          <p className="text-sm text-primary-600 mt-1 font-medium">
                            {formData.points_required} Points Required
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingReward(null);
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
                    disabled={submitting || formData.visible_to.length === 0}
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {editingReward ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingReward ? 'Update Reward' : 'Create Reward'
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