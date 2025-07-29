import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { formatDate } from '../../utils/helpers';
import { Gift, Search, Award, CheckCircle, Filter } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import LazyImage from '../../components/ui/LazyImage';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../hooks/useCache';
import { useDebounce } from '../../hooks/useDebounce';

type Reward = Database['public']['Tables']['rewards']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export default function RedeemRewards() {
  const { currentUser, refreshUser } = useAuth();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [redemptionComplete, setRedemptionComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Cache rewards data for 5 minutes
  const { data: rewards, loading, refetch } = useCache(
    async () => {
      if (!currentUser) throw new Error('Not authenticated');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('available', true)
        .contains('visible_to', [currentUser.role])
          .order('points_required', { ascending: true })
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);
      if (rewardsError) throw rewardsError;
      return rewardsData || [];
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    { 
      key: `rewards-${currentUser?.role}`, 
      ttl: 5 * 60 * 1000,
      enabled: !!currentUser
    }
  );

  // Memoize filtered rewards to prevent unnecessary recalculations
  const filteredRewards = useMemo(() => {
    if (!rewards) return [];
    
    const searchString = debouncedSearchQuery.toLowerCase();
    return rewards.filter(reward => 
      reward.title.toLowerCase().includes(searchString) || 
      reward.description.toLowerCase().includes(searchString)
    );
  }, [rewards, debouncedSearchQuery]);

  // Handle reward selection
  const handleSelectReward = (reward: Reward) => {
    if (!currentUser || currentUser.points < reward.points_required) {
      toast.error('Insufficient points');
      return;
    }
    
    setSelectedReward(reward);
    setConfirmationStep(true);
  };
  
  // Handle redemption confirmation
  const handleConfirmRedemption = async () => {
    if (!selectedReward || !currentUser || submitting) return;
    
    try {
      setSubmitting(true);
      
      // Create redemption transaction with 'pending' status
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUser.id,
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
          points: currentUser.points - selectedReward.points_required,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (pointsError) throw pointsError;
      
      // Refresh user data
      await refreshUser();
      
      setRedemptionComplete(true);
      toast.success('Reward redemption request submitted successfully!');
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Failed to redeem reward');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Reset the redemption flow
  const handleResetRedemption = () => {
    setSelectedReward(null);
    setConfirmationStep(false);
    setRedemptionComplete(false);
    refetch(); // Refresh rewards data
  };

  if (loading || !currentUser) {
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
            <LazyImage
              src={selectedReward.image_url}
              alt={selectedReward.title}
              className="w-full h-full"
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
                <span className="font-semibold">{currentUser.points}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Points Required:</span>
                <span className="font-semibold">{selectedReward.points_required}</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining Points:</span>
                <span className="font-semibold">
                  {currentUser.points - selectedReward.points_required}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleConfirmRedemption}
              className="btn btn-primary w-full"
              disabled={submitting}
            >
              {submitting ? (
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
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Redeem Rewards</h1>
            <p className="text-primary-100 text-sm">Choose from available rewards</p>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-xs">Available Points</p>
            <p className="text-2xl font-bold">{currentUser.points}</p>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              className="form-input pl-10 text-sm"
              placeholder="Search rewards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline btn-sm flex items-center"
          >
            <Filter size={16} className="mr-1" />
            Filter
          </button>
        </div>
      </div>
      
      {/* Rewards Grid */}
      {filteredRewards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRewards.map((reward) => {
            const canRedeem = currentUser.points >= reward.points_required;
            
            return (
              <div
                key={reward.id}
                className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-300 ${
                  canRedeem ? 'hover:shadow-md' : 'opacity-70'
                }`}
              >
                <div className="h-32 overflow-hidden relative">
                  <LazyImage
                    src={reward.image_url}
                    alt={reward.title}
                    className="w-full h-full"
                  />
                  {!canRedeem && (
                    <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                      <div className="bg-white/90 px-2 py-1 rounded text-xs font-medium">
                        Insufficient Points
                      </div>
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
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Expires: {formatDate(reward.expiry_date)}
                    </span>
                    <button
                      onClick={() => handleSelectReward(reward)}
                      className={`btn ${canRedeem ? 'btn-primary' : 'btn-outline'} btn-sm text-xs`}
                      disabled={!canRedeem}
                    >
                      {canRedeem ? 'Redeem' : 'Not Enough'}
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
            {debouncedSearchQuery 
              ? `No rewards match your search for "${debouncedSearchQuery}"`
              : 'No rewards available at the moment'}
          </p>
        </div>
      )}
    </div>
  );
}