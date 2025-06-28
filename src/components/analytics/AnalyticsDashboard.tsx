import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Package, Gift, Calendar, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AnalyticsData } from '../../types/notifications';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsDashboardProps {
  userRole?: 'admin' | 'dealer';
  dealerId?: string;
}

export default function AnalyticsDashboard({ userRole = 'admin', dealerId }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30_days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [period, dealerId]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      
      let startDate: Date;
      let endDate: Date = new Date();

      switch (period) {
        case '7_days':
          startDate = subDays(endDate, 7);
          break;
        case '30_days':
          startDate = subDays(endDate, 30);
          break;
        case '90_days':
          startDate = subDays(endDate, 90);
          break;
        case 'current_month':
          startDate = startOfMonth(endDate);
          endDate = endOfMonth(endDate);
          break;
        case 'custom':
          if (!customStartDate || !customEndDate) return;
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          break;
        default:
          startDate = subDays(endDate, 30);
      }

      // Fetch analytics data
      const { data, error } = await supabase.rpc('get_analytics_data', {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
        p_dealer_id: dealerId || null
      });

      if (error) throw error;
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const exportData = () => {
    if (!analyticsData) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Users', analyticsData.total_users],
      ['Active Users', analyticsData.active_users],
      ['New Registrations', analyticsData.new_registrations],
      ['Total Transactions', analyticsData.total_transactions],
      ['Total Points Issued', analyticsData.total_points_issued],
      ['Total Bags Sold', analyticsData.total_bags_sold],
      ['Total Rewards Redeemed', analyticsData.total_rewards_redeemed],
      ['User Engagement Rate', `${analyticsData.user_engagement_rate}%`]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${period}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            {userRole === 'dealer' ? 'Your performance metrics' : 'System-wide analytics and insights'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="form-input"
          >
            <option value="7_days">Last 7 Days</option>
            <option value="30_days">Last 30 Days</option>
            <option value="90_days">Last 90 Days</option>
            <option value="current_month">Current Month</option>
            <option value="custom">Custom Range</option>
          </select>
          <button
            onClick={exportData}
            className="btn btn-outline flex items-center"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      {period === 'custom' && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="form-input"
            />
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={!customStartDate || !customEndDate}
            className="btn btn-primary mt-6"
          >
            Apply
          </button>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.total_users}</p>
              <p className="text-sm text-green-600">
                +{analyticsData.new_registrations} new
              </p>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.active_users}</p>
              <p className="text-sm text-blue-600">
                {analyticsData.user_engagement_rate}% engagement
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bags Sold</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.total_bags_sold}</p>
              <p className="text-sm text-green-600">
                {analyticsData.total_points_issued} points issued
              </p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rewards Redeemed</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.total_rewards_redeemed}</p>
              <p className="text-sm text-purple-600">
                {analyticsData.total_transactions} transactions
              </p>
            </div>
            <Gift className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Top Performers */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Dealers</h3>
            <div className="space-y-3">
              {analyticsData.top_performing_dealers.map((dealer, index) => (
                <div key={dealer.dealer_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{dealer.name}</p>
                      <p className="text-sm text-gray-500">{dealer.bags_sold} bags sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">{dealer.points_issued}</p>
                    <p className="text-xs text-gray-500">points issued</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Rewards</h3>
            <div className="space-y-3">
              {analyticsData.popular_rewards.map((reward, index) => (
                <div key={reward.reward_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center">
                      <span className="text-accent-700 font-semibold text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{reward.title}</p>
                      <p className="text-sm text-gray-500">Reward</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-accent-600">{reward.redemption_count}</p>
                    <p className="text-xs text-gray-500">redemptions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{analyticsData.total_bags_sold}</p>
            <p className="text-sm text-gray-500">Total Bags Sold</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{analyticsData.total_points_issued}</p>
            <p className="text-sm text-gray-500">Total Points Issued</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{analyticsData.user_engagement_rate}%</p>
            <p className="text-sm text-gray-500">User Engagement Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}