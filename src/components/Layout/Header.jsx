import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { formatBDTShort } from '../../utils/formatters';

export default function Header({ latestReport, user, role }) {
  const navigate = useNavigate();

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

      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
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
