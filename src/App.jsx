import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { createSignupRequest } from './firebase/auth';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DailyInput from './pages/DailyInput';
import Analytics from './pages/Analytics';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Settings from './pages/Settings';
import Alerts from './pages/Alerts';
import PDFExport from './pages/PDFExport';
import Loader from './components/UI/Loader';

function ProtectedRoute({ children, user, allowed, loading }) {
  const [requestSent, setRequestSent] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');

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
    const handleRequestAccess = async () => {
      setReqLoading(true);
      setReqError('');
      try {
        const result = await createSignupRequest(user.uid, user.email);
        if (result.success) {
          setRequestSent(true);
        } else {
          setReqError(result.message || 'Failed to send request.');
        }
      } catch (err) {
        setReqError('Something went wrong. Please try again.');
      }
      setReqLoading(false);
    };

    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="glass-card p-8 sm:p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-rose/10 border border-accent-rose/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl text-accent-rose">!</span>
          </div>
          <h2 className="font-semibold text-xl text-text-primary mb-2">Access Denied</h2>
          <p className="text-text-muted text-sm mb-6">
            Your account is not yet authorized to access this dashboard.
          </p>

          {requestSent ? (
            <div className="bg-accent-teal/5 border border-accent-teal/20 rounded-xl p-4 text-left">
              <p className="text-sm font-medium text-accent-teal mb-1">✓ Request Sent</p>
              <p className="text-xs text-text-muted">
                The super admin has been notified. You will be able to access the dashboard once approved.
              </p>
            </div>
          ) : (
            <>
              <button onClick={handleRequestAccess} disabled={reqLoading}
                className="btn-primary w-full text-sm mb-3 flex items-center justify-center gap-2">
                {reqLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                ) : 'Request Access'}
              </button>
              {reqError && <p className="text-xs text-accent-rose mb-3">{reqError}</p>}
              <p className="text-[10px] text-text-muted">
                Your UID: <code className="text-accent-gold bg-bg-elevated px-1.5 py-0.5 rounded text-[9px]">{user.uid}</code>
              </p>
            </>
          )}
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
      <Route path="/export" element={
        <ProtectedRoute user={user} allowed={allowed} loading={loading}>
          <PDFExport />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
