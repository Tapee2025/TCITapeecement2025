import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Check, X, Filter, Search, Package, Building2, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function ApprovePoints() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedToday: 0,
    totalPoints: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  async function fetchTransactions() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get transactions with user details
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          users (
            id,
            first_name,
            last_name,
            user_code,
            role
          )
        `)
        .eq('dealer_id', user.id)
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: pendingCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', user.id)
        .eq('status', 'pending');

      const { count: approvedTodayCount } = await supabase
        .from('dealer_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', user.id)
        .eq('status', 'approved')
        .gte('created_at', today.toISOString());

      const { data: totalPointsData } = await supabase
        .from('dealer_approvals')
        .select('amount')
        .eq('dealer_id', user.id)
        .eq('status', 'approved');

      const totalPoints = totalPointsData?.reduce((sum, t) => sum + t.amount, 0) || 0;

      setStats({
        pendingCount: pendingCount || 0,
        approvedToday: approvedTodayCount || 0,
        totalPoints
      });

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(transactionId: string) {
    setProcessingId(transactionId);
    try {
      // Get the transaction details
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;
      if (!transaction) {
        toast.error('Transaction not found');
        return;
      }

      // Create dealer approval record
      const { error: approvalError } = await supabase
        .from('dealer_approvals')
        .insert({
          transaction_id: transaction.id,
          user_id: transaction.user_id,
          dealer_id: transaction.dealer_id,
          amount: transaction.amount,
          description: transaction.description,
          status: 'pending'
        });

      if (approvalError) throw approvalError;

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'dealer_approved' })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      toast.success('Transaction approved and sent to admin');
      fetchTransactions();
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
        .update({ status: 'rejected' })
        .eq('id', transactionId);

      if (error) throw error;
      toast.success('Transaction rejected');
      fetchTransactions();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast.error('Failed to reject transaction');
    } finally {
      setProcessingId(null);
    }
  }

  // Filter transactions based on search
  const filteredTransactions = transactions.filter(transaction => {
    const searchString = searchQuery.toLowerCase();
    const user = (transaction as any).users;
    return (
      user?.first_name?.toLowerCase().includes(searchString) ||
      user?.last_name?.toLowerCase().includes(searchString) ||
      user?.user_code?.toLowerCase().includes(searchString) ||
      transaction.description.toLowerCase().includes(searchString)
    );
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approve Points</h1>
        <p className="text-gray-600">Review and approve points requests from builders and contractors</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Approvals</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.pendingCount}</h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved Today</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.approvedToday}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Points Approved</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalPoints}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or user code..."
              className="form-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="pending">Pending Approval</option>
              <option value="dealer_approved">Sent to Admin</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  Bags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const user = (transaction as any).users;
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-medium text-sm">
                              {user?.first_name?.[0]}
                              {user?.last_name?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user?.first_name} {user?.last_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user?.user_code} • {user?.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.amount / 10} bags
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                      {transaction.amount} points
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${transaction.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          transaction.status === 'dealer_approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'}`}>
                        {transaction.status === 'dealer_approved' ? 'Sent to Admin' : transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {transaction.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(transaction.id)}
                            disabled={processingId === transaction.id}
                            className="text-green-600 hover:text-green-900"
                            title="Approve request"
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
                            className="text-red-600 hover:text-red-900"
                            title="Reject request"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Transactions Found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No transactions match your search for "${searchQuery}"`
                : `No ${statusFilter} transactions found`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}