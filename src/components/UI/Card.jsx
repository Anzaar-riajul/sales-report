export default function Card({ children, className = '', onClick, hover = true, padding = true }) {
  return (
    <div
      onClick={onClick}
      className={`${hover ? 'glass-card' : 'glass-card-static'} ${padding ? 'p-4 sm:p-5' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
