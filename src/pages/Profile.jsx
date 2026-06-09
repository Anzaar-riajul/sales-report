import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useReports } from '../hooks/useReports';
import { useProducts } from '../hooks/useProducts';
import { logout } from '../firebase/auth';
import { formatBDT, formatNumber } from '../utils/formatters';
import { format, subDays } from 'date-fns';
import DetailModal from '../components/UI/DetailModal';

const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', icon: '👑', color: '#C9A84C', gradient: 'from-amber-400 via-yellow-500 to-amber-600', desc: 'Full access to all features' },
  admin: { label: 'Admin', icon: '⚙', color: '#0D9488', gradient: 'from-teal-400 via-emerald-500 to-teal-600', desc: 'Can view and input reports' },
  viewer: { label: 'Viewer', icon: '👁', color: '#64748B', gradient: 'from-slate-400 via-gray-500 to-slate-600', desc: 'Read-only access' },
};

const FEATURES = {
  super_admin: [
    { icon: '📊', label: 'Full Analytics', desc: 'All dashboards and reports' },
    { icon: '📝', label: 'Input Reports', desc: 'Add and edit daily reports' },
    { icon: '👥', label: 'Manage Users', desc: 'Add, remove, change roles' },
    { icon: '⚙', label: 'System Settings', desc: 'Configure access and roles' },
    { icon: '📥', label: 'Export PDFs', desc: 'Generate custom reports' },
    { icon: '🔔', label: 'Alerts', desc: 'View all system insights' },
  ],
  admin: [
    { icon: '📊', label: 'Full Analytics', desc: 'All dashboards and reports' },
    { icon: '📝', label: 'Input Reports', desc: 'Add and edit daily reports' },
    { icon: '📥', label: 'Export PDFs', desc: 'Generate custom reports' },
    { icon: '🔔', label: 'Alerts', desc: 'View all system insights' },
  ],
  viewer: [
    { icon: '📊', label: 'View Analytics', desc: 'Browse all dashboards' },
    { icon: '📥', label: 'Export PDFs', desc: 'Generate custom reports' },
    { icon: '🔔', label: 'Alerts', desc: 'View all system insights' },
  ],
};

export default function Profile() {
  const { user, role, isSuperAdmin } = useAuth();
  const { reports, loading: reportsLoading } = useReports();
  const { products, loading: productsLoading } = useProducts();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showRoleGuide, setShowRoleGuide] = useState(false);

  const stats = useMemo(() => {
    if (!reports || reports.length === 0) return null;
    const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
    const latest = sorted[0];
    const totalRevenue = sorted.reduce((s, r) => s + (r.totalOrderValue || 0), 0);
    const avgOrderValue = sorted.reduce((s, r) => s + (r.averageOrderValue || 0), 0) / sorted.length;
    const last30 = sorted.filter(r => new Date(r.dateString) >= subDays(new Date(), 30));
    const thisWeek = sorted.filter(r => new Date(r.dateString) >= subDays(new Date(), 7));
    return {
      totalReports: sorted.length,
      totalRevenue,
      avgOrderValue,
      latestDate: latest?.dateString,
      latestValue: latest?.totalOrderValue,
      reportsThisMonth: last30.length,
      reportsThisWeek: thisWeek.length,
      dateRange: { first: sorted[sorted.length - 1]?.dateString, last: latest?.dateString },
    };
  }, [reports]);

  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.viewer;
  const features = FEATURES[role] || FEATURES.viewer;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen animate-fade-in">
      {/* ─── HERO SECTION ─── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-gold via-amber-500 to-amber-600" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative px-5 pt-8 pb-6 sm:px-8 sm:pt-12 sm:pb-8">
          {/* Back button */}
          <button onClick={() => navigate(-1)}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all backdrop-blur-sm">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="absolute -inset-1 bg-white/30 rounded-2xl blur-lg" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-3 border-white/50 shadow-xl">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl text-white font-bold">{user?.email?.charAt(0).toUpperCase() || 'A'}</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white shadow-lg flex items-center justify-center">
                <span className="text-sm">{roleConfig.icon}</span>
              </div>
            </div>

            {/* Name & Email */}
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{user?.displayName || user?.email?.split('@')[0]}</h1>
            <p className="text-white/70 text-sm mt-1">{user?.email}</p>

            {/* Role Badge */}
            <div className="mt-3 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <span className="text-xs font-bold text-white">{roleConfig.icon} {roleConfig.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div className="px-3 sm:px-4 -mt-4 space-y-3 sm:space-y-4 pb-8">
        {/* ─── QUICK STATS ─── */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 animate-fade-in-up stagger-1">
            <div className="bg-white/90 backdrop-blur-sm border border-border/30 rounded-2xl p-3 text-center hover:shadow-lg hover:border-accent-gold/20 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-gold/15 to-amber-400/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <span className="text-lg">📊</span>
              </div>
              <p className="text-lg sm:text-xl font-bold font-mono text-text-primary">{stats.totalReports}</p>
              <p className="text-[9px] text-text-muted mt-0.5">Total Reports</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm border border-border/30 rounded-2xl p-3 text-center hover:shadow-lg hover:border-accent-teal/20 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-teal/15 to-emerald-400/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <span className="text-lg">💰</span>
              </div>
              <p className="text-lg sm:text-xl font-bold font-mono text-accent-teal">{formatBDT(stats.totalRevenue).slice(0, -3)}K</p>
              <p className="text-[9px] text-text-muted mt-0.5">Total Revenue</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm border border-border/30 rounded-2xl p-3 text-center hover:shadow-lg hover:border-violet-400/20 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400/15 to-purple-400/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <span className="text-lg">📦</span>
              </div>
              <p className="text-lg sm:text-xl font-bold font-mono text-violet-500">{products?.length || 0}</p>
              <p className="text-[9px] text-text-muted mt-0.5">Products</p>
            </div>
          </div>
        )}

        {/* ─── RECENT ACTIVITY ─── */}
        {stats && (
          <div className="bg-white/90 backdrop-blur-sm border border-border/30 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 animate-fade-in-up stagger-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-gold/15 to-amber-400/10 flex items-center justify-center">
                <span className="text-sm">🕐</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Recent Activity</h3>
                <p className="text-[10px] text-text-muted">Your latest interactions</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 bg-bg-elevated/30 rounded-xl hover:bg-bg-elevated/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">📝</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary">Last Report</p>
                  <p className="text-[10px] text-text-muted">{stats.latestDate} · {formatBDT(stats.latestValue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-bg-elevated/30 rounded-xl hover:bg-bg-elevated/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-violet-400/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">📅</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary">Reports This Week</p>
                  <p className="text-[10px] text-text-muted">{stats.reportsThisWeek} reports submitted</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-bg-elevated/30 rounded-xl hover:bg-bg-elevated/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-accent-gold/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">📦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary">Data Range</p>
                  <p className="text-[10px] text-text-muted">{stats.dateRange.first} → {stats.dateRange.last}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── PERMISSIONS ─── */}
        <div className="bg-white/90 backdrop-blur-sm border border-border/30 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-gold/15 to-amber-400/10 flex items-center justify-center">
              <span className="text-sm">🔐</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Your Permissions</h3>
              <p className="text-[10px] text-text-muted">{roleConfig.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2.5 bg-bg-elevated/30 rounded-xl hover:bg-bg-elevated/50 transition-colors">
                <span className="text-base">{f.icon}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-text-primary truncate">{f.label}</p>
                  <p className="text-[9px] text-text-muted truncate">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── QUICK ACTIONS ─── */}
        <div className="bg-white/90 backdrop-blur-sm border border-border/30 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 animate-fade-in-up stagger-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-gold/15 to-amber-400/10 flex items-center justify-center">
              <span className="text-sm">⚡</span>
            </div>
            <h3 className="text-sm font-semibold text-text-primary">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-accent-gold/5 to-amber-400/5 border border-accent-gold/15 rounded-xl hover:from-accent-gold/10 hover:to-amber-400/10 hover:border-accent-gold/25 hover:shadow-md transition-all duration-300 group">
              <span className="text-base group-hover:scale-110 transition-transform">📊</span>
              <span className="text-[11px] font-semibold text-text-primary">Dashboard</span>
            </button>
            <button onClick={() => navigate('/input')}
              className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-accent-teal/5 to-emerald-400/5 border border-accent-teal/15 rounded-xl hover:from-accent-teal/10 hover:to-emerald-400/10 hover:border-accent-teal/25 hover:shadow-md transition-all duration-300 group">
              <span className="text-base group-hover:scale-110 transition-transform">📝</span>
              <span className="text-[11px] font-semibold text-text-primary">Entry</span>
            </button>
            <button onClick={() => navigate('/products')}
              className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-violet-400/5 to-purple-400/5 border border-violet-400/15 rounded-xl hover:from-violet-400/10 hover:to-purple-400/10 hover:border-violet-400/25 hover:shadow-md transition-all duration-300 group">
              <span className="text-base group-hover:scale-110 transition-transform">📦</span>
              <span className="text-[11px] font-semibold text-text-primary">Products</span>
            </button>
            <button onClick={() => navigate('/export')}
              className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-rose-400/5 to-pink-400/5 border border-rose-400/15 rounded-xl hover:from-rose-400/10 hover:to-pink-400/10 hover:border-rose-400/25 hover:shadow-md transition-all duration-300 group">
              <span className="text-base group-hover:scale-110 transition-transform">📥</span>
              <span className="text-[11px] font-semibold text-text-primary">Export</span>
            </button>
          </div>
        </div>

        {/* ─── APP INFO ─── */}
        <div className="bg-white/90 backdrop-blur-sm border border-border/30 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 animate-fade-in-up stagger-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-gold/15 to-amber-400/10 flex items-center justify-center">
              <span className="text-sm">ℹ️</span>
            </div>
            <h3 className="text-sm font-semibold text-text-primary">App Info</h3>
          </div>
          <div className="space-y-0">
            {[
              { label: 'App', value: 'Anzaar Sales Report' },
              { label: 'Version', value: '2.0.0', mono: true },
              { label: 'Role', value: roleConfig.label, color: roleConfig.color },
              { label: 'UID', value: user?.uid?.slice(0, 16) + '...', mono: true, small: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0">
                <span className="text-[11px] text-text-muted">{item.label}</span>
                <span className={`text-[11px] font-medium ${item.mono ? 'font-mono' : ''} ${item.color ? '' : 'text-text-primary'} ${item.small ? 'text-[10px]' : ''}`}
                  style={item.color ? { color: item.color } : {}}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── SIGN OUT ─── */}
        <div className="animate-fade-in-up stagger-6">
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3.5 bg-gradient-to-r from-accent-rose/10 to-rose-500/10 border border-accent-rose/20 rounded-2xl text-sm font-semibold text-accent-rose hover:from-accent-rose/15 hover:to-rose-500/15 hover:border-accent-rose/30 hover:shadow-lg hover:shadow-accent-rose/10 transition-all duration-300 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* ─── LOGOUT CONFIRM MODAL ─── */}
      {showLogoutConfirm && (
        <DetailModal open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)}
          title="Sign Out" icon="🚪" color="#E11D48" subtitle="Are you sure?">
          <div className="space-y-3">
            <p className="text-xs text-text-muted text-center">You will be signed out and redirected to the login page.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-bg-elevated/60 border border-border/30 rounded-xl text-sm font-semibold text-text-primary hover:bg-bg-elevated transition-colors">
                Cancel
              </button>
              <button onClick={handleLogout}
                className="flex-1 py-3 bg-gradient-to-r from-accent-rose to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-accent-rose/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                Sign Out
              </button>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
