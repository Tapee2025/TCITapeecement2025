import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { 
  Home, 
  Plus, 
  Gift, 
  History, 
  User, 
  LogOut,
  CheckCircle,
  BarChart3,
  Menu,
  X
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="mobile-header lg:hidden">
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="touch-target text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-2">
            <img 
              src="/logo.svg" 
              alt="Tapee Cement" 
              className="h-8 w-auto"
            />
            <h1 className="text-lg font-bold text-gray-900 truncate">
              Tapee Cement
            </h1>
          </div>
          
          <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium">
            {user?.points}
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
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
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors touch-target"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 lg:hidden"
            onClick={closeSidebar}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50" />
          </div>
        )}

        {/* Sidebar */}
        <nav className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:shadow-sm
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col h-full
        `}>
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 lg:hidden flex-shrink-0">
            <div className="flex items-center space-x-2">
              <img 
                src="/logo.svg" 
                alt="Tapee Cement" 
                className="h-8 w-auto"
              />
              <span className="font-bold text-gray-900">Menu</span>
            </div>
            <button
              onClick={closeSidebar}
              className="touch-target text-gray-600 hover:text-gray-900"
            >
              <X size={24} />
            </button>
          </div>

          {/* User info on mobile */}
          <div className="p-4 border-b border-gray-200 lg:hidden flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">Points Balance</span>
              <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm font-medium">
                {user?.points}
              </span>
            </div>
          </div>

          {/* Navigation items - Scrollable area */}
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={closeSidebar}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors touch-target ${
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

          {/* Sign out button on mobile */}
          <div className="p-4 border-t border-gray-200 lg:hidden flex-shrink-0">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 w-full px-3 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors touch-target"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="mobile-container mobile-section pb-20 lg:pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}