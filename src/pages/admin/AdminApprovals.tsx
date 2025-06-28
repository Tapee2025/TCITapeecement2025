import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Search, Check, X, AlertCircle, Filter, TrendingUp, Gift, Undo2, Eye, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';
import { calculateBagsFromTransaction, getCementTypeFromDescription } from '../../utils/helpers';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function AdminApprovals() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_points');
  const [typeFilter, setTypeFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [stats, setStats] = useState({
    pendingPoints: 0,
    pendingRedemptions: 0,
    dealerApproved: 0,
    totalPending: 0,
    cancelledToday: 0
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
          ),
          cancelled_by_user:cancelled_by (
            id,
            first_name,
            last_name
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
      } else if (statusFilter === 'cancelled') {
        query = query.eq('status', 'cancelled');
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

      // Calculate stats - get all pending transactions for stats
      const { data: statsData, error: statsError } = await supabase
        .from('transactions')
        .select('type, status, cancelled_at')
        .in('status', ['pending', 'dealer_approved', 'cancelled']);

      if (statsError) throw statsError;

      const pendingPoints = statsData?.filter(t => t.type === 'earned' && (t.status === 'pending' || t.status === 'dealer_approved')).length || 0;
      const pendingRedemptions = statsData?.filter(t => t.type === 'redeemed' && t.status === 'pending').length || 0;
      const dealerApproved = statsData?.filter(t => t.status === 'dealer_approved').length || 0;

      // Count cancelled transactions today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cancelledToday = statsData?.filter(t => 
        t.status === 'cancelled' && 
        t.cancelled_at && 
        new Date(t.cancelled_at) >= today
      ).length || 0;

      setStats({
        pendingPoints,
        pendingRedemptions,
        dealerApproved,
        totalPending: pendingPoints + pendingRedemptions,
        cancelledToday
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

  async function handleCancelTransaction() {
    if (!selectedTransaction || !cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setProcessingId(selectedTransaction.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('cancel_transaction', {
        p_transaction_id: selectedTransaction.id,
        p_admin_id: user.id,
        p_reason: cancellationReason.trim()
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Transaction cancelled successfully. ${data.user_name} now has ${data.user_points_after} points.`);
        setShowCancelModal(false);
        setSelectedTransaction(null);
        setCancellationReason('');
        setTransactionDetails(null);
        fetchTransactions();
      } else {
        toast.error(data.error || 'Failed to cancel transaction');
      }
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      toast.error('Failed to cancel transaction');
    } finally {
      setProcessingId(null);
    }
  }

  async function openCancelModal(transaction: Transaction) {
    setSelectedTransaction(transaction);
    setCancellationReason('');
    
    try {
      const { data, error } = await supabase.rpc('get_transaction_details', {
        p_transaction_id: transaction.id
      });

      if (error) throw error;
      setTransactionDetails(data);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast.error('Failed to load transaction details');
    }
    
    setShowCancelModal(true);
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cancelled Today</p>
              <p className="text-2xl font-bold text-error-600">{stats.cancelledToday}</p>
            </div>
            <Undo2 className="w-8 h-8 text-error-500" />
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
              <option value="cancelled">Cancelled</option>
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
                const cancelledBy = (transaction as any).cancelled_by_user;

                if (!user) return null;

                // Determine cement type and bags count
                const cementType = getCementTypeFromDescription(transaction.description);
                const bagsCount = calculateBagsFromTransaction(transaction.description, transaction.amount);

                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                      {transaction.cancelled_at && (
                        <div className="text-xs text-error-600 mt-1">
                          Cancelled: {new Date(transaction.cancelled_at).toLocaleDateString()}
                        </div>
                      )}
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
                      {transaction.type === 'earned' && cementType === 'OPC' && (
                        <div className="text-xs text-gray-500">
                          ({bagsCount} OPC bags)
                        </div>
                      )}
                      {transaction.type === 'earned' && cementType === 'PPC' && (
                        <div className="text-xs text-gray-500">
                          ({bagsCount} PPC bags)
                        </div>
                      )}
                      {transaction.type === 'earned' && cementType === 'Unknown' && (
                        <div className="text-xs text-gray-500">
                          ({bagsCount} bags)
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
                      {transaction.status === 'cancelled' && transaction.cancellation_reason && (
                        <div className="text-xs text-error-600 mt-1">
                          Reason: {transaction.cancellation_reason}
                        </div>
                      )}
                      {cancelledBy && (
                        <div className="text-xs text-error-500 mt-1">
                          Cancelled by: {cancelledBy.first_name} {cancelledBy.last_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            transaction.status === 'dealer_approved' ? 'bg-blue-100 text-blue-800' :
                              transaction.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-red-100 text-red-800'}`}>
                        {transaction.status === 'dealer_approved' ? 'Pending Admin Approval' : 
                         transaction.status === 'cancelled' ? 'Cancelled' : transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        {(transaction.status === 'dealer_approved' || transaction.status === 'pending') && (
                          <>
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
                          </>
                        )}
                        
                        {(transaction.status === 'approved' || transaction.status === 'dealer_approved') && (
                          <button
                            onClick={() => openCancelModal(transaction)}
                            disabled={processingId === transaction.id}
                            className="text-orange-600 hover:text-orange-900 p-1 rounded"
                            title="Cancel Transaction"
                          >
                            <Undo2 size={18} />
                          </button>
                        )}

                        {transaction.status === 'cancelled' && (
                          <button
                            onClick={() => openCancelModal(transaction)}
                            disabled={processingId === transaction.id}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded"
                            title="View Cancellation Details"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                      </div>
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

      {/* Cancel Transaction Modal */}
      {showCancelModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedTransaction.status === 'cancelled' ? 'Cancellation Details' : 'Cancel Transaction'}
                </h2>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedTransaction(null);
                    setTransactionDetails(null);
                    setCancellationReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {transactionDetails && (
                <div className="space-y-4 mb-6">
                  {/* Transaction Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Transaction Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 font-medium capitalize">{transactionDetails.transaction.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="ml-2 font-medium">{transactionDetails.transaction.amount} points</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className="ml-2 font-medium capitalize">{transactionDetails.transaction.status}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(transactionDetails.transaction.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500">Description:</span>
                      <p className="mt-1 text-sm">{transactionDetails.transaction.description}</p>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">User Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 font-medium">{transactionDetails.user.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">User Code:</span>
                        <span className="ml-2 font-medium">{transactionDetails.user.user_code}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2 font-medium">{transactionDetails.user.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Current Points:</span>
                        <span className="ml-2 font-medium">{transactionDetails.user.current_points}</span>
                      </div>
                    </div>
                  </div>

                  {/* Impact Preview */}
                  {selectedTransaction.status !== 'cancelled' && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h3 className="font-medium text-gray-900 mb-2">Cancellation Impact</h3>
                      <div className="text-sm">
                        {selectedTransaction.type === 'earned' ? (
                          <p>
                            <strong>{selectedTransaction.amount} points</strong> will be <strong>removed</strong> from {transactionDetails.user.name}'s account.
                            <br />
                            New balance: <strong>{Math.max(0, transactionDetails.user.current_points - selectedTransaction.amount)} points</strong>
                          </p>
                        ) : (
                          <p>
                            <strong>{selectedTransaction.amount} points</strong> will be <strong>refunded</strong> to {transactionDetails.user.name}'s account.
                            <br />
                            New balance: <strong>{transactionDetails.user.current_points + selectedTransaction.amount} points</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cancellation Details (if already cancelled) */}
                  {transactionDetails.cancellation && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h3 className="font-medium text-gray-900 mb-2">Cancellation Information</h3>
                      <div className="text-sm">
                        <p><strong>Cancelled on:</strong> {new Date(transactionDetails.cancellation.cancelled_at).toLocaleString()}</p>
                        <p><strong>Reason:</strong> {transactionDetails.cancellation.reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedTransaction.status !== 'cancelled' && (
                <>
                  <div className="mb-4">
                    <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 mb-2">
                      Cancellation Reason *
                    </label>
                    <textarea
                      id="cancellationReason"
                      rows={3}
                      className="form-input"
                      placeholder="Please provide a reason for cancelling this transaction..."
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowCancelModal(false);
                        setSelectedTransaction(null);
                        setTransactionDetails(null);
                        setCancellationReason('');
                      }}
                      className="btn btn-outline"
                      disabled={processingId === selectedTransaction.id}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCancelTransaction}
                      disabled={processingId === selectedTransaction.id || !cancellationReason.trim()}
                      className="btn bg-red-600 text-white hover:bg-red-700"
                    >
                      {processingId === selectedTransaction.id ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} className="mr-2" />
                          Cancel Transaction
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}