import { useState, useEffect } from 'react';
import { Trophy, Star, Target, Zap, Award, Gift, Package, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Achievement, UserAchievement } from '../../types/notifications';
import { useAuth } from '../../contexts/AuthContext';

export default function AchievementSystem() {
  const { currentUser } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (currentUser) {
      fetchAchievements();
      fetchUserAchievements();
    }
  }, [currentUser]);

  async function fetchAchievements() {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('points_threshold', { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  }

  async function fetchUserAchievements() {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      setUserAchievements(data || []);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    } finally {
      setLoading(false);
    }
  }

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'points': return Star;
      case 'bags': return Package;
      case 'transactions': return TrendingUp;
      case 'loyalty': return Award;
      case 'special': return Zap;
      default: return Trophy;
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    if (!currentUser) return 0;

    let current = 0;
    let target = 0;

    if (achievement.points_threshold) {
      current = currentUser.points;
      target = achievement.points_threshold;
    } else if (achievement.bags_threshold) {
      // This would need to be calculated from user's transaction history
      current = 0; // Placeholder
      target = achievement.bags_threshold;
    } else if (achievement.transactions_threshold) {
      // This would need to be calculated from user's transaction count
      current = 0; // Placeholder
      target = achievement.transactions_threshold;
    }

    return Math.min((current / target) * 100, 100);
  };

  const isAchievementEarned = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const categories = ['all', ...new Set(achievements.map(a => a.category))];

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Achievements</h2>
        <p className="text-gray-600">Unlock rewards and show off your progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-yellow-600">{userAchievements.length}</div>
          <div className="text-sm text-gray-500">Achievements Earned</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-primary-600">{currentUser?.points || 0}</div>
          <div className="text-sm text-gray-500">Total Points</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round((userAchievements.length / achievements.length) * 100)}%
          </div>
          <div className="text-sm text-gray-500">Completion Rate</div>
        </div>
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
            {category === 'all' ? 'All' : category}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => {
          const Icon = getAchievementIcon(achievement.category);
          const isEarned = isAchievementEarned(achievement.id);
          const progress = getProgressPercentage(achievement);

          return (
            <div
              key={achievement.id}
              className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-300 ${
                isEarned 
                  ? 'ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' 
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-full ${
                  isEarned 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon size={24} />
                </div>
                {isEarned && (
                  <div className="bg-yellow-500 text-white p-1 rounded-full">
                    <Trophy size={16} />
                  </div>
                )}
              </div>

              <h3 className={`font-semibold mb-2 ${
                isEarned ? 'text-yellow-800' : 'text-gray-900'
              }`}>
                {achievement.title}
              </h3>
              
              <p className={`text-sm mb-4 ${
                isEarned ? 'text-yellow-700' : 'text-gray-600'
              }`}>
                {achievement.description}
              </p>

              {/* Progress Bar */}
              {!isEarned && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Achievement Details */}
              <div className="flex justify-between items-center text-xs">
                <span className={`px-2 py-1 rounded-full ${
                  isEarned 
                    ? 'bg-yellow-200 text-yellow-800' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {achievement.category}
                </span>
                {isEarned && (
                  <span className="text-yellow-600 font-medium">
                    Completed!
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Achievements Found</h3>
          <p className="text-gray-500">No achievements available in this category</p>
        </div>
      )}
    </div>
  );
}