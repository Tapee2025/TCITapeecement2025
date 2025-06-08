import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Users, CheckCircle, Clock, XCircle } from 'lucide-react';

interface DealerStats {
  totalApprovals: number;
  pendingApprovals: number;
  approvedApprovals: number;
  rejectedApprovals: number;
  recentApprovals: any[];
}

export default function DealerDashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DealerStats>({
    totalApprovals: 0,
    pendingApprovals: 0,
    approvedApprovals: 0,
    rejectedApprovals: 0,
    recentApprovals: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'dealer' || user?.role === 'admin') {
      fetchDealerStats();
    }
  }, [user]);

  const fetchDealerStats = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('dealer_approvals')
        .select(`
          *,
          users!dealer_approvals_user_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      // If dealer, only show their approvals
      if (user.role === 'dealer') {
        query = query.eq('dealer_id', user.id);
      }

      const { data: approvals } = await query;

      if (approvals) {
        const pendingCount = approvals.filter(a => a.status === 'pending').length;
        const approvedCount = approvals.filter(a => a.status === 'approved').length;
        const rejectedCount = approvals.filter(a => a.status === 'rejected').length;
        const recentApprovals = approvals.slice(0, 5);

        setStats({
          totalApprovals: approvals.length,
          pendingApprovals: pendingCount,
          approvedApprovals: approvedCount,
          rejectedApprovals: rejectedCount,
          recentApprovals,
        });
      }
    } catch (error) {
      console.error('Error fetching dealer stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dealer Dashboard</h1>
        <p className="text-gray-600">
          Manage point approvals and track your dealer activities
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApprovals}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 rounded-lg">
              <Clock className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-success-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedApprovals}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-error-100 rounded-lg">
              <XCircle className="h-6 w-6 text-error-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejectedApprovals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Approvals */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Approval Requests</h2>
        {stats.recentApprovals.length > 0 ? (
          <div className="space-y-3">
            {stats.recentApprovals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {approval.users?.first_name} {approval.users?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{approval.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(approval.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-600">
                    {approval.amount} points
                  </p>
                  <p className={`text-xs px-2 py-1 rounded-full ${
                    approval.status === 'approved' ? 'bg-success-100 text-success-800' :
                    approval.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                    'bg-error-100 text-error-800'
                  }`}>
                    {approval.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No approval requests yet</p>
        )}
      </div>
    </div>
  );
}