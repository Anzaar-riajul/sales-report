import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { formatBDTShort } from '../../utils/formatters';

export default function Header({ latestReport }) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-white/90 backdrop-blur-sm sticky top-0 z-30 shadow-sm">
      <div>
        <h2 className="text-sm text-text-muted">Today</h2>
        <p className="text-text-primary font-medium">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
      </div>

      <div className="flex items-center gap-4">
        {latestReport && (
          <div className="hidden sm:flex items-center gap-3 text-sm">
            <div className="text-right">
              <p className="text-text-muted text-xs">Last Report</p>
              <p className="text-text-primary">{latestReport.dateString}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-right">
              <p className="text-text-muted text-xs">Order Value</p>
              <p className="text-accent-gold font-mono font-semibold">
                {formatBDTShort(latestReport.totalOrderValue)}
              </p>
            </div>
          </div>
        )}
        <button onClick={() => navigate('/input')} className="btn-primary text-sm flex items-center gap-2">
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">New Report</span>
        </button>
      </div>
    </header>
  );
}
