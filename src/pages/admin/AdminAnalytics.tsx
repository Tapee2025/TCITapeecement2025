import { useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, Users, Package, Gift } from 'lucide-react';
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

      <AnalyticsDashboard userRole="admin" />
    </div>
  );
}