import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Users, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';

export default function DealerAnalytics() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
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
      const subDealers = customerDetails?.filter(c => c.role === 'sub_dealer').length || 0;
      
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
      
      // Get total bags sold (from dealer's own transactions)
      const { data: bagData } = await supabase.rpc(
        'get_performance_metrics',
        {
          p_dealer_id: currentUser.id,
          p_period: 'lifetime',
          p_start_date: null,
          p_end_date: null
        }
      );
      
      // Get total transactions (dealer's own transactions)
      const { count: transactionCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('type', 'earned');
      
      setDealerStats({
        totalCustomers: allCustomerIds.size,
        contractors,
        subDealers,
        activeCustomers: activeCustomerIds.size,
        totalBagsSold: bagData?.[0]?.total_bags_sold || 0,
        totalTransactions: transactionCount || 0
      });
    } catch (error) {
      console.error('Error fetching dealer customer stats:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchDealerCustomerStats();
    }
  }, [currentUser, fetchDealerCustomerStats]);

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
        <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
        <p className="text-gray-600">Track your sales performance and customer engagement</p>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">My Customers</p>
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
              <p className="text-sm text-gray-500">Total Bags Sold</p>
              <p className="text-2xl font-bold text-blue-600">{dealerStats.totalBagsSold}</p>
              <p className="text-xs text-gray-500">All time</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {currentUser && (
        <AnalyticsDashboard userRole="dealer" dealerId={currentUser.id} />
      )}
    </div>
  );
}