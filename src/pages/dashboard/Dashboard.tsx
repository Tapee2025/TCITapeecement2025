import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Gift, ArrowRight, TrendingUp, Award, Package } from 'lucide-react';
import DashboardCard from '../../components/ui/DashboardCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { toast } from 'react-toastify';

type User = Database['public']['Tables']['users']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);
  const [stats, setStats] = useState({
    points: 0,
    bagsPurchased: 0,
    rewardsRedeemed: 0,
    pendingApprovals: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [marketingSlides, setMarketingSlides] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // Get current user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No user found');
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserData(profile);

      // Get recent transactions (limited to 3 for compact view)
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (transactionsError) throw transactionsError;
      setRecentTransactions(transactions || []);

      // Get marketing slides
      const { data: slides, error: slidesError } = await supabase
        .from('marketing_slides')
        .select('*')
        .eq('active', true)
        .order('order_number', { ascending: true });

      if (slidesError) throw slidesError;
      setMarketingSlides(slides || []);

      // Calculate stats
      const totalBags = transactions
        ?.filter(t => t.type === 'earned' && t.status === 'approved')
        .reduce((sum, t) => sum + (t.amount / 10), 0) || 0;

      const rewardsRedeemed = transactions
        ?.filter(t => t.type === 'redeemed' && t.status !== 'rejected')
        .length || 0;

      const pendingApprovals = transactions
        ?.filter(t => t.status === 'pending' || t.status === 'dealer_approved')
        .length || 0;

      setStats({
        points: profile?.points || 0,
        bagsPurchased: totalBags,
        rewardsRedeemed,
        pendingApprovals
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (marketingSlides.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % marketingSlides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [marketingSlides.length]);

  if (loading || !userData) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Welcome Header - Compact */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Welcome, {userData.first_name}!</h1>
            <p className="text-primary-100 text-sm">Track your rewards and points</p>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-xs">Available Points</p>
            <p className="text-2xl font-bold">{stats.points}</p>
          </div>
        </div>
      </div>

      {/* Marketing Slideshow - Compact */}
      {marketingSlides.length > 0 && (
        <div className="relative h-32 rounded-lg overflow-hidden shadow-sm">
          {marketingSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image_url}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/60 to-transparent flex items-center">
                <div className="text-white p-4">
                  <h3 className="text-sm font-bold mb-1">{slide.title}</h3>
                  <Link to="/redeem" className="text-xs bg-white text-gray-900 px-2 py-1 rounded">
                    View Rewards
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {/* Slide indicators */}
          <div className="absolute bottom-2 right-2 flex space-x-1">
            {marketingSlides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid - Compact 2x2 layout */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Bags Purchased</p>
              <p className="text-xl font-bold text-gray-900">{stats.bagsPurchased}</p>
            </div>
            <Package className="w-8 h-8 text-secondary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Rewards Redeemed</p>
              <p className="text-xl font-bold text-gray-900">{stats.rewardsRedeemed}</p>
            </div>
            <Gift className="w-8 h-8 text-accent-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending Approvals</p>
              <p className="text-xl font-bold text-gray-900">{stats.pendingApprovals}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-warning-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Member Since</p>
              <p className="text-sm font-bold text-gray-900">
                {new Date(userData.created_at).getFullYear()}
              </p>
            </div>
            <Award className="w-8 h-8 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions - Horizontal layout */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/get-points"
          className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-all flex items-center space-x-3"
        >
          <div className="bg-primary-100 text-primary-700 p-2 rounded-lg">
            <PlusCircle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Get Points</h3>
            <p className="text-xs text-gray-600">Submit request</p>
          </div>
          <ArrowRight className="text-gray-400" size={16} />
        </Link>

        <Link
          to="/redeem"
          className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-all flex items-center space-x-3"
        >
          <div className="bg-accent-100 text-accent-700 p-2 rounded-lg">
            <Gift size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Redeem</h3>
            <p className="text-xs text-gray-600">Browse rewards</p>
          </div>
          <ArrowRight className="text-gray-400" size={16} />
        </Link>
      </div>

      {/* Recent Transactions - Compact */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          <Link to="/transactions" className="text-primary-600 text-sm flex items-center">
            View all <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>

        <div className="divide-y">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'earned' ? 'bg-success-100' : 'bg-accent-100'
                  }`}>
                    {transaction.type === 'earned' ? (
                      <PlusCircle className={`w-4 h-4 ${
                        transaction.type === 'earned' ? 'text-success-600' : 'text-accent-600'
                      }`} />
                    ) : (
                      <Gift className="w-4 h-4 text-accent-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.type === 'earned' ? 'Points Earned' : 'Reward Redeemed'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'earned' ? 'text-success-600' : 'text-accent-600'
                  }`}>
                    {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    transaction.status === 'approved' || transaction.status === 'completed'
                      ? 'bg-success-100 text-success-700'
                      : transaction.status === 'pending'
                      ? 'bg-warning-100 text-warning-700'
                      : transaction.status === 'dealer_approved'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-error-100 text-error-700'
                  }`}>
                    {transaction.status === 'dealer_approved' ? 'Pending' : transaction.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}