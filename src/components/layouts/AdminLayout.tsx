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
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_NAVIGATION } from '../../utils/constants';

export default function AdminLayout() {
  const { userData, logout } = useAuth();
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
  
  // Function to render the appropriate icon
  const renderIcon = (iconName: string) => {
    const props = { size: 20 };
    switch (iconName) {
      case 'LayoutDashboard': return <LayoutDashboard {...props} />;
      case 'Users': return <Users {...props} />;
      case 'Gift': return <Gift {...props} />;
      case 'CheckCircle': return <CheckCircle {...props} />;
      case 'Image': return <Image {...props} />;
      case 'Settings': return <Settings {...props} />;
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
        className={`fixed top-0 left-0 z-30 w-64 h-full bg-gray-900 text-white transition-transform duration-300 ease-in-out transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800 safe-top">
          <div className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="Tapee Cement" 
              className="h-10 w-auto bg-white p-1 rounded"
            />
            <div>
              <h1 className="font-bold text-lg">Tapee Cement</h1>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* User info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-accent-400/20 flex items-center justify-center text-accent-400 font-semibold">
              {userData?.firstName?.charAt(0)}{userData?.lastName?.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{userData?.firstName} {userData?.lastName}</p>
              <p className="text-xs text-gray-400 capitalize">{userData?.role}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1">
          {ADMIN_NAVIGATION.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors ${
                  isActive ? 'bg-gray-800 text-accent-400 font-medium' : 'text-gray-300'
                }`
              }
            >
              {renderIcon(item.icon)}
              <span>{item.name}</span>
            </NavLink>
          ))}
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 w-full mobile-bottom-safe"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 flex justify-between items-center px-4 py-2 sm:px-6 safe-top safe-left safe-right">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-4">            
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900"
              >
                <span className="hidden sm:inline-block font-medium">
                  Admin
                </span>
                <ChevronDown size={16} />
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
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
        <main className="p-4 sm:p-6 safe-bottom safe-left safe-right">
          <Outlet />
        </main>
      </div>
    </div>
  );
}