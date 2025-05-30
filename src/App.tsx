import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';

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
import Rewards from './pages/dashboard/Rewards';

// Dealer Pages
import DealerDashboard from './pages/dealer/DealerDashboard';
import ApprovePoints from './pages/dealer/ApprovePoints';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRewards from './pages/admin/AdminRewards';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminMarketing from './pages/admin/AdminMarketing';

function App() {
  return (
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
          <Route element={<ProtectedRoute allowedRoles={['builder', 'contractor']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/get-points" element={<GetPoints />} />
              <Route path="/redeem" element={<RedeemRewards />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route path="/profile" element={<UserProfile />} />
            </Route>
          </Route>
          
          {/* Dealer Routes */}
          <Route element={<ProtectedRoute allowedRoles={['dealer']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dealer/dashboard" element={<DealerDashboard />} />
              <Route path="/dealer/approve-points" element={<ApprovePoints />} />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route path="/profile" element={<UserProfile />} />
            </Route>
          </Route>
          
          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/rewards" element={<AdminRewards />} />
              <Route path="/admin/approvals" element={<AdminApprovals />} />
              <Route path="/admin/marketing" element={<AdminMarketing />} />
            </Route>
          </Route>
          
          {/* Redirect */}
          <Route path="/" element={<Navigate to="/login\" replace />} />
          <Route path="*" element={<Navigate to="/login\" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

export default App;