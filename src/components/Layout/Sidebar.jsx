import { NavLink } from 'react-router-dom';
import { logout } from '../../firebase/auth';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◈' },
  { path: '/input', label: 'Entry', icon: '+' },
  { path: '/analytics', label: 'Analytics', icon: '◉' },
  { path: '/products', label: 'Products', icon: '▣' },
  { path: '/notifications', label: 'Alerts', icon: '▲' },
  { path: '/export', label: 'Export', icon: '↓' },
];

const adminNavItems = [
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar({ user, role }) {
  const isSuperAdmin = role === 'super_admin';
  const allNavItems = isSuperAdmin ? [...navItems, ...adminNavItems] : navItems;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 bg-bg-card border-r border-border z-40 shadow-sm">
        <div className="p-5 border-b border-border">
          <h1 className="font-display text-xl text-accent-gold">Anzaar</h1>
          <p className="text-text-muted text-xs mt-0.5">Islamic Lifestyle</p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {allNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs text-text-muted">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-secondary w-full text-xs py-2">
            Sign Out
          </button>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-start px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)] bg-white/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {allNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 px-2.5 py-1.5 min-w-0 transition-all duration-200 active:scale-95 ${
                isActive ? 'text-accent-gold' : 'text-text-muted hover:text-text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-accent-gold shadow-sm shadow-accent-gold/30" />
                )}
                <span className={`text-lg sm:text-xl leading-none transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[9px] sm:text-[10px] font-medium leading-tight ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
