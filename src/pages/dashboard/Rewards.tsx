import React from 'react';
import DashboardCard from '../../components/ui/DashboardCard';
import { Gift, CreditCard, Tool } from 'lucide-react';

const Rewards = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Rewards</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Gift Card"
          description="Redeem your points for a $50 gift card"
          value="5,000 points"
          icon={Gift}
        />
        <DashboardCard
          title="Store Credit"
          description="Get store credit for your next purchase"
          value="10,000 points"
          icon={CreditCard}
        />
        <DashboardCard
          title="Premium Tools"
          description="Choose from our selection of premium tools"
          value="15,000 points"
          icon={Tool}
        />
      </div>
    </div>
  );
};

export default Rewards;