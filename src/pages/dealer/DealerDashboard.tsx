import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import DashboardCard from '../../components/ui/DashboardCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Database } from '../../lib/database.types';
import { Link } from 'react-router-dom';
import { LayoutGrid, Clock, CheckCircle, ArrowRight } from 'lucide-react';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export default function DealerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dealerData, setDealerData] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    pendingApprovals: 0,
    approvedToday: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

      // Get recent transactions
      const { data: dealerTransactions, error: transactionError } = await supabase
        .from('transactions')
        .select('*, users!transactions_user_id_fkey(*)')
        .eq('dealer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionError) throw transactionError;

      // Get pending approvals count
      const { count: pendingCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', user.id)
        .eq('status', 'pending');

      // Get today's approved count
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: approvedTodayCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', user.id)
        .eq('status', 'dealer_approved')
        .gte('created_at', today.toISOString());

      setTransactions(dealerTransactions || []);
      setStats({
        totalTransactions: dealerTransactions?.length || 0,
        pendingApprovals: pendingCount || 0,
        approvedToday: approvedTodayCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dealer Dashboard</h1>
        <p className="text-gray-600">Welcome back, {dealerData?.first_name}</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="Total Transactions"
          value={stats.totalTransactions.toString()}
          description="All time transactions"
          icon={LayoutGrid}
          bgColor="bg-blue-500"
        />
        <DashboardCard
          title="Pending Approvals"
          value={stats.pendingApprovals.toString()}
          description="Transactions waiting for approval"
          icon={Clock}
          bgColor="bg-yellow-500"
        />
        <DashboardCard
          title="Approved Today"
          value={stats.approvedToday.toString()}
          description="Transactions approved today"
          icon={CheckCircle}
          bgColor="bg-green-500"
        />
      </div>

      {/* Dealer Info Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Dealer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Dealer Code</label>
              <p className="font-medium">{dealerData?.user_code}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">GST Number</label>
              <p className="font-medium">{dealerData?.gst_number || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Contact</label>
              <p className="font-medium">{dealerData?.mobile_number}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">District</label>
              <p className="font-medium">{dealerData?.district}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Address</label>
              <p className="font-medium">{dealerData?.address}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">City</label>
              <p className="font-medium">{dealerData?.city}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Link to="/dealer/approvals" className="text-primary-600 hover:text-primary-700 flex items-center">
            View all <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-medium text-sm">
                              {(transaction as any).users?.first_name?.[0]}
                              {(transaction as any).users?.last_name?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {(transaction as any).users?.first_name} {(transaction as any).users?.last_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(transaction as any).users?.user_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.amount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${transaction.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          transaction.status === 'dealer_approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'}`}>
                        {transaction.status === 'dealer_approved' ? 'Approved' : transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}