import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Check, X, Search, Package, Clock, CheckCircle, Users, ShoppingBag } from 'lucide-react';
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
    totalPoints: 0,
    totalBagsSold: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  async function fetchTransactions() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get transactions with user details - only customer transactions that need dealer approval
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
            district,
            points
          )
        `)
        .eq('dealer_id', user.id)
        .eq('type', 'earned') // Only earned points (customer requests)
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
        .eq('type', 'earned')
        .eq('status', 'pending');

      const { count: approvedTodayCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('dealer_id', user.id)
        .eq('type', 'earned')
        .eq('status', 'dealer_approved')
        .gte('created_at', today.toISOString());

      const { data: totalPointsData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('dealer_id', user.id)
        .eq('type', 'earned')
        .in('status', ['approved', 'dealer_approved']);

      const totalPoints = totalPointsData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const totalBagsSold = Math.floor(totalPoints / 10);

      setStats({
        pendingCount: pendingCount || 0,
        approvedToday: approvedTodayCount || 0,
        totalPoints,
        totalBagsSold
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
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) {
        toast.error('Transaction not found');
        return;
      }

      const user = (transaction as any).users;
      if (!user) {
        toast.error('User information not found');
        return;
      }

      // Update transaction status to dealer_approved (will be sent to admin for final approval)
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: 'dealer_approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      toast.success(`Approved ${transaction.amount} points for ${user.first_name} ${user.last_name}. Sent to admin for final approval.`);
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
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Approve Customer Points</h1>
        <p className="text-sm text-gray-600">Review and approve points requests from your customers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-center">
            <Clock className="w-6 h-6 text-warning-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{stats.pendingCount}</p>
            <p className="text-xs text-gray-500">Pending Approval</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-center">
            <CheckCircle className="w-6 h-6 text-success-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{stats.approvedToday}</p>
            <p className="text-xs text-gray-500">Approved Today</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or code..."
              className="form-input pl-10 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-input text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="pending">Pending Approval</option>
            <option value="dealer_approved">Sent to Admin</option>
            <option value="approved">Admin Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="divide-y">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => {
              const user = (transaction as any).users;
              if (!user) return null;

              return (
                <div key={transaction.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 font-medium text-sm">
                          {user.first_name?.[0] || 'U'}{user.last_name?.[0] || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.user_code} • {user.role}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div>
                            <span className="text-sm font-semibold text-primary-600">
                              {transaction.amount} points
                            </span>
                            {transaction.description.includes('OPC') && (
                              <span className="text-xs text-gray-500 ml-2">
                                ({transaction.amount / 5} OPC bags)
                              </span>
                            )}
                            {transaction.description.includes('PPC') && (
                              <span className="text-xs text-gray-500 ml-2">
                                ({transaction.amount / 10} PPC bags)
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{transaction.description}</p>
                        <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                          transaction.status === 'approved' ? 'bg-success-100 text-success-700' :
                          transaction.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                          transaction.status === 'dealer_approved' ? 'bg-blue-100 text-blue-700' :
                          'bg-error-100 text-error-700'
                        }`}>
                          {transaction.status === 'dealer_approved' ? 'Sent to Admin' : transaction.status}
                        </span>
                      </div>
                    </div>
                    
                    {transaction.status === 'pending' && (
                      <div className="flex space-x-2 ml-3">
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
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Customer Requests Found</h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? `No requests match your search for "${searchQuery}"`
                  : `No ${statusFilter} customer requests found`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}