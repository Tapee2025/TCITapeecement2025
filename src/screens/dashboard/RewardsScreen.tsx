import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Gift, Calendar, Star } from 'lucide-react';

interface Reward {
  id: string;
  title: string;
  description: string;
  image_url: string;
  points_required: number;
  available: boolean;
  expiry_date: string;
  visible_to: string[];
}

export default function RewardsScreen() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRewards();
  }, [user]);

  const fetchRewards = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('available', true)
        .contains('visible_to', [user.role])
        .order('points_required');

      if (error) {
        console.error('Error fetching rewards:', error);
      } else {
        setRewards(data || []);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!user || user.points < reward.points_required) {
      setError('Insufficient points to redeem this reward');
      return;
    }

    setRedeeming(reward.id);
    setError('');
    setSuccess('');

    try {
      // Create redemption transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'redeemed',
          amount: reward.points_required,
          description: `Redeemed: ${reward.title}`,
          status: 'approved',
          reward_id: reward.id,
        });

      if (transactionError) {
        setError(transactionError.message);
      } else {
        // Update user points
        const newPoints = user.points - reward.points_required;
        const { error: updateError } = await supabase
          .from('users')
          .update({ points: newPoints })
          .eq('id', user.id);

        if (updateError) {
          setError(updateError.message);
        } else {
          setSuccess(`Successfully redeemed ${reward.title}!`);
          // Update local user state would need to be handled by the auth context
          window.location.reload(); // Simple refresh for now
        }
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rewards Catalog</h1>
        <p className="text-gray-600">
          Redeem your points for exciting rewards and benefits
        </p>
      </div>

      {/* Points Balance */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Star className="h-6 w-6" />
          <span className="text-lg font-medium">Available Points</span>
        </div>
        <p className="text-3xl font-bold">{user?.points}</p>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Rewards Grid */}
      {rewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => {
            const canRedeem = user && user.points >= reward.points_required;
            const isExpired = new Date(reward.expiry_date) < new Date();
            
            return (
              <div key={reward.id} className="card overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <img
                    src={reward.image_url}
                    alt={reward.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {reward.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm">
                    {reward.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Gift className="h-5 w-5 text-primary-600" />
                      <span className="font-semibold text-primary-600">
                        {reward.points_required} Points
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(reward.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canRedeem || isExpired || redeeming === reward.id}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      canRedeem && !isExpired
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {redeeming === reward.id ? (
                      'Redeeming...'
                    ) : isExpired ? (
                      'Expired'
                    ) : !canRedeem ? (
                      `Need ${reward.points_required - (user?.points || 0)} more points`
                    ) : (
                      'Redeem Now'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Rewards Available</h3>
          <p className="text-gray-600">
            Check back later for exciting rewards and offers!
          </p>
        </div>
      )}
    </div>
  );
}