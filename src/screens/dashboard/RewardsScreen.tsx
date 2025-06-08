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
      // Mock rewards data for development
      const mockRewards: Reward[] = [
        {
          id: '1',
          title: 'Cash Discount - ₹500',
          description: 'Get ₹500 cash discount on your next cement purchase',
          image_url: 'https://images.pexels.com/photos/164527/pexels-photo-164527.jpeg?auto=compress&cs=tinysrgb&w=400',
          points_required: 100,
          available: true,
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          visible_to: ['builder', 'contractor', 'dealer']
        },
        {
          id: '2',
          title: 'Factory Tour',
          description: 'Exclusive guided tour of our cement manufacturing facility',
          image_url: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=400',
          points_required: 200,
          available: true,
          expiry_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          visible_to: ['builder', 'contractor', 'dealer']
        },
        {
          id: '3',
          title: 'Premium T-Shirt',
          description: 'High-quality branded t-shirt with Tapee Cement logo',
          image_url: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400',
          points_required: 150,
          available: true,
          expiry_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          visible_to: ['builder', 'contractor', 'dealer']
        }
      ];

      setRewards(mockRewards);
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
      // Simulate redemption process
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(`Successfully redeemed ${reward.title}!`);
      
      // In a real app, this would update the user's points
      // For now, we'll just show the success message
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="mobile-loading">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Rewards Catalog</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Redeem your points for exciting rewards and benefits
        </p>
      </div>

      {/* Points Balance */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 sm:p-6 text-white text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Star className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-base sm:text-lg font-medium">Available Points</span>
        </div>
        <p className="text-2xl sm:text-3xl font-bold">{user?.points}</p>
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Rewards Grid */}
      {rewards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {rewards.map((reward) => {
            const canRedeem = user && user.points >= reward.points_required;
            const isExpired = new Date(reward.expiry_date) < new Date();
            
            return (
              <div key={reward.id} className="card overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <img
                    src={reward.image_url}
                    alt={reward.title}
                    className="w-full h-32 sm:h-48 object-cover rounded-lg"
                  />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {reward.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm">
                    {reward.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                      <span className="font-semibold text-primary-600 text-sm sm:text-base">
                        {reward.points_required} Points
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>
                        {new Date(reward.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canRedeem || isExpired || redeeming === reward.id}
                    className={`w-full py-2 sm:py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                      canRedeem && !isExpired
                        ? 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white'
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
          <Gift className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Rewards Available</h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Check back later for exciting rewards and offers!
          </p>
        </div>
      )}
    </div>
  );
}