import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DailyInput from './pages/DailyInput';
import Analytics from './pages/Analytics';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Settings from './pages/Settings';
import Alerts from './pages/Alerts';
import Loader from './components/UI/Loader';

function ProtectedRoute({ children, user, allowed, loading }) {
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-accent-rose/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-accent-rose">!</span>
          </div>
          <h2 className="font-display text-xl text-text-primary mb-2">Access Denied</h2>
          <p className="text-text-muted text-sm mb-4">
            Your account is not authorized to access this dashboard.
          </p>
          <p className="text-text-muted text-xs">
            Contact the admin to add your email to the allowed users list.
          </p>
        </div>
      </div>
    );
  }

  return <Layout user={user}>{children}</Layout>;
}

export default function App() {
  const { user, loading, allowed } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        loading ? <Loader /> : user ? <Navigate to="/" replace /> : <Login loading={loading} />
      } />
      <Route path="/" element={
        <ProtectedRoute user={user} allowed={allowed} loading={loading}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/input" element={
        <ProtectedRoute user={user} allowed={allowed} loading={loading}>
          <DailyInput />
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute user={user} allowed={allowed} loading={loading}>
          <Analytics />
        </ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute user={user} allowed={allowed} loading={loading}>
          <Products />
        </ProtectedRoute>
      } />
      <Route path="/products/:productName" element={
        <ProtectedRoute user={user} allowed={allowed} loading={loading}>
          <ProductDetail />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute user={user} allowed={allowed} loading={loading}>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/alerts" element={
        <ProtectedRoute user={user} allowed={allowed} loading={loading}>
          <Alerts />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
