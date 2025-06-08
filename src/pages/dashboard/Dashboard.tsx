import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Gift, ArrowRight, TrendingUp } from 'lucide-react';
import DashboardCard from '../../components/ui/DashboardCard';
import { STATS_CARDS } from '../../utils/constants';
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
    pendingApprovals: 0,
    totalApprovals: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

      // Get recent transactions
      const { data: recentTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionsError) throw transactionsError;
      setTransactions(recentTransactions);

      // Get marketing slides
      const { data: slides, error: slidesError } = await supabase
        .from('marketing_slides')
        .select('*')
        .eq('active', true)
        .order('order_number', { ascending: true });

      if (slidesError) throw slidesError;
      setMarketingSlides(slides || []);

      // Calculate stats
      const totalBags = recentTransactions
        ?.filter(t => t.type === 'earned')
        .reduce((sum, t) => sum + (t.amount / 10), 0) || 0;

      const rewardsRedeemed = recentTransactions
        ?.filter(t => t.type === 'redeemed')
        .length || 0;

      setStats({
        points: profile?.points || 0,
        bagsPurchased: totalBags,
        rewardsRedeemed,
        pendingApprovals: 0,
        totalApprovals: 0
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

  const statCards = STATS_CARDS[userData.role as keyof typeof STATS_CARDS];

  return (
    <div className="space-y-8">
      {/* Marketing Slideshow */}
      {marketingSlides.length > 0 && (
        <div className="relative h-48 md:h-64 rounded-lg overflow-hidden shadow-md">
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
                <div className="text-white p-8">
                  <h2 className="text-2xl font-bold mb-2">{slide.title}</h2>
                  <Link to="/rewards" className="btn bg-white text-gray-900 hover:bg-gray-100">
                    Learn more
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Welcome message */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {userData.first_name}!
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
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {new Date(transaction.created_at).toLocaleDateString()}
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
    </div>
  );
}