import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Search, Filter, Check, X, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { toast } from 'react-toastify';

type DealerApproval = Database['public']['Tables']['dealer_approvals']['Row'];

export default function AdminApprovals() {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<DealerApproval[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  async function fetchApprovals() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dealer_approvals')
        .select(`
          *,
          users!dealer_approvals_user_id_fkey (
            first_name,
            last_name,
            user_code,
            role
          ),
          dealers:users!dealer_approvals_dealer_id_fkey (
            first_name,
            last_name,
            user_code
          )
        `)
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApprovals(data || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(approvalId: string) {
    setProcessingId(approvalId);
    try {
      // Get the approval details
      const { data: approval, error: fetchError } = await supabase
        .from('dealer_approvals')
        .select('*')
        .eq('id', approvalId)
        .single();

      if (fetchError) throw fetchError;
      if (!approval) {
        toast.error('Approval not found');
        return;
      }

      // Update approval status
      const { error: updateError } = await supabase
        .from('dealer_approvals')
        .update({ status: 'approved' })
        .eq('id', approvalId);

      if (updateError) throw updateError;

      // Update transaction status
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ status: 'approved' })
        .eq('id', approval.transaction_id);

      if (transactionError) throw transactionError;

      // Add points to user
      const { error: pointsError } = await supabase.rpc('add_points', {
        p_user_id: approval.user_id,
        p_points: approval.amount
      });

      if (pointsError) throw pointsError;

      toast.success('Approval processed and points added');
      fetchApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(approvalId: string) {
    setProcessingId(approvalId);
    try {
      const { data: approval, error: fetchError } = await supabase
        .from('dealer_approvals')
        .select('transaction_id')
        .eq('id', approvalId)
        .single();

      if (fetchError) throw fetchError;

      // Update approval status
      const { error: updateError } = await supabase
        .from('dealer_approvals')
        .update({ status: 'rejected' })
        .eq('id', approvalId);

      if (updateError) throw updateError;

      // Update transaction status
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', approval.transaction_id);

      if (transactionError) throw transactionError;

      toast.success('Approval rejected');
      fetchApprovals();
    } catch (error) {
      console.error('Error rejecting approval:', error);
      toast.error('Failed to reject approval');
    } finally {
      setProcessingId(null);
    }
  }

  const filteredApprovals = approvals.filter(approval => {
    const searchString = searchQuery.toLowerCase();
    return (
      (approval as any).users?.first_name?.toLowerCase().includes(searchString) ||
      (approval as any).users?.last_name?.toLowerCase().includes(searchString) ||
      (approval as any).users?.user_code?.toLowerCase().includes(searchString) ||
      approval.description.toLowerCase().includes(searchString)
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dealer Approvals</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search approvals..."
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Approvals Table */}
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
                  Dealer
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
              {filteredApprovals.map((approval) => (
                <tr key={approval.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(approval.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium text-sm">
                            {(approval as any).users?.first_name?.[0]}
                            {(approval as any).users?.last_name?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {(approval as any).users?.first_name} {(approval as any).users?.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(approval as any).users?.user_code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(approval as any).dealers?.first_name} {(approval as any).dealers?.last_name}
                    <div className="text-xs text-gray-400">
                      {(approval as any).dealers?.user_code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {approval.amount}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {approval.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                        approval.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                      {approval.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {approval.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(approval.id)}
                          disabled={processingId === approval.id}
                          className="text-green-600 hover:text-green-900"
                        >
                          {processingId === approval.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Check size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(approval.id)}
                          disabled={processingId === approval.id}
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

        {filteredApprovals.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Approvals Found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No approvals match your search for "${searchQuery}"`
                : `No ${statusFilter} approvals found`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}