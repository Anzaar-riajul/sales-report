export default function Card({ children, className = '', onClick, hover = true, padding = true, variant = 'default' }) {
  const base = variant === 'elevated' ? 'glass-card-elevated' : variant === 'static' ? 'glass-card-static' : 'glass-card';

  return (
    <div
      onClick={onClick}
      className={`${base} ${padding ? 'p-4 sm:p-5' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
