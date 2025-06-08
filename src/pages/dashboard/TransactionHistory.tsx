import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Filter, ArrowDownUp, ArrowUp, ArrowDown, FileText, Download } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export default function TransactionHistory() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction | '';
    direction: 'asc' | 'desc';
  }>({ key: 'created_at', direction: 'desc' });
  
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  async function fetchTransactions() {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch transactions with related data
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTransactions(data || []);
      setFilteredTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  }
  
  // Apply filters and sorting
  useEffect(() => {
    if (!transactions.length) return;
    
    let filtered = [...transactions];
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter);
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let dateThreshold = new Date();
      
      switch (dateFilter) {
        case 'last7days':
          dateThreshold.setDate(now.getDate() - 7);
          break;
        case 'last30days':
          dateThreshold.setDate(now.getDate() - 30);
          break;
        case 'last90days':
          dateThreshold.setDate(now.getDate() - 90);
          break;
      }
      
      filtered = filtered.filter(transaction => new Date(transaction.created_at) >= dateThreshold);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, typeFilter, dateFilter, sortConfig]);
  
  // Handle sorting
  const handleSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };
  
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
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Transaction History</h1>
          <p className="text-gray-600">
            View all your points earned and redeemed
          </p>
        </div>
        
        <button
          onClick={handleExport}
          className="btn btn-outline mt-4 md:mt-0 flex items-center"
          disabled={filteredTransactions.length === 0}
        >
          <Download size={16} className="mr-2" />
          Export CSV
        </button>
      </div>
      
      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="typeFilter" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <Filter size={16} className="mr-1" />
              Transaction Type
            </label>
            <select
              id="typeFilter"
              className="form-input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Transactions</option>
              <option value="earned">Points Earned</option>
              <option value="redeemed">Points Redeemed</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateFilter" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <FileText size={16} className="mr-1" />
              Date Range
            </label>
            <select
              id="dateFilter"
              className="form-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Transactions Table */}
      <div className="card overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th 
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      <span>Date</span>
                      <ArrowDownUp size={14} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center">
                      <span>Type</span>
                      <ArrowDownUp size={14} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th 
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      <span>Points</span>
                      <ArrowDownUp size={14} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      <span>Status</span>
                      <ArrowDownUp size={14} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className={`badge ${
                          transaction.type === 'earned' ? 'badge-success' : 'badge-accent'
                        }`}>
                          {transaction.type === 'earned' ? (
                            <ArrowUp size={12} className="mr-1" />
                          ) : (
                            <ArrowDown size={12} className="mr-1" />
                          )}
                          {transaction.type === 'earned' ? 'Earned' : 'Redeemed'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {transaction.description}
                      {(transaction as any).rewards && (
                        <div className="text-xs text-gray-400 mt-1">
                          Reward: {(transaction as any).rewards.title}
                        </div>
                      )}
                      {(transaction as any).dealers && (
                        <div className="text-xs text-gray-400 mt-1">
                          Dealer: {(transaction as any).dealers.first_name} {(transaction as any).dealers.last_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`${
                        transaction.type === 'earned' ? 'text-success-600' : 'text-accent-600'
                      }`}>
                        {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`badge ${
                        transaction.status === 'approved' || transaction.status === 'completed'
                          ? 'badge-success'
                          : transaction.status === 'pending'
                          ? 'badge-warning'
                          : transaction.status === 'dealer_approved'
                          ? 'badge-primary'
                          : 'badge-error'
                      }`}>
                        {transaction.status === 'dealer_approved' ? 'Pending Admin' : transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Transactions Found</h3>
            <p className="text-gray-600">
              {typeFilter !== 'all' 
                ? `No ${typeFilter} transactions found`
                : 'No transactions match your filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}