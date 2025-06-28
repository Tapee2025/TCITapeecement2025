import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Trophy, Star, Target, Zap, Award, Gift, Package, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Achievement } from '../../types/notifications';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'trophy',
    badge_color: 'yellow',
    points_threshold: '',
    bags_threshold: '',
    transactions_threshold: '',
    category: 'points' as const,
    is_active: true
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  async function fetchAchievements() {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('points_threshold', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const achievementData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        badge_color: formData.badge_color,
        points_threshold: formData.points_threshold ? parseInt(formData.points_threshold) : null,
        bags_threshold: formData.bags_threshold ? parseInt(formData.bags_threshold) : null,
        transactions_threshold: formData.transactions_threshold ? parseInt(formData.transactions_threshold) : null,
        category: formData.category,
        is_active: formData.is_active
      };

      if (editingAchievement) {
        const { error } = await supabase
          .from('achievements')
          .update(achievementData)
          .eq('id', editingAchievement.id);

        if (error) throw error;
        toast.success('Achievement updated successfully');
      } else {
        const { error } = await supabase
          .from('achievements')
          .insert([{
            ...achievementData,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        toast.success('Achievement created successfully');
      }

      setShowModal(false);
      setEditingAchievement(null);
      resetForm();
      fetchAchievements();
    } catch (error) {
      console.error('Error saving achievement:', error);
      toast.error('Failed to save achievement');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(achievementId: string) {
    if (!confirm('Are you sure you want to delete this achievement?')) return;

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', achievementId);

      if (error) throw error;
      toast.success('Achievement deleted successfully');
      fetchAchievements();
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast.error('Failed to delete achievement');
    }
  }

  function openModal(achievement?: Achievement) {
    if (achievement) {
      setEditingAchievement(achievement);
      setFormData({
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        badge_color: achievement.badge_color,
        points_threshold: achievement.points_threshold?.toString() || '',
        bags_threshold: achievement.bags_threshold?.toString() || '',
        transactions_threshold: achievement.transactions_threshold?.toString() || '',
        category: achievement.category,
        is_active: achievement.is_active
      });
    } else {
      setEditingAchievement(null);
      resetForm();
    }
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      icon: 'trophy',
      badge_color: 'yellow',
      points_threshold: '',
      bags_threshold: '',
      transactions_threshold: '',
      category: 'points',
      is_active: true
    });
  }

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'star': return <Star size={24} />;
      case 'target': return <Target size={24} />;
      case 'zap': return <Zap size={24} />;
      case 'award': return <Award size={24} />;
      case 'gift': return <Gift size={24} />;
      case 'package': return <Package size={24} />;
      case 'trending-up': return <TrendingUp size={24} />;
      default: return <Trophy size={24} />;
    }
  };

  const categories = ['all', ...new Set(achievements.map(a => a.category))];

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Manage Achievements</h1>
          <p className="text-gray-600">Create and manage gamification achievements</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Add New Achievement
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
              selectedCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? 'All Categories' : category}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`bg-white rounded-lg shadow-sm border p-6 ${
              !achievement.is_active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-full bg-${achievement.badge_color}-100 text-${achievement.badge_color}-600`}>
                {getAchievementIcon(achievement.icon)}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openModal(achievement)}
                  className="p-1 text-blue-600 hover:text-blue-900 rounded-lg hover:bg-blue-50"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(achievement.id)}
                  className="p-1 text-red-600 hover:text-red-900 rounded-lg hover:bg-red-50"
                  title="Delete"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>

            <h3 className="font-semibold mb-2 text-gray-900">{achievement.title}</h3>
            <p className="text-sm mb-4 text-gray-600">{achievement.description}</p>

            {/* Achievement Details */}
            <div className="space-y-2 text-sm">
              {achievement.points_threshold && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Points Threshold:</span>
                  <span className="font-medium">{achievement.points_threshold}</span>
                </div>
              )}
              {achievement.bags_threshold && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Bags Threshold:</span>
                  <span className="font-medium">{achievement.bags_threshold}</span>
                </div>
              )}
              {achievement.transactions_threshold && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Transactions Threshold:</span>
                  <span className="font-medium">{achievement.transactions_threshold}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${achievement.badge_color}-100 text-${achievement.badge_color}-800`}>
                {achievement.category}
              </span>
              {!achievement.is_active && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  Inactive
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Achievements Found</h3>
          <p className="text-gray-500 mb-4">
            {selectedCategory !== 'all'
              ? `No achievements in the "${selectedCategory}" category`
              : 'Create your first achievement to engage users'}
          </p>
          <button
            onClick={() => openModal()}
            className="btn btn-primary"
          >
            <Plus size={20} className="mr-2" />
            Create Achievement
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingAchievement ? 'Edit Achievement' : 'Create Achievement'}
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
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Icon</label>
                    <select
                      className="form-input"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    >
                      <option value="trophy">Trophy</option>
                      <option value="star">Star</option>
                      <option value="target">Target</option>
                      <option value="zap">Zap</option>
                      <option value="award">Award</option>
                      <option value="gift">Gift</option>
                      <option value="package">Package</option>
                      <option value="trending-up">Trending Up</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Badge Color</label>
                    <select
                      className="form-input"
                      value={formData.badge_color}
                      onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                    >
                      <option value="yellow">Yellow</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="red">Red</option>
                      <option value="purple">Purple</option>
                      <option value="pink">Pink</option>
                      <option value="indigo">Indigo</option>
                      <option value="gray">Gray</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="form-label">Category *</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    required
                  >
                    <option value="points">Points</option>
                    <option value="bags">Bags</option>
                    <option value="transactions">Transactions</option>
                    <option value="loyalty">Loyalty</option>
                    <option value="special">Special</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Points Threshold</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.points_threshold}
                      onChange={(e) => setFormData({ ...formData, points_threshold: e.target.value })}
                      min="0"
                      placeholder="Optional"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Bags Threshold</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.bags_threshold}
                      onChange={(e) => setFormData({ ...formData, bags_threshold: e.target.value })}
                      min="0"
                      placeholder="Optional"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Transactions Threshold</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.transactions_threshold}
                      onChange={(e) => setFormData({ ...formData, transactions_threshold: e.target.value })}
                      min="0"
                      placeholder="Optional"
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
                    Make achievement active
                  </label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingAchievement(null);
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
                        {editingAchievement ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingAchievement ? 'Update Achievement' : 'Create Achievement'
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