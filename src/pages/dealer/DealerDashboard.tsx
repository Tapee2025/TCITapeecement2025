import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import DashboardCard from '../../components/ui/DashboardCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Database } from '../../lib/database.types';
import { LayoutGrid, Clock, CheckCircle } from 'lucide-react';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function DealerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      const { data: dealerTransactions, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('dealer_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionError) throw transactionError;

      const { count: pendingCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'pending');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: approvedTodayCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'approved')
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
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dealer Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {transaction.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.amount} points
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${transaction.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          transaction.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}