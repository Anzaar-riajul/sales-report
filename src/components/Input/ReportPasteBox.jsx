import { useState, useCallback, useEffect } from 'react';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { parseReport } from '../../utils/parser';
import { formatBDT, formatNumber } from '../../utils/formatters';

export default function ReportPasteBox({ onSave, onPreview, existingReport, saving, clearTrigger }) {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="section-title mb-3">Paste Daily Report</h3>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste the daily order report here...

Example:
Bismillahir Rahmanir Rahim
Anzaar Islamic Lifestyle
Online Order update: 08 June, 2026 (Monday)
 Regular Order: 68 pcs Regular Product: 82 Pcs Customize order: 21 pcs Customize Product: 27 pcs Total Order: 89 Total Product: 109 pcs Total Advance: 39,135 TK Total Order Value: 3,15,475 TK
==================
1. Abaya Airaffa-4
2. Abaya Anaira v1-2
3. Abaya Tahsheen-6"
          className="input-dark w-full h-64 resize-y font-mono text-sm leading-relaxed"
          spellCheck={false}
        />
        {error && (
          <p className="text-accent-rose text-sm mt-2">{error}</p>
        )}
        <div className="flex gap-3 mt-3">
          <button onClick={handleParse} className="btn-primary text-sm" disabled={!rawText.trim()}>
            Parse & Preview
          </button>
          <button onClick={handleClear} className="btn-secondary text-sm">
            Clear
          </button>
        </div>
      </Card>

      {parsed && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Preview</h3>
            <div className="flex gap-2">
              {parsed.dateString && (
                <Badge variant="gold">{parsed.dateString} ({parsed.dayOfWeek})</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Regular Orders', value: formatNumber(parsed.regularOrder) },
              { label: 'Regular Products', value: formatNumber(parsed.regularProduct) },
              { label: 'Customize Orders', value: formatNumber(parsed.customizeOrder) },
              { label: 'Customize Products', value: formatNumber(parsed.customizeProduct) },
              { label: 'Total Orders', value: formatNumber(parsed.totalOrder) },
              { label: 'Total Products', value: formatNumber(parsed.totalProduct) },
              { label: 'Total Advance', value: formatBDT(parsed.totalAdvance) },
              { label: 'Order Value', value: formatBDT(parsed.totalOrderValue) },
            ].map(stat => (
              <div key={stat.label} className="glass-card-elevated p-3">
                <p className="text-text-muted text-xs">{stat.label}</p>
                <p className="font-mono text-sm font-semibold text-text-primary mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {parsed.products.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-2">Products ({parsed.products.length})</h4>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border">
                      <th className="text-left py-2 pr-2">Product</th>
                      <th className="text-right py-2">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.products.map((p) => (
                      <tr key={p.name} className="border-b border-border/50">
                        <td className="py-1.5 pr-2 text-text-primary">{p.name}</td>
                        <td className="py-1.5 text-right font-mono text-accent-gold">{p.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <button
              onClick={handleSave}
              disabled={saving || !parsed.dateString}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : 'Save'}
            </button>
            {existingReport && (
              <p className="text-amber-600 text-xs font-medium">
                ⚠ Report for {parsed.dateString} already exists. Save will overwrite.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
