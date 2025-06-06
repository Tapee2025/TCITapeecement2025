import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LogOut, 
  Bell, 
  ChevronDown,
  LayoutDashboard,
  PlusCircle,
  Gift,
  Award,
  History,
  User,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DEALER_NAVIGATION, USER_NAVIGATION } from '../../utils/constants';
import { toast } from 'react-toastify';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getProfilePictureUrl } from '../../lib/supabase';

export default function DashboardLayout() {
  const { currentUser, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const navigate = useNavigate();
  
  // Get the appropriate navigation based on user role
  const navigation = currentUser?.role === 'dealer' ? DEALER_NAVIGATION : USER_NAVIGATION;
  
  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const sidebar = document.getElementById('mobile-sidebar');
      if (sidebar && !sidebar.contains(event.target as Node) && sidebarOpen) {
        setSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);
  
  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
      toast.error('Failed to log out');
    }
  }
  
  // Function to render the appropriate icon
  const renderIcon = (iconName: string) => {
    const props = { size: 20 };
    switch (iconName) {
      case 'LayoutDashboard': return <LayoutDashboard {...props} />;
      case 'PlusCircle': return <PlusCircle {...props} />;
      case 'Gift': return <Gift {...props} />;
      case 'Award': return <Award {...props} />;
      case 'History': return <History {...props} />;
      case 'User': return <User {...props} />;
      case 'CheckCircle': return <CheckCircle {...props} />;
      default: return <LayoutDashboard {...props} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[100vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-[100vh]">
        <div className="text-center">
          <p className="text-gray-600">Please log in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] h-[100vh] flex bg-gray-50 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside
        id="mobile-sidebar"
        className={`fixed lg:static top-0 left-0 z-30 w-64 h-full bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="Tapee Cement" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="font-bold text-lg text-gray-900">Tapee Cement</h1>
                <p className="text-xs text-gray-500">Loyalty Rewards</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-900"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* User info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              {currentUser.profile_picture_url ? (
                <img
                  src={getProfilePictureUrl(currentUser.profile_picture_url)}
                  alt={currentUser.first_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {currentUser.first_name?.[0]}{currentUser.last_name?.[0]}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{currentUser.first_name} {currentUser.last_name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                {renderIcon(item.icon)}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
          
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="nav-link text-gray-700 hover:bg-gray-100 w-full"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 flex justify-between items-center px-4 py-2 sm:px-6 safe-top">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 relative"
              >
                <Bell size={20} />
              </button>
              
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No notifications
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900"
              >
                <span className="hidden sm:inline-block font-medium">
                  {currentUser.first_name} {currentUser.last_name}
                </span>
                <ChevronDown size={16} />
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  <NavLink
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Your Profile
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 safe-bottom">
          <Outlet />
        </main>
      </div>
    </div>
  );
}