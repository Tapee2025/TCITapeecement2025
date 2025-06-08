import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardScreen from './screens/dashboard/DashboardScreen';
import GetPointsScreen from './screens/dashboard/GetPointsScreen';
import RewardsScreen from './screens/dashboard/RewardsScreen';
import ProfileScreen from './screens/dashboard/ProfileScreen';
import TransactionsScreen from './screens/dashboard/TransactionsScreen';
import DealerDashboardScreen from './screens/dealer/DealerDashboardScreen';
import ApprovePointsScreen from './screens/dealer/ApprovePointsScreen';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isDealerOrAdmin = user.role === 'dealer' || user.role === 'admin';

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardScreen />} />
        <Route path="get-points" element={<GetPointsScreen />} />
        <Route path="rewards" element={<RewardsScreen />} />
        <Route path="transactions" element={<TransactionsScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        {isDealerOrAdmin && (
          <>
            <Route path="dealer-dashboard" element={<DealerDashboardScreen />} />
            <Route path="approve-points" element={<ApprovePointsScreen />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;