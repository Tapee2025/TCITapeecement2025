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
      
      // Get user counts by role
      const { data: userCounts, error: userError } = await supabase
        .from('users')
        .select('role', { count: 'exact' })
        .neq('role', 'admin')
        .eq('role', 'dealer');
      
      const { data: builderCount } = await supabase
        .from('users')
        .select('role', { count: 'exact' })
        .eq('role', 'builder');
        
      const { data: contractorCount } = await supabase
        .from('users')
        .select('role', { count: 'exact' })
        .eq('role', 'contractor');

      // Get pending approvals count
      const { count: pendingCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'dealer_approved');

      // Get total rewards count
      const { count: rewardsCount } = await supabase
        .from('rewards')
        .select('*', { count: 'exact', head: true })
        .eq('available', true);

      // Get total points issued
      const { data: pointsData } = await supabase
        .from('users')
        .select('points')
        .neq('role', 'admin');

      const totalPoints = pointsData?.reduce((sum, user) => sum + user.points, 0) || 0;

      // Get recent activity (transactions)
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select(`
          *,
          users!transactions_user_id_fkey (
            first_name,
            last_name,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: (userCounts?.length || 0) + (builderCount?.length || 0) + (contractorCount?.length || 0),
        pendingApprovals: pendingCount || 0,
        totalRewards: rewardsCount || 0,
        totalPoints: totalPoints,
        totalRedemptions: 0,
        totalDealers: userCounts?.length || 0,
        totalBuilders: builderCount?.length || 0,
        totalContractors: contractorCount?.length || 0
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
                    {activity.type === 'earned' ? 'Points earned: ' : 'Points redeemed: '}
                    {activity.amount} points by {activity.users.first_name} {activity.users.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
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