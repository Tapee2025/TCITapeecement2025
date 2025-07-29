import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Users, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';
import { calculateBagsFromTransaction } from '../../utils/helpers';

export default function DealerAnalytics() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesView, setSalesView] = useState<'my_sales' | 'network_sales'>('my_sales');
  const [dealerStats, setDealerStats] = useState({
    totalCustomers: 0,
    contractors: 0,
    subDealers: 0,
    activeCustomers: 0,
    totalBagsSold: 0,
    totalTransactions: 0
  });

  const fetchDealerCustomerStats = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Get sub dealers created by this dealer
      const { data: subDealers } = await supabase
        .from('users')
        .select('id, role')
        .eq('created_by', currentUser.id)
        .eq('role', 'sub_dealer');

      const subDealerIds = subDealers?.map(sd => sd.id) || [];
      let allDealerIds: string[];
      if (salesView === 'my_sales') {
        allDealerIds = [currentUser.id]; // Only dealer's own transactions
      } else {
        allDealerIds = subDealerIds; // Only sub dealers' transactions
      }
      console.log('Analytics - dealer and sub dealer IDs:', allDealerIds);

      // Get total customers (users who have made transactions through this dealer)
      // Get all customers in the same district
      const { data: allCustomersInDistrict } = await supabase
        .from('users')
        .select('id, role')
        .eq('district', currentUser.district)
        .in('role', ['contractor', 'sub_dealer'])
        .neq('id', currentUser.id);
      
      // Also get customers who have made transactions through this dealer
      const { data: customerData } = await supabase
        .from('transactions')
        .select('user_id')
        .eq('dealer_id', currentUser.id)
        .neq('user_id', currentUser.id); // Exclude dealer's own transactions
      
      // Combine both sets of customers
      const transactionCustomerIds = new Set(customerData?.map(t => t.user_id) || []);
      const allCustomerIds = new Set([
        ...(allCustomersInDistrict?.map(c => c.id) || []),
        ...transactionCustomerIds
      ]);
      
      // Get customer details for all customers
      const { data: customerDetails } = await supabase
        .from('users')
        .select('id, role')
        .in('id', Array.from(allCustomerIds));
      
      const contractors = customerDetails?.filter(c => c.role === 'contractor').length || 0;
      const subDealersCount = customerDetails?.filter(c => c.role === 'sub_dealer').length || 0;
      
      // Get active customers (made transactions in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeCustomerData } = await supabase
        .from('transactions')
        .select('user_id')
        .eq('dealer_id', currentUser.id)
        .neq('user_id', currentUser.id)
        .gte('created_at', thirtyDaysAgo.toISOString());
      
      const activeCustomerIds = new Set(activeCustomerData?.map(t => t.user_id) || []);
      
      // Get total bags sold (from dealer + sub dealers transactions)
      const { data: bagData } = await supabase
        .from('transactions')
        .select('amount, description')
        .in('user_id', allDealerIds)
        .eq('type', 'earned')
        .eq('status', 'approved');

      const totalBagsSold = bagData?.reduce((sum, t) => sum + calculateBagsFromTransaction(t.description, t.amount), 0) || 0;
      
      // Get total transactions (dealer + sub dealers transactions)
      const { count: transactionCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .in('user_id', allDealerIds)
        .eq('type', 'earned');
      
      setDealerStats({
        totalCustomers: allCustomerIds.size,
        contractors,
        subDealers: subDealers?.length || 0, // Count of sub dealers created by this dealer
        activeCustomers: activeCustomerIds.size,
        totalBagsSold,
        totalTransactions: transactionCount || 0
      });

      console.log('Analytics stats calculated:', {
        totalBagsSold,
        subDealersCount: subDealers?.length || 0,
        totalTransactions: transactionCount || 0
      });
    } catch (error) {
      console.error('Error fetching dealer customer stats:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, salesView]);

  useEffect(() => {
    if (currentUser) {
      fetchDealerCustomerStats();
    }
  }, [currentUser, fetchDealerCustomerStats]);

  const getSalesViewLabel = () => {
    return salesView === 'my_sales' ? 'My Performance' : 'Network Performance';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getSalesViewLabel()}</h1>
            <p className="text-gray-600">
              {salesView === 'my_sales' 
                ? 'Track your direct sales performance and customer engagement'
                : 'Track your sub dealers network performance and engagement'
              }
            </p>
          </div>
          
          {/* Sales View Switch */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSalesView('my_sales')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                salesView === 'my_sales'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Sales
            </button>
            <button
              onClick={() => setSalesView('network_sales')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                salesView === 'network_sales'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Network Sales
            </button>
          </div>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {salesView === 'my_sales' ? 'My Customers' : 'Network Customers'}
              </p>
              <p className="text-2xl font-bold text-primary-600">{dealerStats.totalCustomers}</p>
              <p className="text-xs text-gray-500">Unique customers</p>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Contractors</p>
              <p className="text-2xl font-bold text-yellow-600">{dealerStats.contractors}</p>
              <p className="text-xs text-gray-500">Contractor customers</p>
            </div>
            <Users className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sub Dealers</p>
              <p className="text-2xl font-bold text-blue-600">{dealerStats.subDealers}</p>
              <p className="text-xs text-gray-500">Sub dealer customers</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Customers</p>
              <p className="text-2xl font-bold text-green-600">{dealerStats.activeCustomers}</p>
              <p className="text-xs text-gray-500">Last 30 days</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {salesView === 'my_sales' ? 'My Total Bags' : 'Network Total Bags'}
              </p>
              <p className="text-2xl font-bold text-blue-600">{dealerStats.totalBagsSold}</p>
              <p className="text-xs text-gray-500">All time</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Sales View Info */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          {salesView === 'my_sales' 
            ? '📊 Showing your direct sales analytics only'
            : '🌐 Showing analytics for your sub dealers network only (excludes contractors/masons)'
          }
        </p>
      </div>

      {/* Analytics Dashboard */}
      {currentUser && (
        <AnalyticsDashboard userRole="dealer" dealerId={currentUser.id} />
      )}
    </div>
  );
}