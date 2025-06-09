import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Package, Search, Filter, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

type Reward = Database['public']['Tables']['rewards']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

interface RewardOrderData {
  reward: Reward;
  totalRedeemed: number;
  pendingDispatch: number;
  completedDispatch: number;
  recentRedemptions: Array<{
    transaction: Transaction;
    user: any;
    date: string;
  }>;
}

export default function AdminToOrder() {
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<RewardOrderData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all_time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchOrderData();
  }, [statusFilter, dateFilter]);

  async function fetchOrderData() {
    try {
      setLoading(true);

      // Get all rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .order('title', { ascending: true });

      if (rewardsError) throw rewardsError;

      // Calculate date range based on filter
      let dateCondition = '';
      const now = new Date();
      
      switch (dateFilter) {
        case 'last_7_days':
          dateCondition = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'last_30_days':
          dateCondition = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'last_90_days':
          dateCondition = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'this_year':
          dateCondition = new Date(now.getFullYear(), 0, 1).toISOString();
          break;
        case 'custom':
          if (customStartDate) {
            dateCondition = customStartDate + 'T00:00:00';
          }
          break;
        default:
          dateCondition = '';
      }

      const orderDataPromises = rewards?.map(async (reward) => {
        // Build query for redemption transactions
        let query = supabase
          .from('transactions')
          .select(`
            *,
            users!transactions_user_id_fkey (
              id,
              first_name,
              last_name,
              user_code,
              role,
              district,
              city,
              mobile_number
            )
          `)
          .eq('type', 'redeemed')
          .eq('reward_id', reward.id);

        // Apply status filter
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        } else {
          query = query.in('status', ['pending', 'approved', 'completed']);
        }

        // Apply date filter
        if (dateCondition) {
          query = query.gte('created_at', dateCondition);
          
          if (dateFilter === 'custom' && customEndDate) {
            query = query.lte('created_at', customEndDate + 'T23:59:59');
          }
        }

        const { data: transactions, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        const totalRedeemed = transactions?.length || 0;
        const pendingDispatch = transactions?.filter(t => t.status === 'pending' || t.status === 'approved').length || 0;
        const completedDispatch = transactions?.filter(t => t.status === 'completed').length || 0;

        const recentRedemptions = (transactions || []).slice(0, 5).map(transaction => ({
          transaction,
          user: (transaction as any).users,
          date: transaction.created_at
        }));

        return {
          reward,
          totalRedeemed,
          pendingDispatch,
          completedDispatch,
          recentRedemptions
        };
      }) || [];

      const results = await Promise.all(orderDataPromises);
      setOrderData(results);
    } catch (error) {
      console.error('Error fetching order data:', error);
      toast.error('Failed to load order data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCustomDateFilter() {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    fetchOrderData();
  }

  const handleExportCSV = () => {
    const csvData = orderData.map(item => ({
      'Reward Title': item.reward.title,
      'Total Redeemed': item.totalRedeemed,
      'Pending Dispatch': item.pendingDispatch,
      'Completed Dispatch': item.completedDispatch,
      'Points Required': item.reward.points_required,
      'Available': item.reward.available ? 'Yes' : 'No'
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rewards_order_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter data based on search query
  const filteredOrderData = orderData.filter(item => {
    const searchString = searchQuery.toLowerCase();
    return (
      item.reward.title.toLowerCase().includes(searchString) ||
      item.reward.description.toLowerCase().includes(searchString)
    );
  });

  // Sort by pending dispatch (highest first) then by total redeemed
  const sortedOrderData = filteredOrderData.sort((a, b) => {
    if (a.pendingDispatch !== b.pendingDispatch) {
      return b.pendingDispatch - a.pendingDispatch;
    }
    return b.totalRedeemed - a.totalRedeemed;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">To Order</h1>
          <p className="text-gray-600">Track reward redemptions and dispatch requirements</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn btn-outline flex items-center"
          disabled={orderData.length === 0}
        >
          <Download size={16} className="mr-2" />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Rewards</p>
              <p className="text-2xl font-bold text-gray-900">{orderData.length}</p>
            </div>
            <Package className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Dispatch</p>
              <p className="text-2xl font-bold text-warning-600">
                {orderData.reduce((sum, item) => sum + item.pendingDispatch, 0)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-warning-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Redeemed</p>
              <p className="text-2xl font-bold text-blue-600">
                {orderData.reduce((sum, item) => sum + item.totalRedeemed, 0)}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-success-600">
                {orderData.reduce((sum, item) => sum + item.completedDispatch, 0)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search rewards..."
              className="form-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>

          <select
            className="form-input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all_time">All Time</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="form-input text-sm"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="form-input text-sm"
              />
              <button
                onClick={handleCustomDateFilter}
                className="btn btn-primary btn-sm"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Data Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {sortedOrderData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Redeemed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending Dispatch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOrderData.map((item) => (
                  <tr key={item.reward.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={item.reward.image_url}
                          alt={item.reward.title}
                          className="h-12 w-12 rounded-lg object-cover mr-4"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.reward.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {item.reward.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="font-semibold text-blue-600">{item.totalRedeemed}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className={`font-semibold ${
                        item.pendingDispatch > 0 ? 'text-warning-600' : 'text-gray-400'
                      }`}>
                        {item.pendingDispatch}
                      </span>
                      {item.pendingDispatch > 0 && (
                        <div className="text-xs text-warning-600 mt-1">
                          ⚠️ Needs dispatch
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="font-semibold text-success-600">{item.completedDispatch}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.reward.points_required}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.reward.available 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.reward.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Order Data Found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No rewards match your search for "${searchQuery}"`
                : 'No reward redemptions found for the selected filters'}
            </p>
          </div>
        )}
      </div>

      {/* Recent Redemptions Details */}
      {sortedOrderData.some(item => item.recentRedemptions.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recent Redemptions Details</h3>
            <p className="text-sm text-gray-600">Latest redemptions for each reward</p>
          </div>
          <div className="divide-y">
            {sortedOrderData
              .filter(item => item.recentRedemptions.length > 0)
              .slice(0, 5) // Show top 5 rewards with recent redemptions
              .map((item) => (
                <div key={item.reward.id} className="p-6">
                  <h4 className="font-medium text-gray-900 mb-3">{item.reward.title}</h4>
                  <div className="space-y-2">
                    {item.recentRedemptions.map((redemption, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-medium text-xs">
                              {redemption.user?.first_name?.[0]}{redemption.user?.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {redemption.user?.first_name} {redemption.user?.last_name}
                            </p>
                            <p className="text-gray-500">
                              {redemption.user?.user_code} • {redemption.user?.role} • {redemption.user?.city}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900">{format(new Date(redemption.date), 'MMM dd, yyyy')}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            redemption.transaction.status === 'completed'
                              ? 'bg-success-100 text-success-700'
                              : redemption.transaction.status === 'approved'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-warning-100 text-warning-700'
                          }`}>
                            {redemption.transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}