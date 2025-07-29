import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { ArrowUp, ArrowDown, FileText, Download, Filter, Calendar } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useCache } from '../../hooks/useCache';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function TransactionHistory() {
  const { currentUser } = useAuth();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Cache transactions for 1 minute
  const { data: transactions, loading, refetch } = useCache(
    async () => {
      if (!currentUser) throw new Error('User not authenticated');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
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
        .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);
      if (error) throw error;
      return data || [];
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    { 
      key: `transactions-${currentUser?.id}`, 
      ttl: 60 * 1000,
      enabled: !!currentUser
    }
  );

  // Memoize filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let filtered = [...transactions];
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }
    
    return filtered;
  }, [transactions, typeFilter, statusFilter]);
  
  // Generate CSV for export
  const handleExport = () => {
    if (!filteredTransactions.length) return;
    
    const headers = ['Date', 'Type', 'Description', 'Points', 'Status'];
    const rows = filteredTransactions.map(transaction => [
      new Date(transaction.created_at).toLocaleDateString(),
      transaction.type,
      transaction.description,
      transaction.amount.toString(),
      transaction.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transaction_history.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your transaction history</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-sm text-gray-600">
            {filteredTransactions.length} transactions found
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline btn-sm flex items-center"
          >
            <Filter size={16} className="mr-1" />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="btn btn-outline btn-sm flex items-center"
            disabled={filteredTransactions.length === 0}
          >
            <Download size={16} className="mr-1" />
            Export
          </button>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                id="typeFilter"
                className="form-input"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="earned">Points Earned</option>
                <option value="redeemed">Points Redeemed</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="statusFilter"
                className="form-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="dealer_approved">Dealer Approved</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Transactions List - Mobile Optimized */}
      <div className="bg-white rounded-lg shadow-sm border">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      transaction.type === 'earned' ? 'bg-success-100' : 'bg-accent-100'
                    }`}>
                      {transaction.type === 'earned' ? (
                        <ArrowUp className="w-5 h-5 text-success-600" />
                      ) : (
                        <ArrowDown className="w-5 h-5 text-accent-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.type === 'earned' ? 'Points Earned' : 'Points Redeemed'}
                        </p>
                        <span className={`text-sm font-semibold ${
                          transaction.type === 'earned' ? 'text-success-600' : 'text-accent-600'
                        }`}>
                          {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 break-words">
                        {transaction.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          transaction.status === 'approved' || transaction.status === 'completed'
                            ? 'bg-success-100 text-success-700'
                            : transaction.status === 'pending'
                            ? 'bg-warning-100 text-warning-700'
                            : transaction.status === 'dealer_approved'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-error-100 text-error-700'
                        }`}>
                          {transaction.status === 'dealer_approved' ? 'Pending Admin' : transaction.status}
                        </span>
                      </div>
                      
                      {/* Additional Info */}
                      {((transaction as any).rewards || (transaction as any).dealers) && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          {(transaction as any).rewards && (
                            <p className="text-xs text-gray-500">
                              Reward: {(transaction as any).rewards.title}
                            </p>
                          )}
                          {(transaction as any).dealers && (
                            <p className="text-xs text-gray-500">
                              Dealer: {(transaction as any).dealers.first_name} {(transaction as any).dealers.last_name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Transactions Found</h3>
            <p className="text-gray-600">
              {typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No transactions match your current filters'
                : 'You haven\'t made any transactions yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}