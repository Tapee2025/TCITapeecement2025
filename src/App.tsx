import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthLayout from './components/layouts/AuthLayout';
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// User Pages
import Dashboard from './pages/dashboard/Dashboard';
import GetPoints from './pages/dashboard/GetPoints';
import RedeemRewards from './pages/dashboard/RedeemRewards';
import TransactionHistory from './pages/dashboard/TransactionHistory';
import UserProfile from './pages/dashboard/UserProfile';
import Achievements from './pages/dashboard/Achievements';
import FAQ from './pages/dashboard/FAQ';

// Dealer Pages
import DealerDashboard from './pages/dealer/DealerDashboard';
import ApprovePoints from './pages/dealer/ApprovePoints';
import ManageCustomers from './pages/dealer/ManageCustomers';
import DealerGetPoints from './pages/dealer/DealerGetPoints';
import DealerRewards from './pages/dealer/DealerRewards';
import DealerProfile from './pages/dealer/DealerProfile';
import DealerAnalytics from './pages/dealer/DealerAnalytics';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRewards from './pages/admin/AdminRewards';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminToOrder from './pages/admin/AdminToOrder';
import AdminMarketing from './pages/admin/AdminMarketing';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminFAQ from './pages/admin/AdminFAQ';
import AdminAchievements from './pages/admin/AdminAchievements';
import AdminSupport from './pages/admin/AdminSupport';

// Components
import NotificationCenter from './components/notifications/NotificationCenter';
import AnnouncementBanner from './components/announcements/AnnouncementBanner';
import SupportChat from './components/support/SupportChat';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <AuthProvider>
          <Router>
            <Routes>
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>
              
              {/* User Routes */}
              <Route element={<ProtectedRoute allowedRoles={['contractor']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/get-points" element={<GetPoints />} />
                  <Route path="/redeem" element={<RedeemRewards />} />
                  <Route path="/transactions" element={<TransactionHistory />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/faq" element={<FAQ />} />
                </Route>
              </Route>
              
              {/* Dealer Routes */}
              <Route element={<ProtectedRoute allowedRoles={['dealer']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dealer/dashboard" element={<DealerDashboard />} />
                  <Route path="/dealer/approve-points" element={<ApprovePoints />} />
                  <Route path="/dealer/customers" element={<ManageCustomers />} />
                  <Route path="/dealer/get-points" element={<DealerGetPoints />} />
                  <Route path="/dealer/rewards" element={<DealerRewards />} />
                  <Route path="/dealer/profile" element={<DealerProfile />} />
                  <Route path="/dealer/transactions" element={<TransactionHistory />} />
                  <Route path="/dealer/analytics" element={<DealerAnalytics />} />
                  <Route path="/dealer/achievements" element={<Achievements />} />
                  <Route path="/dealer/faq" element={<FAQ />} />
                </Route>
              </Route>
              
              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/rewards" element={<AdminRewards />} />
                  <Route path="/admin/approvals" element={<AdminApprovals />} />
                  <Route path="/admin/to-order" element={<AdminToOrder />} />
                  <Route path="/admin/marketing" element={<AdminMarketing />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                  <Route path="/admin/faq" element={<AdminFAQ />} />
                  <Route path="/admin/achievements" element={<AdminAchievements />} />
                  <Route path="/admin/support" element={<AdminSupport />} />
                </Route>
              </Route>
              
              {/* Redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            
            {/* Global Components */}
            <AnnouncementBanner />
            <SupportChat />
            
            <ToastContainer 
              position="top-right" 
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </Router>
        </AuthProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;