import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Search, Filter, Check, X, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function AdminApprovals() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('dealer_approved');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  async function fetchTransactions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          users!transactions_user_id_fkey (
            id,
            first_name,
            last_name,
            user_code,
            role,
            points
          ),
          dealers:users!transactions_dealer_id_fkey (
            first_name,
            last_name,
            user_code
          ),
          rewards (
            title,
            points_required
          )
        `)
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;
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
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!transaction) {
        toast.error('Transaction not found');
        return;
      }

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // For points earned, add points to user's account
      if (transaction.type === 'earned') {
        // First get current points
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('points')
          .eq('id', transaction.user_id)
          .maybeSingle();

        if (userError) throw userError;
        if (!userData) {
          toast.error('User not found. Points could not be updated.');
          return;
        }

        // Calculate new points total
        const newPoints = (userData.points || 0) + transaction.amount;

        // Update user points
        const { error: pointsError } = await supabase
          .from('users')
          .update({ 
            points: newPoints,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.user_id);

        if (pointsError) throw pointsError;
      }

      toast.success(
        transaction.type === 'earned' 
          ? 'Transaction approved and points added successfully'
          : 'Reward redemption approved successfully'
      );
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
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!transaction) {
        toast.error('Transaction not found');
        return;
      }

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // If rejecting a redemption, refund the points
      if (transaction.type === 'redeemed') {
        // First get current points
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('points')
          .eq('id', transaction.user_id)
          .maybeSingle();

        if (userError) throw userError;
        if (!userData) {
          toast.error('User not found. Points could not be refunded.');
          return;
        }

        // Calculate new points total
        const newPoints = (userData.points || 0) + transaction.amount;

        // Update user points
        const { error: refundError } = await supabase
          .from('users')
          .update({ 
            points: newPoints,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.user_id);

        if (refundError) throw refundError;
      }

      toast.success(
        transaction.type === 'redeemed'
          ? 'Redemption rejected and points refunded'
          : 'Transaction rejected'
      );
      fetchTransactions();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast.error('Failed to reject transaction');
    } finally {
      setProcessingId(null);
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const searchString = searchQuery.toLowerCase();
    return (
      (transaction as any).users?.first_name?.toLowerCase().includes(searchString) ||
      (transaction as any).users?.last_name?.toLowerCase().includes(searchString) ||
      (transaction as any).users?.user_code?.toLowerCase().includes(searchString) ||
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
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction Approvals</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search transactions..."
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
                <option value="dealer_approved">Points Pending Approval</option>
                <option value="pending">Redemptions Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium text-sm">
                            {(transaction as any).users?.first_name?.[0]}
                            {(transaction as any).users?.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {(transaction as any).users?.first_name} {(transaction as any).users?.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(transaction as any).users?.user_code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${transaction.type === 'earned' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {transaction.type === 'earned' ? 'Points Earned' : 'Reward Redemption'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.amount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {transaction.description}
                    {(transaction as any).rewards && (
                      <div className="text-xs text-gray-400 mt-1">
                        Reward: {(transaction as any).rewards.title}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.status === 'dealer_approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'}`}>
                      {transaction.status === 'dealer_approved' ? 'Pending Admin Approval' : transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {(transaction.status === 'dealer_approved' || transaction.status === 'pending') && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(transaction.id)}
                          disabled={processingId === transaction.id}
                          className="text-green-600 hover:text-green-900"
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
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
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