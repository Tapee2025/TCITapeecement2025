import { useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, Users, Package, Gift, Info } from 'lucide-react';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600">Comprehensive analytics and business intelligence</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Info className="w-5 h-5 text-blue-600 mr-2" />
          <p className="text-sm text-blue-700">
            <strong>Analytics Include:</strong> Comprehensive sales data with separate tracking for dealers and sub dealers, plus combined totals for complete business insights.
          </p>
        </div>
      </div>

      <AnalyticsDashboard userRole="admin" />
    </div>
  );
}