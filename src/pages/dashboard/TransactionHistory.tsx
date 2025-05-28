import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Transaction } from '../../types';
import { Filter, ArrowDownUp, ArrowUp, ArrowDown, FileText, Download } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function TransactionHistory() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction | '';
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });
  
  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userData) return;
      
      try {
        setLoading(true);
        
        // In a real app, you would fetch from Firestore
        // Simulate server delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demonstration
        const transactionsData: Transaction[] = [
          {
            id: '1',
            userId: userData.uid,
            type: 'earned',
            amount: 500,
            description: 'Purchased 50 bags from ABC Distributor',
            status: 'approved',
            dealerId: 'dealer1',
            createdAt: new Date(2025, 4, 1).toISOString(),
            updatedAt: new Date(2025, 4, 1).toISOString()
          },
          {
            id: '2',
            userId: userData.uid,
            type: 'redeemed',
            amount: 1000,
            description: 'Redeemed for Cash Discount',
            status: 'completed',
            rewardId: '1',
            createdAt: new Date(2025, 3, 25).toISOString(),
            updatedAt: new Date(2025, 3, 25).toISOString()
          },
          {
            id: '3',
            userId: userData.uid,
            type: 'earned',
            amount: 300,
            description: 'Purchased 30 bags from XYZ Distributor',
            status: 'approved',
            dealerId: 'dealer2',
            createdAt: new Date(2025, 3, 15).toISOString(),
            updatedAt: new Date(2025, 3, 15).toISOString()
          },
          {
            id: '4',
            userId: userData.uid,
            type: 'earned',
            amount: 200,
            description: 'Purchased 20 bags from ABC Distributor',
            status: 'pending',
            dealerId: 'dealer1',
            createdAt: new Date(2025, 3, 10).toISOString(),
            updatedAt: new Date(2025, 3, 10).toISOString()
          },
          {
            id: '5',
            userId: userData.uid,
            type: 'redeemed',
            amount: 800,
            description: 'Redeemed for Premium Toolbox',
            status: 'completed',
            rewardId: '4',
            createdAt: new Date(2025, 2, 20).toISOString(),
            updatedAt: new Date(2025, 2, 20).toISOString()
          }
        ];
        
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [userData]);
  
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
      
      filtered = filtered.filter(transaction => new Date(transaction.createdAt) >= dateThreshold);
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
      new Date(transaction.createdAt).toLocaleDateString(),
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
                    onClick={() => handleSort('createdAt')}
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
                      {new Date(transaction.createdAt).toLocaleDateString()}
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
                          : 'badge-error'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
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