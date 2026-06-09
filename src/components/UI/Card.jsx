export default function Card({ children, className = '', onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 ${hover ? 'cursor-pointer hover:bg-bg-elevated/50 transition-all duration-200' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
