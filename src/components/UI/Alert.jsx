const severityStyles = {
  high: 'border-accent-rose/30 bg-accent-rose/5 text-accent-rose',
  medium: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
  low: 'border-accent-teal/30 bg-accent-teal/5 text-accent-teal',
};

const icons = {
  high: '⚠',
  medium: '!',
  low: '✓',
};

export default function Alert({ message, severity = 'low', onDismiss, className = '' }) {
  return (
    <div className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border ${severityStyles[severity] || severityStyles.low} ${className}`}>
      <span className="text-sm sm:text-base flex-shrink-0 mt-0.5">{icons[severity]}</span>
      <p className="text-xs sm:text-sm flex-1 leading-snug">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0 text-xs sm:text-sm">
          ✕
        </button>
      )}
    </div>
  );
}
