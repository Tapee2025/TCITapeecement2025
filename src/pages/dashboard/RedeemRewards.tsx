import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SAMPLE_REWARDS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { Reward } from '../../types';
import { Gift, Search, Award, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function RedeemRewards() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [redemptionComplete, setRedemptionComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const categories = [
    { id: 'all', name: 'All Rewards' },
    { id: 'discount', name: 'Cash Discounts' },
    { id: 'travel', name: 'Travel & Tours' },
    { id: 'merchandise', name: 'Merchandise' }
  ];
  
  // Filter rewards based on search and category
  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         reward.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (categoryFilter === 'all') return matchesSearch;
    
    const categoryMap: Record<string, string[]> = {
      'discount': ['Cash Discount'],
      'travel': ['Goa Tour Package'],
      'merchandise': ['Office Chair', 'Premium Toolbox']
    };
    
    return matchesSearch && categoryMap[categoryFilter]?.includes(reward.title);
  });
  
  // Fetch rewards
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        
        // In a real app, you would fetch from Firestore
        // Simulate server delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setRewards(SAMPLE_REWARDS as Reward[]);
      } catch (error) {
        console.error('Error fetching rewards:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRewards();
  }, []);
  
  // Handle reward selection
  const handleSelectReward = (reward: Reward) => {
    if (!userData || userData.points < reward.pointsRequired) {
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
      
      // In a real app, you would update Firestore
      // 1. Deduct points from user
      // 2. Create redemption record
      // 3. Create transaction record
      
      // Simulate server delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setRedemptionComplete(true);
    } catch (error) {
      console.error('Error redeeming reward:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Reset the redemption flow
  const handleResetRedemption = () => {
    setSelectedReward(null);
    setConfirmationStep(false);
    setRedemptionComplete(false);
  };
  
  if (loading && !selectedReward) {
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
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Redemption Successful!</h2>
          <p className="text-gray-600 mb-6">
            You've successfully redeemed <strong>{selectedReward?.title}</strong> for <strong>{selectedReward?.pointsRequired} points</strong>.
            Our team will process your reward shortly.
          </p>
          <button
            onClick={handleResetRedemption}
            className="btn btn-primary"
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
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setConfirmationStep(false)}
          className="text-primary-600 flex items-center mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to rewards
        </button>
        
        <div className="card overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="h-64 md:h-auto">
              <img
                src={selectedReward.imageUrl}
                alt={selectedReward.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{selectedReward.title}</h2>
              <div className="flex items-center mb-4">
                <Gift className="text-primary-600 mr-2" size={20} />
                <span className="font-semibold text-lg text-primary-700">
                  {selectedReward.pointsRequired} Points
                </span>
              </div>
              <p className="text-gray-600 mb-4">{selectedReward.description}</p>
              <p className="text-sm text-gray-500 mb-6">
                Available until: {formatDate(selectedReward.expiryDate)}
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Your Points:</span>
                  <span className="font-semibold">{userData?.points || 0}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Points Required:</span>
                  <span className="font-semibold">{selectedReward.pointsRequired}</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining Points:</span>
                  <span className="font-semibold">
                    {(userData?.points || 0) - selectedReward.pointsRequired}
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
                    <LoadingSpinner size="sm\" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm Redemption'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Redeem Rewards</h1>
          <p className="text-gray-600">
            You have <span className="font-semibold text-primary-700">{userData?.points || 0} points</span> available
          </p>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="categoryFilter" className="form-label">Filter by Category</label>
            <select
              id="categoryFilter"
              className="form-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="search" className="form-label">Search Rewards</label>
            <div className="relative">
              <input
                id="search"
                type="text"
                className="form-input pl-10"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Rewards Grid */}
      {filteredRewards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward) => {
            const canRedeem = (userData?.points || 0) >= reward.pointsRequired;
            
            return (
              <div
                key={reward.id}
                className={`card overflow-hidden transition-all duration-300 ${
                  canRedeem ? 'hover:shadow-md' : 'opacity-70'
                }`}
              >
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={reward.imageUrl}
                    alt={reward.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {!canRedeem && (
                    <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                      <div className="bg-white/90 px-3 py-1 rounded-md text-sm font-medium">
                        Insufficient Points
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{reward.title}</h3>
                    <div className="flex items-center bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-sm">
                      <Award size={14} className="mr-1" />
                      <span>{reward.pointsRequired}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Expires: {formatDate(reward.expiryDate)}
                    </span>
                    <button
                      onClick={() => handleSelectReward(reward)}
                      className={`btn ${canRedeem ? 'btn-primary' : 'btn-outline'} btn-sm`}
                      disabled={!canRedeem}
                    >
                      {canRedeem ? 'Redeem' : 'Not Enough Points'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Rewards Found</h3>
          <p className="text-gray-600">
            {searchQuery 
              ? `No rewards match your search for "${searchQuery}"`
              : 'No rewards available in this category'}
          </p>
        </div>
      )}
    </div>
  );
}