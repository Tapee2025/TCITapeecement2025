import type { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: typeof LucideIcon;
  bgColor?: string;
  changeValue?: string | number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  description?: string;
}

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  bgColor = 'bg-blue-500',
  changeValue,
  changeType = 'neutral',
  description
}: DashboardCardProps) {
  const changeColor = 
    changeType === 'increase' ? 'text-success-600' : 
    changeType === 'decrease' ? 'text-error-600' : 
    'text-gray-600';

  const changeArrow = 
    changeType === 'increase' ? '↑' : 
    changeType === 'decrease' ? '↓' : 
    '';

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col transition-all duration-300 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          
          {changeValue && (
            <div className={`flex items-center text-xs mt-2 ${changeColor}`}>
              {changeArrow} {changeValue}
            </div>
          )}
          
          {description && (
            <p className="text-gray-500 text-xs mt-1">{description}</p>
          )}
        </div>
        
        <div className={`${bgColor} text-white p-3 rounded-full`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}