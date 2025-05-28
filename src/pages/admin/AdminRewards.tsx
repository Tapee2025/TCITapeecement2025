import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Search, Plus, Edit, Trash, Calendar, Award } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

type Reward = Database['public']['Tables']['rewards']['Row'];

export default function AdminRewards() {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    points_required: '',
    expiry_date: '',
    available: true
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
    
    try {
      const rewardData = {
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        points_required: parseInt(formData.points_required),
        expiry_date: formData.expiry_date,
        available: formData.available
      };

      if (editingReward) {
        const { error } = await supabase
          .from('rewards')
          .update(rewardData)
          .eq('id', editingReward.id);

        if (error) throw error;
        toast.success('Reward updated successfully');
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert([rewardData]);

        if (error) throw error;
        toast.success('Reward created successfully');
      }

      setShowAddModal(false);
      setEditingReward(null);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        points_required: '',
        expiry_date: '',
        available: true
      });
      fetchRewards();
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error('Failed to save reward');
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
      available: reward.available
    });
    setShowAddModal(true);
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
          onClick={() => setShowAddModal(true)}
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-primary-600">
                  <Award size={16} className="mr-1" />
                  <span className="font-semibold">{reward.points_required} Points</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar size={16} className="mr-1" />
                  <span>Expires: {format(new Date(reward.expiry_date), 'MMM dd, yyyy')}</span>
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
                  className="btn btn-error btn-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingReward ? 'Edit Reward' : 'Add New Reward'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Points Required</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.points_required}
                    onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required
                  />
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
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingReward(null);
                    }}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingReward ? 'Update Reward' : 'Create Reward'}
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