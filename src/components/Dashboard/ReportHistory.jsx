import { useMemo, useState } from 'react';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { formatDate, formatBDTShort, formatNumber, formatPercent } from '../../utils/formatters';

function ReportDetail({ report, onClose }) {
  return (
    <div className="glass-card p-4 sm:p-5 mt-3 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{formatDate(report.dateString)}</span>
          <span className="text-[10px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded-full">{report.dayOfWeek || ''}</span>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-bg-elevated/60 rounded-xl px-3 py-2.5">
          <p className="text-[9px] text-text-muted uppercase tracking-wider">Orders</p>
          <p className="text-sm font-mono font-semibold text-text-primary">{formatNumber(report.totalOrder)}</p>
          <p className="text-[9px] text-text-muted">{formatNumber(report.regularOrder)} Reg · {formatNumber(report.customizeOrder)} Cust</p>
        </div>
        <div className="bg-bg-elevated/60 rounded-xl px-3 py-2.5">
          <p className="text-[9px] text-text-muted uppercase tracking-wider">Value</p>
          <p className="text-sm font-mono font-semibold text-accent-gold">{formatBDTShort(report.totalOrderValue)}</p>
        </div>
        <div className="bg-bg-elevated/60 rounded-xl px-3 py-2.5">
          <p className="text-[9px] text-text-muted uppercase tracking-wider">Advance</p>
          <p className="text-sm font-mono font-semibold text-accent-teal">{formatBDTShort(report.totalAdvance)}</p>
          <p className="text-[9px] text-text-muted">{formatPercent(report.advanceRate)} rate</p>
        </div>
        <div className="bg-bg-elevated/60 rounded-xl px-3 py-2.5">
          <p className="text-[9px] text-text-muted uppercase tracking-wider">Products</p>
          <p className="text-sm font-mono font-semibold text-text-primary">{formatNumber(report.totalProduct)}</p>
          <p className="text-[9px] text-text-muted">{report.products?.length || 0} unique items</p>
        </div>
      </div>

      {report.products && report.products.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Products ({report.products.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {report.products.map(p => (
              <span key={p.name} className="px-2 py-1 bg-bg-elevated rounded-lg text-xs text-text-primary border border-border/50">
                {p.name} <span className="text-accent-gold font-mono">×{p.quantity}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {report.rawText && (
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Raw Text</p>
          <pre className="text-xs text-text-muted bg-bg-elevated/80 rounded-xl p-3 overflow-x-auto max-h-40 leading-relaxed whitespace-pre-wrap font-mono">
            {report.rawText}
          </pre>
        </div>
      )}
    </div>
  );
}

function ReportRow({ report, index, total, selected, onSelect }) {
  const productCount = report.products?.length || 0;
  const isSelected = selected?.dateString === report.dateString;

  return (
    <>
      <tr className={`border-b border-border/50 transition-colors cursor-pointer ${
        isSelected ? 'bg-accent-gold/5' : 'hover:bg-bg-elevated/40'
      }`}
        onClick={() => onSelect(isSelected ? null : report)}
      >
        <td className="py-2.5 pr-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-accent-gold/10 text-accent-gold text-[10px] font-mono flex items-center justify-center flex-shrink-0">
              {total - index}
            </span>
            <div>
              <p className="text-sm font-medium text-text-primary">{formatDate(report.dateString)}</p>
              <p className="text-[10px] text-text-muted">{report.dayOfWeek || ''}</p>
            </div>
          </div>
        </td>
        <td className="py-2.5 pr-2 text-right font-mono text-sm text-text-primary">{formatNumber(report.totalOrder)}</td>
        <td className="py-2.5 pr-2 text-right font-mono text-sm text-text-primary">{formatNumber(report.totalProduct)}</td>
        <td className="py-2.5 pr-2 text-right font-mono text-sm text-accent-gold">{formatBDTShort(report.totalOrderValue)}</td>
        <td className="py-2.5 pr-2 text-right font-mono text-sm text-accent-teal">{formatPercent(report.advanceRate)}</td>
        <td className="py-2.5 text-right">
          <Badge variant={productCount > 0 ? 'gold' : 'default'}>{productCount}</Badge>
        </td>
      </tr>
    </>
  );
}

export default function ReportHistory({ reports, loading }) {
  const sorted = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    return [...reports].sort((a, b) => a.dateString.localeCompare(b.dateString));
  }, [reports]);

  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState(null);
  const visible = showAll ? sorted : sorted.slice(-15);

  if (loading) return null;
  if (sorted.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="section-title">Report History</h3>
          <p className="text-xs text-text-muted mt-0.5">{sorted.length} reports total</p>
        </div>
        {sorted.length > 15 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-accent-gold hover:underline font-medium"
          >
            {showAll ? 'Show less' : `Show all ${sorted.length}`}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted text-[10px] uppercase tracking-wider border-b border-border">
              <th className="text-left py-2 pr-2">Date</th>
              <th className="text-right py-2 pr-2">Orders</th>
              <th className="text-right py-2 pr-2">Products</th>
              <th className="text-right py-2 pr-2">Value</th>
              <th className="text-right py-2 pr-2">Adv%</th>
              <th className="text-right py-2">Items</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <ReportRow key={r.dateString} report={r} index={i + (sorted.length - visible.length)} total={sorted.length}
                selected={selected} onSelect={setSelected} />
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <ReportDetail report={selected} onClose={() => setSelected(null)} />
      )}
    </Card>
  );
}
