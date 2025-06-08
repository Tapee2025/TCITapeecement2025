import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Gift, History, Users } from 'lucide-react';

interface MarketingSlide {
  id: string;
  image_url: string;
  title: string;
  active: boolean;
  order_number: number;
}

interface DashboardStats {
  totalTransactions: number;
  pendingTransactions: number;
  totalRewards: number;
  recentTransactions: any[];
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [marketingSlides, setMarketingSlides] = useState<MarketingSlide[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTransactions: 0,
    pendingTransactions: 0,
    totalRewards: 0,
    recentTransactions: [],
  });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    if (marketingSlides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % marketingSlides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [marketingSlides]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch marketing slides
      const { data: slides } = await supabase
        .from('marketing_slides')
        .select('*')
        .eq('active', true)
        .order('order_number');

      if (slides) {
        setMarketingSlides(slides);
      }

      // Fetch user transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch available rewards
      const { data: rewards } = await supabase
        .from('rewards')
        .select('*')
        .eq('available', true)
        .contains('visible_to', [user.role]);

      if (transactions) {
        const pendingCount = transactions.filter(t => t.status === 'pending').length;
        const recentTransactions = transactions.slice(0, 5);

        setStats({
          totalTransactions: transactions.length,
          pendingTransactions: pendingCount,
          totalRewards: rewards?.length || 0,
          recentTransactions,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-primary-100">
          You have {user?.points} loyalty points available
        </p>
      </div>

      {/* Marketing Slides */}
      {marketingSlides.length > 0 && (
        <div className="relative bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="relative h-64">
            <img
              src={marketingSlides[currentSlide]?.image_url}
              alt={marketingSlides[currentSlide]?.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white">
                <h3 className="text-xl font-bold">
                  {marketingSlides[currentSlide]?.title}
                </h3>
              </div>
            </div>
          </div>
          
          {marketingSlides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {marketingSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{user?.points}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 rounded-lg">
              <History className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-error-100 rounded-lg">
              <Users className="h-6 w-6 text-error-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTransactions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-success-100 rounded-lg">
              <Gift className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rewards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRewards}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        {stats.recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {stats.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'earned' ? 'text-success-600' : 'text-error-600'
                  }`}>
                    {transaction.type === 'earned' ? '+' : '-'}{transaction.amount} points
                  </p>
                  <p className={`text-xs px-2 py-1 rounded-full ${
                    transaction.status === 'approved' ? 'bg-success-100 text-success-800' :
                    transaction.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                    'bg-error-100 text-error-800'
                  }`}>
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No transactions yet</p>
        )}
      </div>
    </div>
  );
}