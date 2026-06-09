import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { formatBDTShort } from '../../utils/formatters';
import { getUnreadCount } from '../../utils/notifications';

export default function Header({ latestReport, user, role }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const check = () => setUnreadCount(getUnreadCount());
    check();
    const interval = setInterval(check, 10000);
    window.addEventListener('notification-updated', check);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-updated', check);
    };
  }, []);

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
          onClick={() => navigate('/notifications')}
          className="relative w-9 h-9 rounded-full bg-bg-elevated/60 border border-border/30 flex items-center justify-center hover:bg-bg-elevated hover:border-accent-gold/20 hover:shadow-md transition-all duration-300 group flex-shrink-0"
        >
          <svg className="w-4.5 h-4.5 text-text-muted group-hover:text-accent-gold transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-gradient-to-r from-accent-rose to-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-accent-rose/30 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full overflow-hidden hover:ring-2 hover:ring-accent-gold/30 hover:shadow-lg hover:shadow-accent-gold/10 transition-all duration-300 group flex-shrink-0"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent-gold to-amber-400 flex items-center justify-center text-sm text-white font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
