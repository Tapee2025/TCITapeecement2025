import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Gift, Award, Target, TrendingUp, CheckCircle, Clock, Star, Zap } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/helpers';

type Reward = Database['public']['Tables']['rewards']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export default function DealerRewards() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [redemptionComplete, setRedemptionComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUserDataAndRewards();
  }, []);

  async function fetchUserDataAndRewards() {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user profile with points
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

  // Handle reward selection
  const handleSelectReward = (reward: Reward) => {
    if (!userData || userData.points < reward.points_required) {
      toast.error('Insufficient points');
      return;
    }
    
    setSelectedReward(reward);
    setConfirmationStep(true);
  };
  
  // Handle redemption confirmation
  const handleConfirmRedemption = async () => {
    if (!selectedReward || !userData) return;
    
    try {
      setLoading(true);
      
      // Create redemption transaction with 'pending' status
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userData.id,
          type: 'redeemed',
          amount: selectedReward.points_required,
          description: `Redeemed ${selectedReward.title}`,
          status: 'pending',
          reward_id: selectedReward.id
        });

      if (transactionError) throw transactionError;

      // Update user points
      const { error: pointsError } = await supabase
        .from('users')
        .update({ 
          points: userData.points - selectedReward.points_required,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (pointsError) throw pointsError;
      
      setRedemptionComplete(true);
      toast.success('Reward redemption request submitted successfully!');
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Failed to redeem reward');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset the redemption flow
  const handleResetRedemption = () => {
    setSelectedReward(null);
    setConfirmationStep(false);
    setRedemptionComplete(false);
    fetchUserDataAndRewards(); // Refresh data
  };

  // Calculate progress for each reward
  const getRewardProgress = (reward: Reward) => {
    if (!userData) return { percentage: 0, pointsNeeded: reward.points_required };
    
    const percentage = Math.min((userData.points / reward.points_required) * 100, 100);
    const pointsNeeded = Math.max(reward.points_required - userData.points, 0);
    
    return { percentage, pointsNeeded };
  };

  // Get achievement level based on points
  const getAchievementLevel = () => {
    if (!userData) return { level: 'Bronze', icon: Star, color: 'text-amber-600' };
    
    const points = userData.points;
    if (points >= 10000) return { level: 'Diamond', icon: Zap, color: 'text-purple-600' };
    if (points >= 5000) return { level: 'Platinum', icon: Award, color: 'text-blue-600' };
    if (points >= 2000) return { level: 'Gold', icon: Target, color: 'text-yellow-600' };
    if (points >= 500) return { level: 'Silver', icon: TrendingUp, color: 'text-gray-600' };
    return { level: 'Bronze', icon: Star, color: 'text-amber-600' };
  };

  // Filter rewards based on search
  const filteredRewards = rewards.filter(reward => {
    const searchString = searchQuery.toLowerCase();
    return (
      reward.title.toLowerCase().includes(searchString) || 
      reward.description.toLowerCase().includes(searchString)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redemption completion screen
  if (redemptionComplete) {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
          <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your request to redeem <strong>{selectedReward?.title}</strong> for <strong>{selectedReward?.points_required} points</strong> has
            been submitted. Our team will review and process your redemption shortly.
          </p>
          <button
            onClick={handleResetRedemption}
            className="btn btn-primary w-full"
          >
            Browse More Rewards
          </button>
        </div>
      </div>
    );
  }

  // Confirmation step
  if (confirmationStep && selectedReward) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setConfirmationStep(false)}
          className="text-primary-600 flex items-center text-sm"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to rewards
        </button>
        
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="h-48">
            <img
              src={selectedReward.image_url}
              alt={selectedReward.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2">{selectedReward.title}</h2>
            <div className="flex items-center mb-4">
              <Gift className="text-primary-600 mr-2" size={20} />
              <span className="font-semibold text-lg text-primary-700">
                {selectedReward.points_required} Points
              </span>
            </div>
            <p className="text-gray-600 mb-4">{selectedReward.description}</p>
            <p className="text-sm text-gray-500 mb-6">
              Available until: {formatDate(selectedReward.expiry_date)}
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Your Points:</span>
                <span className="font-semibold">{userData?.points || 0}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Points Required:</span>
                <span className="font-semibold">{selectedReward.points_required}</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining Points:</span>
                <span className="font-semibold">
                  {(userData?.points || 0) - selectedReward.points_required}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleConfirmRedemption}
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                'Confirm Redemption'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const achievementLevel = getAchievementLevel();
  const AchievementIcon = achievementLevel.icon;

  return (
    <div className="space-y-6">
      {/* Achievement Header */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <AchievementIcon className={`w-6 h-6 text-white`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dealer Rewards</h1>
                <p className="text-primary-100">Achievement Level: {achievementLevel.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary-100 text-sm">Available Points</p>
              <p className="text-3xl font-bold">{userData?.points || 0}</p>
            </div>
          </div>
          
          {/* Next Level Progress */}
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/80">Progress to Next Level</span>
              <span className="text-sm text-white/80">
                {userData?.points || 0} / {
                  userData?.points >= 10000 ? '∞' :
                  userData?.points >= 5000 ? '10,000' :
                  userData?.points >= 2000 ? '5,000' :
                  userData?.points >= 500 ? '2,000' : '500'
                }
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(
                    userData?.points >= 10000 ? 100 :
                    userData?.points >= 5000 ? ((userData.points - 5000) / 5000) * 100 :
                    userData?.points >= 2000 ? ((userData.points - 2000) / 3000) * 100 :
                    userData?.points >= 500 ? ((userData.points - 500) / 1500) * 100 :
                    (userData?.points || 0) / 500 * 100, 100
                  )}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="relative">
          <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            className="form-input pl-10 text-sm"
            placeholder="Search rewards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Rewards Grid with Progress */}
      {filteredRewards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward) => {
            const canRedeem = (userData?.points || 0) >= reward.points_required;
            const progress = getRewardProgress(reward);
            
            return (
              <div
                key={reward.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  canRedeem ? 'ring-2 ring-success-200' : ''
                }`}
              >
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={reward.image_url}
                    alt={reward.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {canRedeem && (
                    <div className="absolute top-2 right-2 bg-success-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <CheckCircle size={12} className="mr-1" />
                      Ready!
                    </div>
                  )}
                  {!canRedeem && (
                    <div className="absolute top-2 right-2 bg-warning-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <Clock size={12} className="mr-1" />
                      {progress.pointsNeeded} more
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">{reward.title}</h3>
                    <div className="flex items-center bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs">
                      <Award size={12} className="mr-1" />
                      <span>{reward.points_required}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{reward.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Progress</span>
                      <span className="text-xs font-medium text-gray-700">
                        {Math.round(progress.percentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          canRedeem ? 'bg-success-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                    {!canRedeem && (
                      <p className="text-xs text-gray-500 mt-1">
                        {progress.pointsNeeded} more points needed
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Expires: {formatDate(reward.expiry_date)}
                    </span>
                    <button
                      onClick={() => handleSelectReward(reward)}
                      className={`btn ${canRedeem ? 'btn-primary' : 'btn-outline'} btn-sm text-xs`}
                      disabled={!canRedeem}
                    >
                      {canRedeem ? 'Redeem Now' : 'Not Ready'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Rewards Found</h3>
          <p className="text-gray-600">
            {searchQuery 
              ? `No rewards match your search for "${searchQuery}"`
              : 'No rewards available for dealers at the moment'}
          </p>
        </div>
      )}

      {/* Motivational Section */}
      {filteredRewards.length > 0 && (
        <div className="bg-gradient-to-r from-accent-50 to-warning-50 rounded-xl p-6 border border-accent-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Keep Going! 🎯</h3>
              <p className="text-gray-600 text-sm">
                You're doing great! {filteredRewards.filter(r => (userData?.points || 0) >= r.points_required).length} rewards are ready to redeem.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent-600">
                {filteredRewards.filter(r => (userData?.points || 0) >= r.points_required).length}
              </div>
              <div className="text-xs text-gray-500">Ready to redeem</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}