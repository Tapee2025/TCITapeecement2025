import { useState, useEffect } from 'react';
import { Users, ShoppingBag, Award, ClipboardCheck, Calendar, TrendingUp, Package, Building2, BarChart3 } from 'lucide-react';
import DashboardCard from '../../components/ui/DashboardCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { calculateBagsFromTransaction } from '../../utils/helpers';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingPointsApprovals: 0,
    pendingRedemptions: 0,
    totalRewards: 0,
    totalPoints: 0,
    totalRedemptions: 0,
    totalDealers: 0,
    totalBuilders: 0,
    totalContractors: 0,
    totalBagsSold: 0,
    activeSlides: 0,
    currentMonthBags: 0,
    currentMonthName: '',
    quarterlyBagsSold: 0,
    halfYearlyBagsSold: 0,
    yearlyBagsSold: 0,
    lifetimeBagsSold: 0,
    pendingDispatch: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
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
      if (performancePeriod !== 'current_month') {
        fetchPerformanceData();
      }
    }
  }, [performancePeriod]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      // Get all users except admins
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin');

      if (usersError) throw usersError;

      // Count users by role
      const dealerCount = users?.filter(u => u.role === 'dealer').length || 0;
      const builderCount = users?.filter(u => u.role === 'builder').length || 0;
      const contractorCount = users?.filter(u => u.role === 'contractor').length || 0;

      // Get pending points approvals (earned transactions with pending or dealer_approved status)
      const { data: pendingPointsData, error: pointsApprovalsError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('type', 'earned')
        .in('status', ['pending', 'dealer_approved']);

      if (pointsApprovalsError) throw pointsApprovalsError;

      // Get pending redemptions (redeemed transactions with pending status)
      const { data: pendingRedemptionsData, error: redemptionsError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('type', 'redeemed')
        .eq('status', 'pending');

      if (redemptionsError) throw redemptionsError;

      // Get total rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from('rewards')
        .select('*', { count: 'exact' })
        .eq('available', true);

      if (rewardsError) throw rewardsError;

      // Calculate total points issued (from approved transactions)
      const { data: approvedTransactions, error: pointsError } = await supabase
        .from('transactions')
        .select('amount, description')
        .eq('status', 'approved')
        .eq('type', 'earned');

      if (pointsError) throw pointsError;

      const totalPointsIssued = approvedTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      
      // Calculate total bags sold with proper cement type handling
      const totalBagsSold = approvedTransactions?.reduce((sum, t) => 
        sum + calculateBagsFromTransaction(t.description, t.amount), 0) || 0;

      // Get total redemptions
      const { data: redemptions, error: redemptionsCountError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('type', 'redeemed')
        .in('status', ['approved', 'completed']);

      if (redemptionsCountError) throw redemptionsCountError;

      // Get pending dispatch count (redeemed rewards not yet completed)
      const { data: pendingDispatchData, error: pendingDispatchError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('type', 'redeemed')
        .in('status', ['pending', 'approved']);

      if (pendingDispatchError) throw pendingDispatchError;

      // Get active marketing slides
      const { data: activeSlides, error: slidesError } = await supabase
        .from('marketing_slides')
        .select('*', { count: 'exact' })
        .eq('active', true);

      if (slidesError) throw slidesError;

      // Get current month name
      const currentMonthName = new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });

      // Calculate performance metrics for different periods using direct transaction queries
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      // Current month bags
      const { data: currentMonthTransactions } = await supabase
        .from('transactions')
        .select('amount, description')
        .eq('type', 'earned')
        .eq('status', 'approved')
        .gte('created_at', currentMonthStart.toISOString());

      const currentMonthBags = currentMonthTransactions?.reduce((sum, t) => 
        sum + calculateBagsFromTransaction(t.description, t.amount), 0) || 0;

      // Last 3 months bags
      const { data: quarterlyTransactions } = await supabase
        .from('transactions')
        .select('amount, description')
        .eq('type', 'earned')
        .eq('status', 'approved')
        .gte('created_at', threeMonthsAgo.toISOString());

      const quarterlyBagsSold = quarterlyTransactions?.reduce((sum, t) => 
        sum + calculateBagsFromTransaction(t.description, t.amount), 0) || 0;

      // Last 6 months bags
      const { data: halfYearlyTransactions } = await supabase
        .from('transactions')
        .select('amount, description')
        .eq('type', 'earned')
        .eq('status', 'approved')
        .gte('created_at', sixMonthsAgo.toISOString());

      const halfYearlyBagsSold = halfYearlyTransactions?.reduce((sum, t) => 
        sum + calculateBagsFromTransaction(t.description, t.amount), 0) || 0;

      // This year bags
      const { data: yearlyTransactions } = await supabase
        .from('transactions')
        .select('amount, description')
        .eq('type', 'earned')
        .eq('status', 'approved')
        .gte('created_at', yearStart.toISOString());

      const yearlyBagsSold = yearlyTransactions?.reduce((sum, t) => 
        sum + calculateBagsFromTransaction(t.description, t.amount), 0) || 0;

      // Get recent activity (all transactions)
      const { data: recentTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          users!transactions_user_id_fkey (
            first_name,
            last_name,
            role,
            user_code
          ),
          dealers:users!transactions_dealer_id_fkey (
            first_name,
            last_name,
            user_code
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionsError) throw transactionsError;

      setStats({
        totalUsers: users?.length || 0,
        pendingPointsApprovals: pendingPointsData?.length || 0,
        pendingRedemptions: pendingRedemptionsData?.length || 0,
        totalRewards: rewards?.length || 0,
        totalPoints: totalPointsIssued,
        totalRedemptions: redemptions?.length || 0,
        totalDealers: dealerCount,
        totalBuilders: builderCount,
        totalContractors: contractorCount,
        totalBagsSold,
        activeSlides: activeSlides?.length || 0,
        currentMonthBags,
        currentMonthName,
        quarterlyBagsSold,
        halfYearlyBagsSold,
        yearlyBagsSold,
        lifetimeBagsSold: totalBagsSold,
        pendingDispatch: pendingDispatchData?.length || 0
      });

      setRecentActivity(recentTransactions || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPerformanceData() {
    try {
      // This would be implemented to fetch aggregated performance data for all dealers
      // For now, we'll use the existing data
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  }

  async function fetchCustomPeriodData() {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    try {
      // Calculate custom period performance from transactions
      const { data: customTransactions, error } = await supabase
        .from('transactions')
        .select('amount, description')
        .eq('type', 'earned')
        .eq('status', 'approved')
        .gte('created_at', customStartDate)
        .lte('created_at', customEndDate + 'T23:59:59');

      if (error) throw error;

      const customPeriodBags = customTransactions?.reduce((sum, t) => 
        sum + calculateBagsFromTransaction(t.description, t.amount), 0) || 0;

      setStats(prev => ({
        ...prev,
        currentMonthBags: customPeriodBags,
        currentMonthName: `Custom Period (${customStartDate} to ${customEndDate})`
      }));

      toast.success('Custom period data loaded');
    } catch (error) {
      console.error('Error fetching custom period data:', error);
      toast.error('Failed to load custom period data');
    }
  }

  const getPerformanceValue = () => {
    switch (performancePeriod) {
      case 'current_month': return stats.currentMonthBags;
      case 'quarterly': return stats.quarterlyBagsSold;
      case 'half_yearly': return stats.halfYearlyBagsSold;
      case 'yearly': return stats.yearlyBagsSold;
      case 'lifetime': return stats.lifetimeBagsSold;
      case 'custom': return stats.currentMonthBags;
      default: return stats.currentMonthBags;
    }
  };

  const getPerformanceLabel = () => {
    switch (performancePeriod) {
      case 'current_month': return stats.currentMonthName;
      case 'quarterly': return 'Last 3 Months';
      case 'half_yearly': return 'Last 6 Months';
      case 'yearly': return new Date().getFullYear().toString();
      case 'lifetime': return 'All Time';
      case 'custom': return stats.currentMonthName;
      default: return stats.currentMonthName;
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to the Tapee Cement Loyalty Program admin panel</p>
      </div>
      
      {/* Stats Cards - Updated to separate points and redemptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          bgColor="bg-primary-500"
        />
        <DashboardCard
          title="Pending Points"
          value={stats.pendingPointsApprovals}
          icon={ClipboardCheck}
          bgColor="bg-warning-500"
          description="Points awaiting approval"
        />
        <DashboardCard
          title="Pending Redemptions"
          value={stats.pendingRedemptions}
          icon={Award}
          bgColor="bg-accent-500"
          description="Rewards awaiting approval"
        />
        <DashboardCard
          title="Pending Dispatch"
          value={stats.pendingDispatch}
          icon={Package}
          bgColor="bg-error-500"
          description="Items to be dispatched"
        />
      </div>

      {/* Performance Metrics with Period Selector */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="mr-2 text-primary-600" size={20} />
            Performance Metrics
          </h3>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <select
              value={performancePeriod}
              onChange={(e) => setPerformancePeriod(e.target.value)}
              className="form-input text-sm"
            >
              <option value="current_month">Current Month</option>
              <option value="quarterly">Last 3 Months</option>
              <option value="half_yearly">Last 6 Months</option>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Bags Sold</p>
                <p className="text-2xl font-bold text-green-700">{getPerformanceValue()}</p>
                <p className="text-xs text-green-600">{getPerformanceLabel()}</p>
              </div>
              <Package className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Points Issued</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalPoints}</p>
                <p className="text-xs text-blue-600">All Time</p>
              </div>
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Active Dealers</p>
                <p className="text-2xl font-bold text-purple-700">{stats.totalDealers}</p>
                <p className="text-xs text-purple-600">Registered</p>
              </div>
              <Building2 className="text-purple-600" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Marketing Slides</p>
                <p className="text-2xl font-bold text-orange-700">{stats.activeSlides}</p>
                <p className="text-xs text-orange-600">Active</p>
              </div>
              <Calendar className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Bags Sold Comparison</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{stats.currentMonthBags}</p>
              <p className="text-xs text-gray-600">{stats.currentMonthName}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{stats.quarterlyBagsSold}</p>
              <p className="text-xs text-gray-600">Last 3 Months</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{stats.halfYearlyBagsSold}</p>
              <p className="text-xs text-gray-600">Last 6 Months</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{stats.yearlyBagsSold}</p>
              <p className="text-xs text-gray-600">This Year</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{stats.lifetimeBagsSold}</p>
              <p className="text-xs text-gray-600">All Time</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Links - Updated with separate sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/admin/approvals"
          className="bg-white rounded-lg p-6 shadow border hover:shadow-md transition-all flex items-center space-x-4"
        >
          <div className="bg-warning-100 text-warning-700 p-3 rounded-full">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Points Approvals</h3>
            <p className="text-gray-600 text-sm">
              {stats.pendingPointsApprovals} points requests pending
            </p>
          </div>
        </Link>
        
        <Link
          to="/admin/to-order"
          className="bg-white rounded-lg p-6 shadow border hover:shadow-md transition-all flex items-center space-x-4"
        >
          <div className="bg-error-100 text-error-700 p-3 rounded-full">
            <Package size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">To Order</h3>
            <p className="text-gray-600 text-sm">
              {stats.pendingDispatch} rewards pending dispatch
            </p>
          </div>
        </Link>
        
        <Link
          to="/admin/users"
          className="bg-white rounded-lg p-6 shadow border hover:shadow-md transition-all flex items-center space-x-4"
        >
          <div className="bg-primary-100 text-primary-700 p-3 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Manage Users</h3>
            <p className="text-gray-600 text-sm">
              View and manage all registered users
            </p>
          </div>
        </Link>
        
        <Link
          to="/admin/rewards"
          className="bg-white rounded-lg p-6 shadow border hover:shadow-md transition-all flex items-center space-x-4"
        >
          <div className="bg-accent-100 text-accent-700 p-3 rounded-full">
            <Award size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Manage Rewards</h3>
            <p className="text-gray-600 text-sm">
              Add, edit or remove available rewards
            </p>
          </div>
        </Link>
      </div>
      
      {/* User Distribution and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700">Dealers/Distributors</span>
                <span className="text-sm text-gray-700">{stats.totalDealers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${stats.totalUsers > 0 ? (stats.totalDealers / stats.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700">Builders</span>
                <span className="text-sm text-gray-700">{stats.totalBuilders}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-secondary-600 h-2 rounded-full"
                  style={{ width: `${stats.totalUsers > 0 ? (stats.totalBuilders / stats.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700">Contractors/Masons</span>
                <span className="text-sm text-gray-700">{stats.totalContractors}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-accent-600 h-2 rounded-full"
                  style={{ width: `${stats.totalUsers > 0 ? (stats.totalContractors / stats.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex">
                <div className="mr-4 flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    {activity.type === 'earned' ? (
                      <TrendingUp size={16} className="text-success-500" />
                    ) : (
                      <Award size={16} className="text-accent-500" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.type === 'earned' ? 'Points request: ' : 'Points redeemed: '}
                    {activity.amount} points by {activity.users?.first_name || 'Unknown'} {activity.users?.last_name || 'User'}
                    <span className="text-xs text-gray-500 ml-1">({activity.users?.user_code || 'N/A'})</span>
                  </p>
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={`px-1.5 py-0.5 rounded-full ${
                      activity.status === 'approved' ? 'bg-success-100 text-success-800' :
                      activity.status === 'dealer_approved' ? 'bg-blue-100 text-blue-800' :
                      activity.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                      'bg-error-100 text-error-800'
                    }`}>
                      {activity.status}
                    </span>
                    {activity.dealers && (
                      <>
                        <span>•</span>
                        <span>Dealer: {activity.dealers?.first_name || 'Unknown'} {activity.dealers?.last_name || 'Dealer'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {recentActivity.length === 0 && (
              <p className="text-center text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}