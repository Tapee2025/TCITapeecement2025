import { useState, useEffect } from 'react';
import { Users, ShoppingBag, Award, ClipboardCheck, Calendar } from 'lucide-react';
import DashboardCard from '../../components/ui/DashboardCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalRewards: 0,
    totalPoints: 0,
    totalRedemptions: 0,
    totalDealers: 0,
    totalBuilders: 0,
    totalContractors: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
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

      // Get pending approvals (transactions approved by dealers)
      const { data: pendingApprovals, error: approvalsError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('status', 'dealer_approved');

      if (approvalsError) throw approvalsError;

      // Get total rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from('rewards')
        .select('*', { count: 'exact' })
        .eq('available', true);

      if (rewardsError) throw rewardsError;

      // Calculate total points issued (from approved transactions)
      const { data: approvedTransactions, error: pointsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'approved')
        .eq('type', 'earned');

      if (pointsError) throw pointsError;

      const totalPointsIssued = approvedTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

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
        pendingApprovals: pendingApprovals?.length || 0,
        totalRewards: rewards?.length || 0,
        totalPoints: totalPointsIssued,
        totalRedemptions: 0,
        totalDealers: dealerCount,
        totalBuilders: builderCount,
        totalContractors: contractorCount
      });

      setRecentActivity(recentTransactions || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome to the Tapee Cement Loyalty Program admin panel</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          bgColor="bg-primary-500"
        />
        <DashboardCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={ClipboardCheck}
          bgColor="bg-warning-500"
        />
        <DashboardCard
          title="Total Rewards"
          value={stats.totalRewards}
          icon={Award}
          bgColor="bg-accent-500"
        />
        <DashboardCard
          title="Total Points Issued"
          value={stats.totalPoints}
          icon={ShoppingBag}
          bgColor="bg-success-500"
        />
      </div>
      
      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/admin/approvals"
          className="card p-6 hover:shadow-md transition-all flex items-center space-x-4"
        >
          <div className="bg-warning-100 text-warning-700 p-3 rounded-full">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Pending Approvals</h3>
            <p className="text-gray-600 text-sm">
              {stats.pendingApprovals} requests awaiting approval
            </p>
          </div>
        </Link>
        
        <Link
          to="/admin/users"
          className="card p-6 hover:shadow-md transition-all flex items-center space-x-4"
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
          className="card p-6 hover:shadow-md transition-all flex items-center space-x-4"
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
      
      {/* User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
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
                  style={{ width: `${(stats.totalDealers / stats.totalUsers) * 100}%` }}
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
                  style={{ width: `${(stats.totalBuilders / stats.totalUsers) * 100}%` }}
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
                  style={{ width: `${(stats.totalContractors / stats.totalUsers) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex">
                <div className="mr-4 flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <Calendar size={16} className="text-gray-500" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.type === 'earned' ? 'Points request: ' : 'Points redeemed: '}
                    {activity.amount} points by {activity.users?.first_name || 'Unknown'} {activity.users?.last_name || 'User'}
                    <span className="text-xs text-gray-500 ml-1">({activity.users?.user_code || 'N/A'})</span>
                  </p>
                  <div className="text-xs text-gray-500 flex items-center space-x-2">
                    <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={`px-1.5 py-0.5 rounded-full ${
                      activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                      activity.status === 'dealer_approved' ? 'bg-blue-100 text-blue-800' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
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