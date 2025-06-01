import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Gift, Award } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/helpers';

type Reward = Database['public']['Tables']['rewards']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export default function DealerRewards() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    fetchUserDataAndRewards();
  }, []);

  async function fetchUserDataAndRewards() {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserData(profile);

      // Get available rewards visible to dealers
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('available', true)
        .contains('visible_to', ['dealer'])
        .order('points_required', { ascending: true });

      if (rewardsError) throw rewardsError;
      setRewards(rewardsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
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
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Available Rewards</h1>
          <p className="text-gray-600">
            View rewards available for dealers
          </p>
        </div>
      </div>

      {/* Rewards Grid */}
      {rewards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="card overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <div className="h-40 overflow-hidden relative">
                <img
                  src={reward.image_url}
                  alt={reward.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{reward.title}</h3>
                  <div className="flex items-center bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-sm">
                    <Award size={14} className="mr-1" />
                    <span>{reward.points_required}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Expires: {formatDate(reward.expiry_date)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Rewards Available</h3>
          <p className="text-gray-600">
            There are currently no rewards available for dealers
          </p>
        </div>
      )}
    </div>
  );
}