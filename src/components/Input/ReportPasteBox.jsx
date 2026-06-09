import { useState, useCallback, useEffect } from 'react';
import Badge from '../UI/Badge';
import { parseReport } from '../../utils/parser';
import { formatBDT, formatNumber } from '../../utils/formatters';

function PreviewStat({ label, value, color = 'gold', large = false }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-white to-bg-elevated/30 border border-border/40 rounded-xl p-3 sm:p-3.5 group hover:shadow-md hover:border-accent-gold/20 transition-all duration-300 ${large ? 'sm:col-span-2' : ''}`}>
      <div className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-accent-${color}/10 to-transparent rounded-full opacity-50 group-hover:opacity-80 transition-opacity`} />
      <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium relative">{label}</p>
      <p className={`font-mono font-bold text-text-primary mt-1 relative ${large ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}`}>{value}</p>
    </div>
  );
}

export default function ReportPasteBox({ onSave, onPreview, existingReport, saving, clearTrigger, initialText }) {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (initialText) {
      setRawText(initialText);
      setParsed(null);
      setError(null);
    }
  }, [initialText]);

  useEffect(() => {
    if (clearTrigger) {
      setRawText('');
      setParsed(null);
      setError(null);
    }
  }, [clearTrigger]);

  const handleParse = useCallback(() => {
    setError(null);
    if (!rawText.trim()) {
      setError('Please paste the report text first.');
      return;
    }
    const result = parseReport(rawText);
    if (!result.dateString) {
      setError('Could not detect a date in the report. Make sure the date format is like "08 June, 2026 (Monday)".');
    }
    setParsed(result);
    if (onPreview) onPreview(result);
  }, [rawText, onPreview]);

  const handleSave = useCallback(async () => {
    if (!parsed) return;
    setError(null);
    try {
      await onSave(parsed);
    } catch (err) {
      setError(err.message || 'Failed to save report.');
    }
  }, [parsed, onSave]);

  const handleClear = useCallback(() => {
    setRawText('');
    setParsed(null);
    setError(null);
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRawText(text);
    } catch {}
  }, []);

  return (
    <div className="space-y-4">
      {/* Paste Area */}
      <div className={`relative overflow-hidden bg-white/80 backdrop-blur-xl border rounded-2xl transition-all duration-300 ${focused ? 'border-accent-gold/30 shadow-lg shadow-accent-gold/5' : 'border-border/50 shadow-sm'}`}>
        {/* Top accent */}
        <div className={`h-[2px] transition-all duration-500 ${focused ? 'bg-gradient-to-r from-transparent via-accent-gold to-transparent opacity-100' : 'bg-gradient-to-r from-transparent via-border to-transparent opacity-50'}`} />

        <div className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-gold/15 to-accent-gold/5 border border-accent-gold/20 flex items-center justify-center">
                <span className="text-sm">📋</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Paste Report</h3>
                <p className="text-[10px] text-text-muted">Copy from WhatsApp or any messaging app</p>
              </div>
            </div>
            <button
              onClick={handlePaste}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-accent-gold bg-accent-gold/5 hover:bg-accent-gold/10 border border-accent-gold/15 rounded-lg transition-all"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" />
              </svg>
              Paste
            </button>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={"Paste the daily order report here...\n\nExample:\nBismillahir Rahmanir Rahim\nAnzaar Lifestyle\nOnline Order update: 08 June, 2026 (Monday)\n Regular Order: 68 pcs Regular Product: 82 Pcs..."}
              className="w-full h-56 sm:h-64 resize-y font-mono text-[13px] leading-relaxed bg-bg-elevated/30 border border-border/30 rounded-xl p-4 focus:outline-none focus:border-accent-gold/30 focus:bg-white/50 transition-all placeholder:text-text-muted/40"
              spellCheck={false}
            />
            {rawText && (
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <span className="text-[9px] text-text-muted/50 font-mono">{rawText.split('\n').length} lines</span>
                <button onClick={handleClear} className="text-[9px] text-accent-rose/60 hover:text-accent-rose transition-colors">clear</button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-accent-rose/5 border border-accent-rose/15 rounded-xl">
              <span className="text-accent-rose text-xs">⚠</span>
              <p className="text-accent-rose text-xs">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 mt-4">
            <button
              onClick={handleParse}
              disabled={!rawText.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-accent-gold to-accent-gold/90 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-accent-gold/20 hover:shadow-xl hover:shadow-accent-gold/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Parse & Preview
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-3 text-sm font-medium text-text-muted bg-bg-elevated/50 hover:bg-bg-elevated border border-border/40 rounded-xl transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {parsed && (
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm animate-fade-in-up">
          {/* Top accent */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-accent-teal to-transparent opacity-60" />

          <div className="p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-teal/15 to-accent-teal/5 border border-accent-teal/20 flex items-center justify-center">
                  <span className="text-sm">👁</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Preview</h3>
                  {parsed.dateString && (
                    <p className="text-[10px] text-text-muted">{parsed.dateString} ({parsed.dayOfWeek})</p>
                  )}
                </div>
              </div>
              {existingReport && (
                <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  ⚠ Overwrite existing
                </span>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              <PreviewStat label="Regular Orders" value={formatNumber(parsed.regularOrder)} />
              <PreviewStat label="Regular Products" value={formatNumber(parsed.regularProduct)} />
              <PreviewStat label="Custom Orders" value={formatNumber(parsed.customizeOrder)} />
              <PreviewStat label="Custom Products" value={formatNumber(parsed.customizeProduct)} />
              <PreviewStat label="Total Orders" value={formatNumber(parsed.totalOrder)} large />
              <PreviewStat label="Total Products" value={formatNumber(parsed.totalProduct)} large />
              <PreviewStat label="Total Advance" value={formatBDT(parsed.totalAdvance)} />
              <PreviewStat label="Order Value" value={formatBDT(parsed.totalOrderValue)} />
            </div>

            {/* Products */}
            {parsed.products.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-text-primary">Products</h4>
                  <span className="text-[10px] text-text-muted font-mono">{parsed.products.length} items</span>
                </div>
                <div className="max-h-52 overflow-y-auto rounded-xl border border-border/30 bg-bg-elevated/20">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-bg-elevated/80 backdrop-blur-sm">
                      <tr className="text-text-muted text-[10px] uppercase tracking-wider">
                        <th className="text-left py-2 px-3 font-medium">Product</th>
                        <th className="text-right py-2 px-3 font-medium">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.products.map((p, i) => (
                        <tr key={p.name} className={`border-t border-border/20 ${i % 2 === 0 ? 'bg-white/30' : ''}`}>
                          <td className="py-2 px-3 text-text-primary text-xs font-medium">{p.name}</td>
                          <td className="py-2 px-3 text-right font-mono text-accent-gold text-xs font-semibold">{p.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Save */}
            <div className="pt-3 border-t border-border/30 flex items-center justify-between">
              <button
                onClick={handleSave}
                disabled={saving || !parsed.dateString}
                className="flex items-center gap-2 bg-gradient-to-r from-accent-teal to-accent-teal/90 text-white font-semibold text-sm py-3 px-6 rounded-xl shadow-lg shadow-accent-teal/20 hover:shadow-xl hover:shadow-accent-teal/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    Save Report
                  </>
                )}
              </button>
              {existingReport && (
                <p className="text-[11px] text-amber-600 font-medium">
                  This will overwrite the existing report for {parsed.dateString}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
