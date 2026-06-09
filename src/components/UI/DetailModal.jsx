import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function DetailModal({ open, onClose, title, subtitle, icon, color, children }) {
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl sm:mx-4 max-h-[88vh] sm:max-h-[80vh] animate-slide-up">
        <div className="bg-white/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/60 overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[80vh]">
          {/* Header */}
          <div className="relative px-5 pt-5 pb-4 flex-shrink-0">
            {/* Top accent gradient */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
              style={{ background: `linear-gradient(90deg, ${color || '#C9A84C'}, ${color || '#C9A84C'}80, transparent)` }}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {icon && (
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${color || '#C9A84C'}, ${color || '#C9A84C'}CC)` }}
                  >
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">{title}</h2>
                  {subtitle && <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-bg-elevated/80 hover:bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-all flex-shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="px-5 pb-5 overflow-y-auto overscroll-contain flex-1 min-h-0">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
