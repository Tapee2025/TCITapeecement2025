import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LogOut, 
  ChevronDown,
  LayoutDashboard,
  Users,
  Gift,
  CheckCircle,
  Image,
  Settings,
  Building2,
  Package,
  User,
  BarChart3,
  Megaphone,
  HelpCircle,
  Trophy,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from '../notifications/NotificationCenter';

const ADMIN_NAVIGATION = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Rewards', path: '/admin/rewards', icon: Gift },
  { name: 'Approvals', path: '/admin/approvals', icon: CheckCircle },
  { name: 'To Order', path: '/admin/to-order', icon: Package },
  { name: 'Marketing', path: '/admin/marketing', icon: Image },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { name: 'FAQ', path: '/admin/faq', icon: HelpCircle },
  { name: 'Support', path: '/admin/support', icon: MessageSquare }
];

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 z-30 w-64 h-screen bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b safe-top">
            <div className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="Tapee Cement" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="font-bold text-lg text-gray-900">Tapee Cement</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
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
                {currentUser?.first_name?.charAt(0)}{currentUser?.last_name?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{currentUser?.first_name} {currentUser?.last_name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {ADMIN_NAVIGATION.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
          
          <div className="p-4 border-t mobile-bottom-safe">
            <button
              onClick={handleLogout}
              className="nav-link text-gray-700 hover:bg-gray-100 hover:text-red-600 w-full transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 flex justify-between items-center px-4 py-3 safe-top safe-left safe-right">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-4">
            {/* Notification Center */}
            <NotificationCenter />
            
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Building2 size={16} className="text-primary-600" />
                </div>
                <span className="hidden sm:inline-block font-medium">
                  {currentUser?.first_name}
                </span>
                <ChevronDown size={16} />
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{currentUser?.first_name} {currentUser?.last_name}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} className="inline mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 safe-bottom safe-left safe-right">
          <Outlet />
        </main>
      </div>
    </div>
  );
}