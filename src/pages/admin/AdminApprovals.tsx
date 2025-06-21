import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Search, Check, X, AlertCircle, Filter, TrendingUp, Gift } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function AdminApprovals() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_points');
  const [typeFilter, setTypeFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pendingPoints: 0,
    pendingRedemptions: 0,
    dealerApproved: 0,
    totalPending: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, typeFilter]);

  async function fetchTransactions() {
    try {
      setLoading(true);
      
      let query = supabase
        .from('transactions')
        .select(`
          *,
          users:user_id (
            id,
            first_name,
            last_name,
            user_code,
            role,
            district,
            points
          ),
          dealers:dealer_id (
            id,
            first_name,
            last_name,
            user_code,
            district
          ),
          rewards:reward_id (
            id,
            title,
            points_required
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters based on selection
      if (statusFilter === 'pending_points') {
        query = query.eq('type', 'earned').in('status', ['pending', 'dealer_approved']);
      } else if (statusFilter === 'pending_redemptions') {
        query = query.eq('type', 'redeemed').eq('status', 'pending');
      } else if (statusFilter === 'dealer_approved') {
        query = query.eq('status', 'dealer_approved');
      } else if (statusFilter === 'approved') {
        query = query.eq('status', 'approved');
      } else if (statusFilter === 'rejected') {
        query = query.eq('status', 'rejected');
      } else {
        // All pending
        query = query.in('status', ['pending', 'dealer_approved']);
      }

      // Apply type filter if not 'all'
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setTransactions(data || []);

      // Calculate stats
      const { data: statsData, error: statsError } = await supabase
        .from('transactions')
        .select('type, status')
        .in('status', ['pending', 'dealer_approved']);

      if (statsError) throw statsError;

      const pendingPoints = statsData?.filter(t => t.type === 'earned' && (t.status === 'pending' || t.status === 'dealer_approved')).length || 0;
      const pendingRedemptions = statsData?.filter(t => t.type === 'redeemed' && t.status === 'pending').length || 0;
      const dealerApproved = statsData?.filter(t => t.status === 'dealer_approved').length || 0;

      setStats({
        pendingPoints,
        pendingRedemptions,
        dealerApproved,
        totalPending: pendingPoints + pendingRedemptions
      });

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
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) {
        toast.error('Transaction not found');
        return;
      }

      const user = (transaction as any).users;
      if (!user) {
        toast.error('User not found');
        return;
      }

      // Use the approve_transaction function for points earned
      if (transaction.type === 'earned') {
        const { error: transactionError } = await supabase.rpc(
          'approve_transaction',
          {
            p_transaction_id: transactionId,
            p_user_id: user.id,
            p_points: transaction.amount
          }
        );

        if (transactionError) throw transactionError;

        toast.success(
          `Approved ${transaction.amount} points for ${user.first_name} ${user.last_name}`
        );
      } else {
        // For redemptions, just update status
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('id', transactionId);

        if (updateError) throw updateError;

        toast.success('Reward redemption approved successfully');
      }

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
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) {
        toast.error('Transaction not found');
        return;
      }

      const user = (transaction as any).users;
      if (!user) {
        toast.error('User not found');
        return;
      }

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // If it's a redemption, refund the points
      if (transaction.type === 'redeemed') {
        const { error: refundError } = await supabase
          .from('users')
          .update({
            points: user.points + transaction.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (refundError) throw refundError;

        toast.success(
          `Rejected redemption and refunded ${transaction.amount} points to ${user.first_name} ${user.last_name}`
        );
      } else {
        toast.success('Points request rejected');
      }

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
        <h1 className="text-2xl font-bold text-gray-900">Transaction Approvals</h1>
        <p className="text-gray-600">Review and approve points requests and reward redemptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Points</p>
              <p className="text-2xl font-bold text-warning-600">{stats.pendingPoints}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-warning-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Redemptions</p>
              <p className="text-2xl font-bold text-accent-600">{stats.pendingRedemptions}</p>
            </div>
            <Gift className="w-8 h-8 text-accent-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Dealer Approved</p>
              <p className="text-2xl font-bold text-blue-600">{stats.dealerApproved}</p>
            </div>
            <Check className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPending}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="pending_points">Pending Points Requests</option>
              <option value="pending_redemptions">Pending Redemptions</option>
              <option value="dealer_approved">Dealer Approved</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Pending</option>
            </select>
          </div>

          <div>
            <select
              className="form-input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="earned">Points Earned</option>
              <option value="redeemed">Rewards Redeemed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const user = (transaction as any).users;
                const dealer = (transaction as any).dealers;
                const reward = (transaction as any).rewards;

                if (!user) return null;

                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium text-sm">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.user_code} • {user.role}
                          </div>
                          <div className="text-xs text-gray-400">
                            District: {user.district}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${transaction.type === 'earned' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {transaction.type === 'earned' ? 'Points Request' : 'Reward Redemption'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                      {transaction.type === 'earned' && (
                        <div className="text-xs text-gray-500">
                          ({transaction.amount / 10} bags)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.description}
                      {reward && (
                        <div className="text-xs text-gray-400 mt-1">
                          Reward: {reward.title}
                        </div>
                      )}
                      {dealer && (
                        <div className="text-xs text-gray-400 mt-1">
                          Dealer: {dealer.first_name} {dealer.last_name} ({dealer.user_code})
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            transaction.status === 'dealer_approved' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'}`}>
                        {transaction.status === 'dealer_approved' ? 'Pending Admin Approval' : transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {(transaction.status === 'dealer_approved' || transaction.status === 'pending') && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(transaction.id)}
                            disabled={processingId === transaction.id}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Approve"
                          >
                            {processingId === transaction.id ? <LoadingSpinner size="sm" /> : <Check size={18} />}
                          </button>
                          <button
                            onClick={() => handleReject(transaction.id)}
                            disabled={processingId === transaction.id}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Reject"
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
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Transactions Found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? `No transactions match your search for "${searchQuery}"`
                : `No ${statusFilter.replace('_', ' ')} transactions found`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}