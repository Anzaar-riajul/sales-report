import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { formatBDTShort } from '../../utils/formatters';

const NOTIF_STORAGE_KEY = 'anzaar_last_seen_notifications';

export default function Header({ latestReport, user, role }) {
  const navigate = useNavigate();
  const [hasUnseen, setHasUnseen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const checkNotifications = () => {
      try {
        const lastSeen = localStorage.getItem(NOTIF_STORAGE_KEY);
        const count = parseInt(localStorage.getItem('anzaar_notif_count') || '0');
        setNotifCount(count);
        setHasUnseen(count > 0 && (!lastSeen || Date.now() - parseInt(lastSeen) > 3600000));
      } catch {}
    };
    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markSeen = () => {
    localStorage.setItem(NOTIF_STORAGE_KEY, Date.now().toString());
    setHasUnseen(false);
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-border bg-white sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="flex-shrink-0">
          <button
            onClick={() => navigate('/')}
            className="text-base sm:text-xl font-bold text-text-primary tracking-tight truncate hover:text-accent-gold transition-colors text-left"
          >
            Anzaar Sales Report
          </button>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            {format(new Date(), 'EEEE, MMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {latestReport && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] text-text-muted leading-tight">Last report</p>
              <p className="text-sm font-medium text-text-primary">{latestReport.dateString}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-right">
              <p className="text-[11px] text-text-muted leading-tight">Value</p>
              <p className="text-sm font-mono font-semibold text-accent-gold">{formatBDTShort(latestReport.totalOrderValue)}</p>
            </div>
          </div>
        )}
        <div className="h-8 w-px bg-border hidden sm:block" />

        {/* Notification Bell */}
        <button
          onClick={() => { markSeen(); navigate('/notifications'); }}
          className="relative w-10 h-10 rounded-xl bg-bg-elevated/60 border border-border/30 flex items-center justify-center hover:bg-bg-elevated hover:border-accent-gold/20 hover:shadow-md transition-all duration-300 group"
        >
          <svg className="w-5 h-5 text-text-muted group-hover:text-accent-gold transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {hasUnseen && notifCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-accent-rose to-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-accent-rose/30 animate-pulse">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 bg-gradient-to-r from-accent-gold/10 to-amber-500/10 border border-accent-gold/20 rounded-xl px-3 py-2 hover:from-accent-gold/15 hover:to-amber-500/15 hover:border-accent-gold/30 hover:shadow-lg hover:shadow-accent-gold/10 transition-all duration-300 group"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-7 h-7 rounded-lg shadow-sm group-hover:shadow-md transition-shadow" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-gold to-amber-400 flex items-center justify-center text-[11px] text-white font-bold shadow-sm">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <p className="text-[11px] font-semibold text-text-primary leading-tight">{user?.displayName || user?.email?.split('@')[0]}</p>
            <p className="text-[9px] text-accent-gold font-medium leading-tight">{role === 'super_admin' ? '👑 Super Admin' : role === 'admin' ? '⚙ Admin' : '👁 Viewer'}</p>
          </div>
          <svg className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-gold transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </header>
  );
}
