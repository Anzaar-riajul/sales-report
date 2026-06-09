import { format } from 'date-fns';
import { formatBDTShort } from '../../utils/formatters';

export default function Header({ latestReport }) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-white sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="flex-shrink-0">
          <h1 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight truncate">
            Anzaar Sales Report
          </h1>
          <p className="text-[10px] sm:text-xs text-text-muted mt-px">
            {format(new Date(), 'EEEE, MMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        {latestReport && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-text-muted leading-tight">Last report</p>
              <p className="text-xs font-medium text-text-primary">{latestReport.dateString}</p>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="text-right">
              <p className="text-[10px] text-text-muted leading-tight">Value</p>
              <p className="text-xs font-mono font-semibold text-accent-gold">{formatBDTShort(latestReport.totalOrderValue)}</p>
            </div>
          </div>
        )}
        <div className="h-6 w-px bg-border hidden sm:block" />
        <div className="flex items-center gap-1.5 bg-accent-gold/5 border border-accent-gold/15 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2">
          <span className="text-[10px] sm:text-xs font-medium text-accent-gold">◈</span>
          <span className="text-[10px] sm:text-xs font-medium text-accent-gold">Anzaar</span>
        </div>
      </div>
    </header>
  );
}
