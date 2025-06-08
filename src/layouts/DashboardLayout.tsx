import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Home, 
  Plus, 
  Gift, 
  History, 
  User, 
  LogOut,
  CheckCircle,
  BarChart3
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isDealerOrAdmin = user?.role === 'dealer' || user?.role === 'admin';

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/get-points', icon: Plus, label: 'Get Points' },
    { path: '/rewards', icon: Gift, label: 'Rewards' },
    { path: '/transactions', icon: History, label: 'History' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  if (isDealerOrAdmin) {
    navItems.splice(1, 0, 
      { path: '/dealer-dashboard', icon: BarChart3, label: 'Dealer Dashboard' },
      { path: '/approve-points', icon: CheckCircle, label: 'Approve Points' }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/logo.svg" 
                alt="Tapee Cement" 
                className="h-8 w-auto"
              />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                Tapee Cement Loyalty
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.first_name}
              </div>
              <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                {user?.points} Points
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}