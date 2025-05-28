import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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

export default function DashboardLayout() {
  const { userData, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the appropriate navigation based on user role
  const navigation = userData?.role === 'dealer' ? DEALER_NAVIGATION : USER_NAVIGATION;
  
  // Mock function to fetch notifications
  useEffect(() => {
    // In a real app, you would fetch notifications from your backend
    setNotifications([
      { id: 1, message: 'Your points request has been approved', read: false, time: '2 hours ago' },
      { id: 2, message: 'New reward added: Premium Toolbox', read: true, time: '1 day ago' }
    ]);
  }, []);
  
  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 w-64 h-full bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
              {userData?.firstName.charAt(0)}{userData?.lastName.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{userData?.firstName} {userData?.lastName}</p>
              <p className="text-xs text-gray-500 capitalize">{userData?.role}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between bg-primary-50 rounded-md p-2">
            <span className="text-xs text-gray-600">User Code:</span>
            <span className="font-medium text-primary-700">{userData?.userCode}</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              {renderIcon(item.icon)}
              <span>{item.name}</span>
            </NavLink>
          ))}
          
          <button
            onClick={handleLogout}
            className="nav-link text-gray-700 hover:bg-gray-100 w-full"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 flex justify-between items-center px-4 py-2 sm:px-6">
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
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`px-4 py-2 hover:bg-gray-50 ${
                            !notification.read ? 'bg-primary-50' : ''
                          }`}
                        >
                          <p className="text-sm text-gray-800">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No notifications
                      </div>
                    )}
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
                  {userData?.firstName} {userData?.lastName}
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
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}