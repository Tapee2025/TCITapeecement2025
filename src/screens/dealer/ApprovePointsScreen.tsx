import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';

interface ApprovalRequest {
  id: string;
  transaction_id: string | null;
  user_id: string | null;
  dealer_id: string | null;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  users: {
    first_name: string;
    last_name: string;
    user_code: string;
    points: number;
  } | null;
}

export default function ApprovePointsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    if (user?.role === 'dealer' || user?.role === 'admin') {
      fetchApprovalRequests();
    }
  }, [user]);

  const fetchApprovalRequests = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('dealer_approvals')
        .select(`
          *,
          users!dealer_approvals_user_id_fkey(first_name, last_name, user_code, points)
        `)
        .order('created_at', { ascending: false });

      // If dealer, only show their requests
      if (user.role === 'dealer') {
        query = query.eq('dealer_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching approval requests:', error);
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    setProcessing(requestId);

    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Update approval status
      const { error: approvalError } = await supabase
        .from('dealer_approvals')
        .update({ status })
        .eq('id', requestId);

      if (approvalError) {
        console.error('Error updating approval:', approvalError);
        return;
      }

      if (status === 'approved' && request.user_id) {
        // Update user points
        const { error: pointsError } = await supabase
          .from('users')
          .update({ 
            points: (request.users?.points || 0) + request.amount 
          })
          .eq('id', request.user_id);

        if (pointsError) {
          console.error('Error updating user points:', pointsError);
          return;
        }

        // Update transaction status if exists
        if (request.transaction_id) {
          const { error: transactionError } = await supabase
            .from('transactions')
            .update({ status: 'approved' })
            .eq('id', request.transaction_id);

          if (transactionError) {
            console.error('Error updating transaction:', transactionError);
          }
        }
      } else if (status === 'rejected' && request.transaction_id) {
        // Update transaction status to rejected
        const { error: transactionError } = await supabase
          .from('transactions')
          .update({ status: 'rejected' })
          .eq('id', request.transaction_id);

        if (transactionError) {
          console.error('Error updating transaction:', transactionError);
        }
      }

      // Refresh the list
      await fetchApprovalRequests();
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setProcessing(null);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  if (user?.role !== 'dealer' && user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Access denied. This page is for dealers only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Approve Points</h1>
        <p className="text-gray-600">
          Review and approve point requests from customers
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
            { key: 'approved', label: 'Approved', count: requests.filter(r => r.status === 'approved').length },
            { key: 'rejected', label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length },
            { key: 'all', label: 'All', count: requests.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <div key={request.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {request.users?.first_name} {request.users?.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Code: {request.users?.user_code}
                    </p>
                    <p className="text-sm text-gray-600">
                      Current Points: {request.users?.points}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600">
                    +{request.amount} points
                  </p>
                  <p className={`text-xs px-2 py-1 rounded-full ${
                    request.status === 'approved' ? 'bg-success-100 text-success-800' :
                    request.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                    'bg-error-100 text-error-800'
                  }`}>
                    {request.status}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-gray-700 font-medium">Description:</p>
                <p className="text-gray-600">{request.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Requested on {new Date(request.created_at).toLocaleDateString()} at{' '}
                  {new Date(request.created_at).toLocaleTimeString()}
                </p>
              </div>

              {request.status === 'pending' && (
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => handleApproval(request.id, 'approved')}
                    disabled={processing === request.id}
                    className="flex items-center space-x-2 bg-success-600 text-white px-4 py-2 rounded-lg hover:bg-success-700 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    <span>{processing === request.id ? 'Processing...' : 'Approve'}</span>
                  </button>
                  
                  <button
                    onClick={() => handleApproval(request.id, 'rejected')}
                    disabled={processing === request.id}
                    className="flex items-center space-x-2 bg-error-600 text-white px-4 py-2 rounded-lg hover:bg-error-700 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    <span>{processing === request.id ? 'Processing...' : 'Reject'}</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {filter === 'all' ? '' : filter} requests found
            </h3>
            <p className="text-gray-600">
              {filter === 'pending' 
                ? "There are no pending approval requests at the moment."
                : `No ${filter} requests to display.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}