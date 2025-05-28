import { useState, useEffect } from 'react';
import { Users, ShoppingBag, Award, ClipboardCheck, Calendar } from 'lucide-react';
import DashboardCard from '../../components/ui/DashboardCard';
import { STATS_CARDS } from '../../utils/constants';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';

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
  
  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // In a real app, you would fetch from Firestore
        // Simulate server delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demonstration
        setStats({
          totalUsers: 156,
          pendingApprovals: 12,
          totalRewards: 8,
          totalPoints: 54750,
          totalRedemptions: 28,
          totalDealers: 25,
          totalBuilders: 47,
          totalContractors: 84
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
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
          <div className="h-64 flex items-center justify-center">
            {/* In a real app, you would use a chart library like Chart.js */}
            <div className="w-full max-w-md">
              <div className="mb-4">
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
              
              <div className="mb-4">
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
              
              <div className="mb-4">
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
        </div>
        
        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { date: '2025-05-01', event: 'New user registered: Rajesh Patel (Builder)' },
              { date: '2025-04-30', event: 'Points request approved: 500 points to Amit Shah' },
              { date: '2025-04-29', event: 'Reward redemption: Cash Discount (1000 points)' },
              { date: '2025-04-28', event: 'New reward added: Premium Toolbox' },
              { date: '2025-04-27', event: 'Points request rejected: Invalid purchase claim' }
            ].map((activity, index) => (
              <div key={index} className="flex">
                <div className="mr-4 flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <Calendar size={16} className="text-gray-500" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.event}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}