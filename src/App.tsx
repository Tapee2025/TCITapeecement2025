import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { Suspense, lazy, useEffect } from 'react';
import { backgroundConnectionManager } from './lib/supabase';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthLayout from './components/layouts/AuthLayout';
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminLayout from './components/layouts/AdminLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Lazy load components to improve performance
// User Pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const GetPoints = lazy(() => import('./pages/dashboard/GetPoints'));
const RedeemRewards = lazy(() => import('./pages/dashboard/RedeemRewards'));
const TransactionHistory = lazy(() => import('./pages/dashboard/TransactionHistory'));
const UserProfile = lazy(() => import('./pages/dashboard/UserProfile'));
const FAQ = lazy(() => import('./pages/dashboard/FAQ'));

// Dealer Pages
const DealerDashboard = lazy(() => import('./pages/dealer/DealerDashboard'));
const ApprovePoints = lazy(() => import('./pages/dealer/ApprovePoints'));
const ManageCustomers = lazy(() => import('./pages/dealer/ManageCustomers'));
const DealerGetPoints = lazy(() => import('./pages/dealer/DealerGetPoints'));
const DealerRewards = lazy(() => import('./pages/dealer/DealerRewards'));
const DealerProfile = lazy(() => import('./pages/dealer/DealerProfile'));
const DealerAnalytics = lazy(() => import('./pages/dealer/DealerAnalytics'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminRewards = lazy(() => import('./pages/admin/AdminRewards'));
const AdminApprovals = lazy(() => import('./pages/admin/AdminApprovals'));
const AdminToOrder = lazy(() => import('./pages/admin/AdminToOrder'));
const AdminMarketing = lazy(() => import('./pages/admin/AdminMarketing'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminFAQ = lazy(() => import('./pages/admin/AdminFAQ'));

// Components
import NotificationCenter from './components/notifications/NotificationCenter';
import AnnouncementBanner from './components/announcements/AnnouncementBanner';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  // Initialize background connection management
  useEffect(() => {
    // Start background connection management
    backgroundConnectionManager.start();

    return () => {
      // Stop background connection management
      backgroundConnectionManager.stop();
    };
  }, []);

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
              <Route element={<ProtectedRoute allowedRoles={['contractor', 'sub_dealer']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <Dashboard />
                    </Suspense>
                  } />
                  <Route path="/get-points" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <GetPoints />
                    </Suspense>
                  } />
                  <Route path="/redeem" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <RedeemRewards />
                    </Suspense>
                  } />
                  <Route path="/transactions" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <TransactionHistory />
                    </Suspense>
                  } />
                  <Route path="/profile" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <UserProfile />
                    </Suspense>
                  } />
                  <Route path="/faq" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <FAQ />
                    </Suspense>
                  } />
                </Route>
              </Route>
              
              {/* Dealer Routes */}
              <Route element={<ProtectedRoute allowedRoles={['dealer']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dealer/dashboard" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <DealerDashboard />
                    </Suspense>
                  } />
                  <Route path="/dealer/approve-points" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <ApprovePoints />
                    </Suspense>
                  } />
                  <Route path="/dealer/customers" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <ManageCustomers />
                    </Suspense>
                  } />
                  <Route path="/dealer/get-points" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <DealerGetPoints />
                    </Suspense>
                  } />
                  <Route path="/dealer/rewards" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <DealerRewards />
                    </Suspense>
                  } />
                  <Route path="/dealer/profile" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <DealerProfile />
                    </Suspense>
                  } />
                  <Route path="/dealer/transactions" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <TransactionHistory />
                    </Suspense>
                  } />
                  <Route path="/dealer/analytics" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <DealerAnalytics />
                    </Suspense>
                  } />
                  <Route path="/dealer/faq" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <FAQ />
                    </Suspense>
                  } />
                </Route>
              </Route>
              
              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminDashboard />
                    </Suspense>
                  } />
                  <Route path="/admin/users" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminUsers />
                    </Suspense>
                  } />
                  <Route path="/admin/rewards" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminRewards />
                    </Suspense>
                  } />
                  <Route path="/admin/approvals" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminApprovals />
                    </Suspense>
                  } />
                  <Route path="/admin/to-order" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminToOrder />
                    </Suspense>
                  } />
                  <Route path="/admin/marketing" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminMarketing />
                    </Suspense>
                  } />
                  <Route path="/admin/analytics" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminAnalytics />
                    </Suspense>
                  } />
                  <Route path="/admin/announcements" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminAnnouncements />
                    </Suspense>
                  } />
                  <Route path="/admin/faq" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminFAQ />
                    </Suspense>
                  } />
                  <Route path="/admin/achievements" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminAchievements />
                    </Suspense>
                  } />
                  <Route path="/admin/support" element={
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminSupport />
                    </Suspense>
                  } />
                </Route>
              </Route>
              
              {/* Redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            
            {/* Global Components */}
            <AnnouncementBanner />
            
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
              limit={3} // Limit the number of toasts to prevent memory issues
            />
          </Router>
        </AuthProvider>
      </div>
    </ErrorBoundary>
  );
}

// Add TypeScript declaration for window.gc
declare global {
  interface Window {
    gc?: () => void;
  }
}

export default App;