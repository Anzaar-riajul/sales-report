import { useState, useCallback } from 'react';

const PRESETS = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '60d', value: '60d' },
  { label: '90d', value: '90d' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Custom', value: 'custom' },
];

export default function DateRangePicker({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(value?.type === 'custom');
  const [customStart, setCustomStart] = useState(value?.start || '');
  const [customEnd, setCustomEnd] = useState(value?.end || '');

  const handlePreset = useCallback((preset) => {
    if (preset === 'custom') {
      setShowCustom(true);
      if (customStart && customEnd) {
        onChange({ type: 'custom', start: customStart, end: customEnd });
      }
    } else {
      setShowCustom(false);
      onChange({ type: preset });
    }
  }, [onChange, customStart, customEnd]);

  const handleCustomApply = useCallback(() => {
    if (customStart && customEnd) {
      onChange({ type: 'custom', start: customStart, end: customEnd });
    }
  }, [onChange, customStart, customEnd]);

  const currentType = value?.type || '30d';

  return (
    <div className="flex flex-wrap items-center gap-1">
      {PRESETS.map(p => (
        <button
          key={p.value}
          onClick={() => handlePreset(p.value)}
          className={`px-3 py-1.5 text-xs rounded-md transition-all whitespace-nowrap ${
            currentType === p.value
              ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
          }`}
        >
          {p.label}
        </button>
      ))}
      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="input-dark text-xs py-1 px-2 w-32"
          />
          <span className="text-text-muted text-xs">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="input-dark text-xs py-1 px-2 w-32"
          />
          <button onClick={handleCustomApply} className="btn-primary text-xs py-1 px-2">
            Apply
          </button>
        </div>
      )}
    </div>
  );
}


