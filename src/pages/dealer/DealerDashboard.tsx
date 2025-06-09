import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Database } from '../../lib/database.types';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, ArrowRight, Check, X, Users, Package, TrendingUp, Building2, ShoppingBag, BarChart3, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export default function DealerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dealerData, setDealerData] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    pendingApprovals: 0,
    approvedToday: 0,
    totalCustomers: 0,
    currentMonthBags: 0,
    currentMonthName: '',
    last3MonthsBags: 0,
    last6MonthsBags: 0,
    yearlyBags: 0,
    lifetimeBags: 0
  });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [performancePeriod, setPerformancePeriod] = useState('current_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (performancePeriod === 'custom') {
      setShowCustomPeriod(true);
    } else {
      setShowCustomPeriod(false);
    }
  }, [performancePeriod]);

  async function fetchDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get dealer profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setDealerData(profile);

      // Get recent transactions (limited to 3 for compact view)
      const { data: dealerTransactions, error: transactionError } = await supabase
        .from('transactions')
        .select('*, users!transactions_user_id_fkey(*)')
        .eq('dealer_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);

      if (transactionError) throw transactionError;

      // Get all stats
      const { count: totalCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', user.id);

      const { count: pendingCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', user.id)
        .eq('status', 'pending');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: approvedTodayCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', user.id)
        .eq('status', 'dealer_approved')
        .gte('created_at', today.toISOString());

      // Get unique customers count
      const { data: customerData } = await supabase
        .from('transactions')
        .select('user_id')
        .eq('dealer_id', user.id);

      const uniqueCustomers = new Set(customerData?.map(t => t.user_id)).size;

      // Get performance metrics for different periods
      const { data: currentMonthData } = await supabase
        .rpc('get_performance_metrics', {
          p_dealer_id: user.id,
          p_period: 'current_month'
        });

      const { data: last3MonthsData } = await supabase
        .rpc('get_performance_metrics', {
          p_dealer_id: user.id,
          p_period: 'last_3_months'
        });

      const { data: last6MonthsData } = await supabase
        .rpc('get_performance_metrics', {
          p_dealer_id: user.id,
          p_period: 'last_6_months'
        });

      const { data: yearlyData } = await supabase
        .rpc('get_performance_metrics', {
          p_dealer_id: user.id,
          p_period: 'yearly'
        });

      const { data: lifetimeData } = await supabase
        .rpc('get_performance_metrics', {
          p_dealer_id: user.id,
          p_period: 'lifetime'
        });

      // Get current month name
      const currentMonthName = new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });

      setRecentTransactions(dealerTransactions || []);
      setStats({
        totalTransactions: totalCount || 0,
        pendingApprovals: pendingCount || 0,
        approvedToday: approvedTodayCount || 0,
        totalCustomers: uniqueCustomers,
        currentMonthBags: currentMonthData?.[0]?.total_bags_sold || 0,
        currentMonthName,
        last3MonthsBags: last3MonthsData?.[0]?.total_bags_sold || 0,
        last6MonthsBags: last6MonthsData?.[0]?.total_bags_sold || 0,
        yearlyBags: yearlyData?.[0]?.total_bags_sold || 0,
        lifetimeBags: lifetimeData?.[0]?.total_bags_sold || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCustomPeriodData() {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: customData } = await supabase
        .rpc('get_performance_metrics', {
          p_dealer_id: user.id,
          p_period: 'custom',
          p_start_date: customStartDate,
          p_end_date: customEndDate
        });

      setStats(prev => ({
        ...prev,
        currentMonthBags: customData?.[0]?.total_bags_sold || 0,
        currentMonthName: `Custom Period (${customStartDate} to ${customEndDate})`
      }));

      toast.success('Custom period data loaded');
    } catch (error) {
      console.error('Error fetching custom period data:', error);
      toast.error('Failed to load custom period data');
    }
  }

  async function handleApprove(transactionId: string) {
    setProcessingId(transactionId);
    try {
      const transaction = recentTransactions.find(t => t.id === transactionId);
      if (!transaction) {
        toast.error('Transaction not found');
        return;
      }

      const user = (transaction as any).users;
      if (!user) {
        toast.error('User not found');
        return;
      }

      // Create dealer approval record
      const { error: approvalError } = await supabase
        .from('dealer_approvals')
        .insert({
          transaction_id: transaction.id,
          user_id: user.id,
          dealer_id: transaction.dealer_id,
          amount: transaction.amount,
          description: transaction.description,
          status: 'pending'
        });

      if (approvalError) throw approvalError;

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: 'dealer_approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      toast.success('Transaction approved successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast.error('Failed to approve transaction');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(transactionId: string) {
    setProcessingId(transactionId);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;
      toast.success('Transaction rejected');
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast.error('Failed to reject transaction');
    } finally {
      setProcessingId(null);
    }
  }

  const getPerformanceValue = () => {
    switch (performancePeriod) {
      case 'current_month': return stats.currentMonthBags;
      case 'last_3_months': return stats.last3MonthsBags;
      case 'last_6_months': return stats.last6MonthsBags;
      case 'yearly': return stats.yearlyBags;
      case 'lifetime': return stats.lifetimeBags;
      case 'custom': return stats.currentMonthBags;
      default: return stats.currentMonthBags;
    }
  };

  const getPerformanceLabel = () => {
    switch (performancePeriod) {
      case 'current_month': return stats.currentMonthName;
      case 'last_3_months': return 'Last 3 Months';
      case 'last_6_months': return 'Last 6 Months';
      case 'yearly': return new Date().getFullYear().toString();
      case 'lifetime': return 'All Time';
      case 'custom': return stats.currentMonthName;
      default: return stats.currentMonthName;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Welcome, {dealerData?.first_name}!</h1>
            <p className="text-primary-100 text-sm">Dealer Dashboard</p>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-xs">Dealer Code</p>
            <p className="text-lg font-bold">{dealerData?.user_code}</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics with Period Selector */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <BarChart3 className="mr-2 text-primary-600" size={18} />
            Performance Metrics
          </h3>
          <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <select
              value={performancePeriod}
              onChange={(e) => setPerformancePeriod(e.target.value)}
              className="form-input text-sm"
            >
              <option value="current_month">Current Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="yearly">This Year</option>
              <option value="lifetime">Lifetime</option>
              <option value="custom">Custom Period</option>
            </select>
            
            {showCustomPeriod && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="form-input text-sm"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="form-input text-sm"
                  placeholder="End Date"
                />
                <button
                  onClick={fetchCustomPeriodData}
                  className="btn btn-primary btn-sm"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
            <div className="text-center">
              <ShoppingBag className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">{getPerformanceValue()}</p>
              <p className="text-xs text-green-600">Bags Sold</p>
              <p className="text-xs text-green-500">{getPerformanceLabel()}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
            <div className="text-center">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-700">{stats.totalCustomers}</p>
              <p className="text-xs text-blue-600">Total Customers</p>
              <p className="text-xs text-blue-500">All Time</p>
            </div>
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="font-medium text-gray-900">{stats.currentMonthBags}</p>
            <p className="text-gray-600">{stats.currentMonthName.split(' ')[0]}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="font-medium text-gray-900">{stats.last3MonthsBags}</p>
            <p className="text-gray-600">3 Months</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="font-medium text-gray-900">{stats.last6MonthsBags}</p>
            <p className="text-gray-600">6 Months</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="font-medium text-gray-900">{stats.yearlyBags}</p>
            <p className="text-gray-600">This Year</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="font-medium text-gray-900">{stats.lifetimeBags}</p>
            <p className="text-gray-600">Lifetime</p>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending Approvals</p>
              <p className="text-xl font-bold text-gray-900">{stats.pendingApprovals}</p>
            </div>
            <Clock className="w-8 h-8 text-warning-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Approved Today</p>
              <p className="text-xl font-bold text-gray-900">{stats.approvedToday}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/dealer/approve-points"
          className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-all flex items-center space-x-3"
        >
          <div className="bg-warning-100 text-warning-700 p-2 rounded-lg">
            <Clock size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Approve Points</h3>
            <p className="text-xs text-gray-600">{stats.pendingApprovals} pending</p>
          </div>
          <ArrowRight className="text-gray-400" size={16} />
        </Link>

        <Link
          to="/dealer/rewards"
          className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-all flex items-center space-x-3"
        >
          <div className="bg-accent-100 text-accent-700 p-2 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">View Rewards</h3>
            <p className="text-xs text-gray-600">Browse catalog</p>
          </div>
          <ArrowRight className="text-gray-400" size={16} />
        </Link>
      </div>

      {/* Dealer Information - Compact */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Building2 className="mr-2 text-primary-600" size={18} />
          Dealer Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">District</p>
            <p className="font-medium">{dealerData?.district}</p>
          </div>
          <div>
            <p className="text-gray-500">City</p>
            <p className="font-medium">{dealerData?.city}</p>
          </div>
          <div>
            <p className="text-gray-500">GST Number</p>
            <p className="font-medium text-xs">{dealerData?.gst_number || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Transactions</p>
            <p className="font-medium">{stats.totalTransactions}</p>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-semibold text-gray-900">Pending Approvals</h3>
          <Link to="/dealer/approve-points" className="text-primary-600 text-sm flex items-center">
            View all <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>

        <div className="divide-y">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 font-medium text-sm">
                        {(transaction as any).users?.first_name?.[0]}
                        {(transaction as any).users?.last_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {(transaction as any).users?.first_name} {(transaction as any).users?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.amount} points • {transaction.amount / 10} bags
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(transaction.id)}
                      disabled={processingId === transaction.id}
                      className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                      title="Approve"
                    >
                      {processingId === transaction.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Check size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(transaction.id)}
                      disabled={processingId === transaction.id}
                      className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                      title="Reject"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No pending approvals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}