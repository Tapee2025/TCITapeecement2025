import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Gift, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardCard from '../../components/ui/DashboardCard';
import { STATS_CARDS, SAMPLE_REWARDS } from '../../utils/constants';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Transaction, Reward } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Dashboard() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    points: 0,
    bagsPurchased: 0,
    rewardsRedeemed: 0,
    pendingApprovals: 0,
    totalApprovals: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [marketingSlides, setMarketingSlides] = useState<string[]>([
    'https://images.pexels.com/photos/1117452/pexels-photo-1117452.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const role = userData?.role || 'builder';
  const statCards = STATS_CARDS[role as keyof typeof STATS_CARDS];
  
  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      if (!userData) return;
      
      try {
        // Mock data fetch - in a real app, you would fetch from Firestore
        // Simulate loading
        setLoading(true);
        
        // Get recent transactions
        const transactionsQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', userData.uid),
          limit(5)
        );
        
        // In a real app, we'd await this query
        // const transactionsSnapshot = await getDocs(transactionsQuery);
        // const transactionsData = transactionsSnapshot.docs.map(doc => ({
        //   id: doc.id,
        //   ...doc.data()
        // }));
        
        // Mock data for demonstration
        const transactionsData = [
          {
            id: '1',
            userId: userData.uid,
            type: 'earned',
            amount: 500,
            description: 'Purchased 50 bags from ABC Distributor',
            status: 'approved',
            dealerId: 'dealer1',
            createdAt: new Date(2025, 4, 1).toISOString(),
            updatedAt: new Date(2025, 4, 1).toISOString()
          },
          {
            id: '2',
            userId: userData.uid,
            type: 'redeemed',
            amount: 1000,
            description: 'Redeemed for Cash Discount',
            status: 'completed',
            rewardId: '1',
            createdAt: new Date(2025, 3, 25).toISOString(),
            updatedAt: new Date(2025, 3, 25).toISOString()
          }
        ] as Transaction[];
        
        setTransactions(transactionsData);
        
        // Update stats based on user role
        let userStats = {
          points: userData.points || 0,
          bagsPurchased: 200,
          rewardsRedeemed: 2,
          pendingApprovals: 5,
          totalApprovals: 25
        };
        
        setStats(userStats);
        setRewards(SAMPLE_REWARDS.slice(0, 3) as Reward[]);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Marketing slides rotation
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % marketingSlides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [userData]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Marketing Slideshow */}
      <div className="relative h-48 md:h-64 rounded-lg overflow-hidden shadow-md">
        {marketingSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide}
              alt={`Marketing slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/60 to-transparent flex items-center">
              <div className="text-white p-8">
                <h2 className="text-2xl font-bold mb-2">New Promotion</h2>
                <p className="mb-4">Special offers on bulk cement orders</p>
                <Link to="/rewards" className="btn bg-white text-gray-900 hover:bg-gray-100">
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        ))}
        
        {/* Indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {marketingSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            ></button>
          ))}
        </div>
      </div>
      
      {/* Welcome message */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {userData?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's an overview of your loyalty rewards status
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <DashboardCard
            key={index}
            title={card.title}
            value={stats[card.valueKey as keyof typeof stats]}
            icon={
              card.icon === 'Star' ? TrendingUp :
              card.icon === 'Package' ? PlusCircle :
              card.icon === 'Gift' ? Gift :
              TrendingUp
            }
            bgColor={card.color}
            changeValue={index === 0 ? '+150 this month' : undefined}
            changeType={index === 0 ? 'increase' : 'neutral'}
          />
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Get Points */}
        <Link
          to="/get-points"
          className="card p-6 hover:shadow-md transition-all flex items-center space-x-4"
        >
          <div className="bg-primary-100 text-primary-700 p-3 rounded-full">
            <PlusCircle size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Get Points</h3>
            <p className="text-gray-600 text-sm">Submit a new points request</p>
          </div>
          <ArrowRight className="ml-auto text-gray-400" />
        </Link>
        
        {/* Redeem Rewards */}
        <Link
          to="/redeem"
          className="card p-6 hover:shadow-md transition-all flex items-center space-x-4"
        >
          <div className="bg-accent-100 text-accent-700 p-3 rounded-full">
            <Gift size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Redeem Rewards</h3>
            <p className="text-gray-600 text-sm">Browse available rewards</p>
          </div>
          <ArrowRight className="ml-auto text-gray-400" />
        </Link>
      </div>
      
      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <Link to="/transactions" className="text-primary-600 text-sm flex items-center">
            View all <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        <div className="card overflow-hidden">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`badge ${
                          transaction.type === 'earned' ? 'badge-success' : 'badge-accent'
                        }`}>
                          {transaction.type === 'earned' ? 'Earned' : 'Redeemed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`${
                          transaction.type === 'earned' ? 'text-success-600' : 'text-accent-600'
                        }`}>
                          {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`badge ${
                          transaction.status === 'approved' || transaction.status === 'completed'
                            ? 'badge-success'
                            : transaction.status === 'pending'
                            ? 'badge-warning'
                            : 'badge-error'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No recent transactions found
            </div>
          )}
        </div>
      </div>
      
      {/* Popular Rewards */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Popular Rewards</h2>
          <Link to="/rewards" className="text-primary-600 text-sm flex items-center">
            View all <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <div key={reward.id} className="card flex flex-col">
              <div className="h-40 overflow-hidden">
                <img
                  src={reward.imageUrl}
                  alt={reward.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg">{reward.title}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{reward.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary-700">{reward.pointsRequired} Points</span>
                  <Link to="/redeem" className="btn btn-outline btn-sm">
                    Redeem
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}