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
    const copyUid = () => {
      if (user?.uid) {
        navigator.clipboard.writeText(user.uid);
      }
    };

    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-accent-rose/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-accent-rose">!</span>
          </div>
          <h2 className="font-display text-xl text-text-primary mb-2">Access Denied</h2>
          <p className="text-text-muted text-sm mb-4">
            Your Google account is not in the allowed users list.
          </p>
          <div className="bg-bg-elevated rounded-lg p-4 border border-border text-left mb-4">
            <p className="text-xs text-text-muted mb-2">Set up access:</p>
            <ol className="text-xs text-text-primary space-y-1.5 list-decimal list-inside">
              <li>Go to <span className="text-accent-gold">Firebase Console → Firestore</span></li>
              <li>Create collection: <code className="text-accent-gold">config</code></li>
              <li>Document ID: <code className="text-accent-gold">allowedUsers</code></li>
              <li>Field: <code className="text-accent-gold">uids</code> (array), add your UID below</li>
            </ol>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-text-muted mb-1">Your UID (click to copy):</p>
              <button onClick={copyUid} className="font-mono text-xs text-accent-gold bg-bg-primary px-3 py-2 rounded-lg w-full text-left truncate hover:brightness-110">
                {user?.uid || 'Loading...'}
              </button>
            </div>
          </div>
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
