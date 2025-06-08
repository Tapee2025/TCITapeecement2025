import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Gift, History, Users, ChevronLeft, ChevronRight } from 'lucide-react';

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
      // Mock data for development
      const mockSlides: MarketingSlide[] = [
        {
          id: '1',
          image_url: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=800',
          title: 'Premium Quality Cement',
          active: true,
          order_number: 1
        },
        {
          id: '2',
          image_url: 'https://images.pexels.com/photos/834892/pexels-photo-834892.jpeg?auto=compress&cs=tinysrgb&w=800',
          title: 'Build Your Dreams',
          active: true,
          order_number: 2
        }
      ];

      const mockTransactions = [
        {
          id: '1',
          description: 'Cement purchase - 50 bags',
          created_at: new Date().toISOString(),
          type: 'earned',
          amount: 500,
          status: 'approved'
        },
        {
          id: '2',
          description: 'Cement purchase - 25 bags',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          type: 'earned',
          amount: 250,
          status: 'pending'
        }
      ];

      setMarketingSlides(mockSlides);
      setStats({
        totalTransactions: mockTransactions.length,
        pendingTransactions: mockTransactions.filter(t => t.status === 'pending').length,
        totalRewards: 5,
        recentTransactions: mockTransactions,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % marketingSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + marketingSlides.length) % marketingSlides.length);
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-primary-100 text-sm sm:text-base">
          You have {user?.points} loyalty points available
        </p>
      </div>

      {/* Marketing Slides */}
      {marketingSlides.length > 0 && (
        <div className="relative bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="relative h-48 sm:h-64">
            <img
              src={marketingSlides[currentSlide]?.image_url}
              alt={marketingSlides[currentSlide]?.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-4 sm:p-6 text-white">
                <h3 className="text-lg sm:text-xl font-bold">
                  {marketingSlides[currentSlide]?.title}
                </h3>
              </div>
            </div>
            
            {/* Navigation arrows for mobile */}
            {marketingSlides.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 touch-target"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 touch-target"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
          
          {marketingSlides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {marketingSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors touch-target ${
                    index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="p-2 sm:p-3 bg-primary-100 rounded-lg mb-2 sm:mb-0 self-start">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{user?.points}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="p-2 sm:p-3 bg-warning-100 rounded-lg mb-2 sm:mb-0 self-start">
              <History className="h-5 w-5 sm:h-6 sm:w-6 text-warning-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="p-2 sm:p-3 bg-error-100 rounded-lg mb-2 sm:mb-0 self-start">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-error-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.pendingTransactions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <div className="p-2 sm:p-3 bg-success-100 rounded-lg mb-2 sm:mb-0 self-start">
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-success-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Rewards</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalRewards}</p>
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
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{transaction.description}</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className={`font-semibold text-sm sm:text-base ${
                    transaction.type === 'earned' ? 'text-success-600' : 'text-error-600'
                  }`}>
                    {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
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
          <p className="text-gray-600 text-center py-8 text-sm sm:text-base">No transactions yet</p>
        )}
      </div>
    </div>
  );
}