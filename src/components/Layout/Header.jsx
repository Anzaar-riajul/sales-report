import { format } from 'date-fns';
import { formatBDTShort } from '../../utils/formatters';

export default function Header({ latestReport }) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-border bg-white sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="flex-shrink-0">
          <h1 className="text-base sm:text-xl font-bold text-text-primary tracking-tight truncate">
            Anzaar Sales Report
          </h1>
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
        <div className="flex items-center gap-1.5 bg-accent-gold/5 border border-accent-gold/15 rounded-lg px-3 py-2">
          <span className="text-xs sm:text-sm font-semibold text-accent-gold">◈</span>
          <span className="text-xs sm:text-sm font-semibold text-accent-gold">Anzaar</span>
        </div>
      </div>
    </header>
  );
}
