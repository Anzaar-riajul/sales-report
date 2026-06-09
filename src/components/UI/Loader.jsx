export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-bg-elevated rounded-lg ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card p-5">
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function Loader({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size] || sizes.md} border-2 border-border border-t-accent-gold rounded-full animate-spin`} />
    </div>
  );
}
