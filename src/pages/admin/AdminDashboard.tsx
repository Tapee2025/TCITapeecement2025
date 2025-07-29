import { useEffect, useState } from 'react';
import { Users, ShoppingBag, Award, ClipboardCheck, Calendar, TrendingUp, Package, Building2, BarChart3 } from 'lucide-react';
import DashboardCard from '../../components/ui/DashboardCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { calculateBagsFromTransaction } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users except admins
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'admin')
        .order('role', { ascending: true });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch all transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Fetch recent activity with user details
      const { data: recentTransactions, error: recentError } = await supabase
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

      if (recentError) throw recentError;
      setRecentActivity(recentTransactions || []);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomPeriodData = async () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    try {
      const { data: customData, error } = await supabase
        .from('transactions')
        .select('amount, description, user_id')
        .eq('type', 'earned')
        .eq('status', 'approved')
        .gte('created_at', customStartDate + 'T00:00:00')
        .lte('created_at', customEndDate + 'T23:59:59');

      if (error) throw error;
      toast.success('Custom period data loaded');
    } catch (error: any) {
      console.error('Error fetching custom period data:', error);
      toast.error('Failed to load custom period data');
    }
  };

  // Calculate stats
  const totalUsers = users.length;
  const dealerCount = users.filter(u => u.role === 'dealer').length;
  const subDealerCount = users.filter(u => u.role === 'sub_dealer').length;
  const contractorCount = users.filter(u => u.role === 'contractor').length;

  const pendingPointsApprovals = transactions.filter(t => 
    t.type === 'earned' && (t.status === 'pending' || t.status === 'dealer_approved')
  ).length;

  const pendingRedemptions = transactions.filter(t => 
    t.type === 'redeemed' && t.status === 'pending'
  ).length;

  const pendingDispatch = transactions.filter(t => 
    t.type === 'redeemed' && (t.status === 'pending' || t.status === 'approved')
  ).length;

  const totalPointsIssued = transactions
    .filter(t => t.type === 'earned' && t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRedemptions = transactions.filter(t => 
    t.type === 'redeemed' && (t.status === 'approved' || t.status === 'completed')
  ).length;

  // Calculate bags sold by category
  const dealerIds = users.filter(u => u.role === 'dealer').map(u => u.id);
  const subDealerIds = users.filter(u => u.role === 'sub_dealer').map(u => u.id);

  const dealerTransactions = transactions.filter(t => 
    t.type === 'earned' && t.status === 'approved' && dealerIds.includes(t.user_id)
  );
  const subDealerTransactions = transactions.filter(t => 
    t.type === 'earned' && t.status === 'approved' && subDealerIds.includes(t.user_id)
  );

  const dealerBagsSold = dealerTransactions.reduce((sum, t) => 
    sum + calculateBagsFromTransaction(t.description, t.amount), 0
  );
  const subDealerBagsSold = subDealerTransactions.reduce((sum, t) => 
    sum + calculateBagsFromTransaction(t.description, t.amount), 0
  );
  const totalBagsSold = dealerBagsSold + subDealerBagsSold;

  // Calculate period-specific data
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const getCurrentMonthData = () => {
    const currentMonthTransactions = transactions.filter(t => 
      t.type === 'earned' && t.status === 'approved' && 
      new Date(t.created_at) >= currentMonthStart
    );
    const dealerCurrentMonth = currentMonthTransactions
      .filter(t => dealerIds.includes(t.user_id))
      .reduce((sum, t) => sum + calculateBagsFromTransaction(t.description, t.amount), 0);
    const subDealerCurrentMonth = currentMonthTransactions
      .filter(t => subDealerIds.includes(t.user_id))
      .reduce((sum, t) => sum + calculateBagsFromTransaction(t.description, t.amount), 0);
    
    return {
      dealer: dealerCurrentMonth,
      subDealer: subDealerCurrentMonth,
      total: dealerCurrentMonth + subDealerCurrentMonth
    };
  };

  const getQuarterlyData = () => {
    const quarterlyTransactions = transactions.filter(t => 
      t.type === 'earned' && t.status === 'approved' && 
      new Date(t.created_at) >= threeMonthsAgo
    );
    const dealerQuarterly = quarterlyTransactions
      .filter(t => dealerIds.includes(t.user_id))
      .reduce((sum, t) => sum + calculateBagsFromTransaction(t.description, t.amount), 0);
    const subDealerQuarterly = quarterlyTransactions
      .filter(t => subDealerIds.includes(t.user_id))
      .reduce((sum, t) => sum + calculateBagsFromTransaction(t.description, t.amount), 0);
    
    return {
      dealer: dealerQuarterly,
      subDealer: subDealerQuarterly,
      total: dealerQuarterly + subDealerQuarterly
    };
  };

  const getHalfYearlyData = () => {
    const halfYearlyTransactions = transactions.filter(t => 
      t.type === 'earned' && t.status === 'approved' && 
      new Date(t.created_at) >= sixMonthsAgo
    );
    const dealerHalfYearly = halfYearlyTransactions
      .filter(t => dealerIds.includes(t.user_id))
      .reduce((sum, t) => sum + calculateBagsFromTransaction(t.description, t.amount), 0);
    const subDealerHalfYearly = halfYearlyTransactions
      .filter(t => subDealerIds.includes(t.user_id))
      .reduce((sum, t) => sum + calculateBagsFromTransaction(t.description, t.amount), 0);
    
    return {
      dealer: dealerHalfYearly,
      subDealer: subDealerHalfYearly,
      total: dealerHalfYearly + subDealerHalfYearly
    };
  };

  const getYearlyData = () => {
    const yearlyTransactions = transactions.filter(t => 
      t.type === 'earned' && t.status === 'approved' && 
      new Date(t.created_at) >= yearStart
    );
    const dealerYearly = yearlyTransactions
      .filter(t => dealerIds.includes(t.user_id))
      .reduce((sum, t) => sum + calculateBagsFromTransaction(t.description, t.amount), 0);
    const subDealerYearly = yearlyTransactions
      .filter(t => subDealerIds.includes(t.user_id))
      .reduce((sum, t) => sum + calculateBagsFromTransaction(t.description, t.amount), 0);
    
    return {
      dealer: dealerYearly,
      subDealer: subDealerYearly,
      total: dealerYearly + subDealerYearly
    };
  };

  const currentMonthData = getCurrentMonthData();
  const quarterlyData = getQuarterlyData();
  const halfYearlyData = getHalfYearlyData();
  const yearlyData = getYearlyData();
  const lifetimeData = { dealer: dealerBagsSold, subDealer: subDealerBagsSold, total: totalBagsSold };

  const getPerformanceValue = () => {
    switch (performancePeriod) {
      case 'current_month': return currentMonthData;
      case 'quarterly': return quarterlyData;
      case 'half_yearly': return halfYearlyData;
      case 'yearly': return yearlyData;
      case 'lifetime': return lifetimeData;
      default: return currentMonthData;
    }
  };

  const getPerformanceLabel = () => {
    switch (performancePeriod) {
      case 'current_month': return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'quarterly': return 'Last 3 Months';
      case 'half_yearly': return 'Last 6 Months';
      case 'yearly': return new Date().getFullYear().toString();
      case 'lifetime': return 'All Time';
      default: return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button 
          onClick={fetchDashboardData}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  const performanceData = getPerformanceValue();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to the Tapee Cement Loyalty Program admin panel</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          bgColor="bg-primary-500"
        />
        <DashboardCard
          title="Pending Points"
          value={pendingPointsApprovals}
          icon={ClipboardCheck}
          bgColor="bg-warning-500"
          description="Points awaiting approval"
        />
        <DashboardCard
          title="Pending Redemptions"
          value={pendingRedemptions}
          icon={Award}
          bgColor="bg-accent-500"
          description="Rewards awaiting approval"
        />
        <DashboardCard
          title="Pending Dispatch"
          value={pendingDispatch}
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
            Sales Performance Metrics
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Bags Sold</p>
                <p className="text-2xl font-bold text-green-700">{performanceData.total}</p>
                <p className="text-xs text-green-600">{getPerformanceLabel()}</p>
              </div>
              <Package className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Dealer Bags</p>
                <p className="text-2xl font-bold text-blue-700">{performanceData.dealer}</p>
                <p className="text-xs text-blue-600">{getPerformanceLabel()}</p>
              </div>
              <Building2 className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Sub Dealer Bags</p>
                <p className="text-2xl font-bold text-purple-700">{performanceData.subDealer}</p>
                <p className="text-xs text-purple-600">{getPerformanceLabel()}</p>
              </div>
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Points Issued</p>
                <p className="text-2xl font-bold text-blue-700">{totalPointsIssued}</p>
                <p className="text-xs text-blue-600">All Time</p>
              </div>
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Active Dealers</p>
                <p className="text-2xl font-bold text-orange-700">{dealerCount}</p>
                <p className="text-xs text-orange-600">Registered</p>
              </div>
              <Building2 className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Detailed Sales Comparison</h4>
          
          {/* Total Sales Row */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Total Sales (Dealers + Sub Dealers)</h5>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-lg font-bold text-green-700">{currentMonthData.total}</p>
                <p className="text-xs text-green-600">This Month</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-lg font-bold text-green-700">{quarterlyData.total}</p>
                <p className="text-xs text-green-600">Last 3 Months</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-lg font-bold text-green-700">{halfYearlyData.total}</p>
                <p className="text-xs text-green-600">Last 6 Months</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-lg font-bold text-green-700">{yearlyData.total}</p>
                <p className="text-xs text-green-600">This Year</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-lg font-bold text-green-700">{lifetimeData.total}</p>
                <p className="text-xs text-green-600">All Time</p>
              </div>
            </div>
          </div>
          
          {/* Dealer Sales Row */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Dealer Sales Only</h5>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg font-bold text-blue-700">{currentMonthData.dealer}</p>
                <p className="text-xs text-blue-600">This Month</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg font-bold text-blue-700">{quarterlyData.dealer}</p>
                <p className="text-xs text-blue-600">Last 3 Months</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg font-bold text-blue-700">{halfYearlyData.dealer}</p>
                <p className="text-xs text-blue-600">Last 6 Months</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg font-bold text-blue-700">{yearlyData.dealer}</p>
                <p className="text-xs text-blue-600">This Year</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg font-bold text-blue-700">{lifetimeData.dealer}</p>
                <p className="text-xs text-blue-600">All Time</p>
              </div>
            </div>
          </div>
          
          {/* Sub Dealer Sales Row */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Sub Dealer Sales Only</h5>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-lg font-bold text-purple-700">{currentMonthData.subDealer}</p>
                <p className="text-xs text-purple-600">This Month</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-lg font-bold text-purple-700">{quarterlyData.subDealer}</p>
                <p className="text-xs text-purple-600">Last 3 Months</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-lg font-bold text-purple-700">{halfYearlyData.subDealer}</p>
                <p className="text-xs text-purple-600">Last 6 Months</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-lg font-bold text-purple-700">{yearlyData.subDealer}</p>
                <p className="text-xs text-purple-600">This Year</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-lg font-bold text-purple-700">{lifetimeData.subDealer}</p>
                <p className="text-xs text-purple-600">All Time</p>
              </div>
            </div>
          </div>
          
          {/* Dealer Network Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <Building2 className="mr-2 text-primary-600" size={18} />
              Dealer Network Overview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="text-center">
                  <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{dealerCount}</p>
                  <p className="text-sm text-blue-600">Active Dealers</p>
                  <p className="text-xs text-blue-500">Direct distributors</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="text-center">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">{subDealerCount}</p>
                  <p className="text-sm text-purple-600">Sub Dealers</p>
                  <p className="text-xs text-purple-500">Network partners</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="text-center">
                  <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">
                    {totalBagsSold > 0 ? ((dealerBagsSold / totalBagsSold) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-green-600">Dealer Share</p>
                  <p className="text-xs text-green-500">
                    vs {totalBagsSold > 0 ? ((subDealerBagsSold / totalBagsSold) * 100).toFixed(1) : 0}% Sub Dealer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Links */}
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
              {pendingPointsApprovals} points requests pending
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
              {pendingDispatch} rewards pending dispatch
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
                <span className="text-sm text-gray-700">{dealerCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${totalUsers > 0 ? (dealerCount / totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700">Sub Dealers</span>
                <span className="text-sm text-gray-700">{subDealerCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${totalUsers > 0 ? (subDealerCount / totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-700">Contractors/Masons</span>
                <span className="text-sm text-gray-700">{contractorCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-accent-600 h-2 rounded-full"
                  style={{ width: `${totalUsers > 0 ? (contractorCount / totalUsers) * 100 : 0}%` }}
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