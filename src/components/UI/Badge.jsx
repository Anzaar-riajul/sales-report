const variants = {
  default: 'bg-bg-elevated text-text-primary border-border',
  gold: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20',
  teal: 'bg-accent-teal/10 text-accent-teal border-accent-teal/20',
  rose: 'bg-accent-rose/10 text-accent-rose border-accent-rose/20',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
