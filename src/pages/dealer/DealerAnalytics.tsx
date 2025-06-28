import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';

export default function DealerAnalytics() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
        <p className="text-gray-600">Track your sales performance and customer engagement</p>
      </div>

      {currentUser && (
        <AnalyticsDashboard userRole="dealer" dealerId={currentUser.id} />
      )}
    </div>
  );
}