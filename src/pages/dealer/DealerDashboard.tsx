import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Database } from '../../lib/database.types';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, ArrowRight, Check, X, Users, Package, TrendingUp, Building2 } from 'lucide-react';
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
    totalCustomers: 0
  });
  const [processingId, setProcessingId] = useState<string | null>(null);

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

      setRecentTransactions(dealerTransactions || []);
      setStats({
        totalTransactions: totalCount || 0,
        pendingApprovals: pendingCount || 0,
        approvedToday: approvedTodayCount || 0,
        totalCustomers: uniqueCustomers
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
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
      
      {/* Stats Grid - 2x2 layout */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

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

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Customers</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
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

      {/* Dealer Info Card - Compact */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Building2 className="mr-2 text-primary-600" size={18} />
          Dealer Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">GST Number</p>
            <p className="font-medium">{dealerData?.gst_number || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-gray-500">District</p>
            <p className="font-medium">{dealerData?.district}</p>
          </div>
          <div>
            <p className="text-gray-500">Contact</p>
            <p className="font-medium">{dealerData?.mobile_number}</p>
          </div>
          <div>
            <p className="text-gray-500">City</p>
            <p className="font-medium">{dealerData?.city}</p>
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