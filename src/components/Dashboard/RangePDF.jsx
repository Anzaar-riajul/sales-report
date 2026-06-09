import { formatBDT, formatNumber, formatDateShort } from '../../utils/formatters';

const THEME = {
  gold: '#C9A84C',
  goldLight: '#C9A84C15',
  teal: '#0D9488',
  tealLight: '#0D948815',
  rose: '#E11D48',
  roseLight: '#E11D4815',
  blue: '#3B82F6',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFC',
};

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}08, ${color}03)`,
      border: `1px solid ${color}20`,
      borderRadius: '10px',
      padding: '10px 12px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '8px', color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '16px', fontWeight: 800, color: THEME.text, margin: '4px 0 0', fontFamily: 'monospace' }}>{value}</p>
    </div>
  );
}

function DailyRow({ report, index, odd }) {
  return (
    <tr style={{ background: odd ? '#F8FAFC' : '#FFFFFF' }}>
      <td style={{ padding: '6px 8px', fontSize: '9px', color: THEME.text, borderBottom: `1px solid ${THEME.border}30` }}>{formatDateShort(report.dateString)}</td>
      <td style={{ padding: '6px 8px', fontSize: '9px', color: THEME.muted, borderBottom: `1px solid ${THEME.border}30` }}>{report.dayOfWeek || '-'}</td>
      <td style={{ padding: '6px 8px', fontSize: '9px', fontFamily: 'monospace', textAlign: 'right', borderBottom: `1px solid ${THEME.border}30` }}>{report.totalOrder}</td>
      <td style={{ padding: '6px 8px', fontSize: '9px', fontFamily: 'monospace', textAlign: 'right', borderBottom: `1px solid ${THEME.border}30` }}>{report.totalProduct}</td>
      <td style={{ padding: '6px 8px', fontSize: '9px', fontFamily: 'monospace', textAlign: 'right', color: THEME.gold, borderBottom: `1px solid ${THEME.border}30` }}>{formatBDT(report.totalOrderValue)}</td>
      <td style={{ padding: '6px 8px', fontSize: '9px', fontFamily: 'monospace', textAlign: 'right', color: THEME.teal, borderBottom: `1px solid ${THEME.border}30` }}>{formatBDT(report.totalAdvance)}</td>
      <td style={{ padding: '6px 8px', fontSize: '9px', fontFamily: 'monospace', textAlign: 'right', borderBottom: `1px solid ${THEME.border}30` }}>{report.regularOrder}/{report.customizeOrder}</td>
    </tr>
  );
}

function ProductRow({ name, qty, category, odd }) {
  return (
    <tr style={{ background: odd ? '#F8FAFC' : '#FFFFFF' }}>
      <td style={{ padding: '5px 8px', fontSize: '9px', color: THEME.text, borderBottom: `1px solid ${THEME.border}30` }}>{name}</td>
      <td style={{ padding: '5px 8px', fontSize: '9px', color: THEME.muted, borderBottom: `1px solid ${THEME.border}30` }}>{category || '-'}</td>
      <td style={{ padding: '5px 8px', fontSize: '9px', fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', color: THEME.gold, borderBottom: `1px solid ${THEME.border}30` }}>{qty}</td>
    </tr>
  );
}

export default function RangePDF({ reports, rangeLabel, startDate, endDate }) {
  if (!reports || reports.length === 0) return null;

  const sorted = [...reports].sort((a, b) => a.dateString.localeCompare(b.dateString));

  // Aggregate stats
  const agg = sorted.reduce((acc, r) => ({
    totalOrder: acc.totalOrder + (r.totalOrder || 0),
    regularOrder: acc.regularOrder + (r.regularOrder || 0),
    customizeOrder: acc.customizeOrder + (r.customizeOrder || 0),
    totalProduct: acc.totalProduct + (r.totalProduct || 0),
    regularProduct: acc.regularProduct + (r.regularProduct || 0),
    customizeProduct: acc.customizeProduct + (r.customizeProduct || 0),
    totalOrderValue: acc.totalOrderValue + (r.totalOrderValue || 0),
    totalAdvance: acc.totalAdvance + (r.totalAdvance || 0),
  }), { totalOrder: 0, regularOrder: 0, customizeOrder: 0, totalProduct: 0, regularProduct: 0, customizeProduct: 0, totalOrderValue: 0, totalAdvance: 0 });

  const days = sorted.length;
  const avgOrders = days > 0 ? Math.round(agg.totalOrder / days) : 0;
  const avgValue = days > 0 ? Math.round(agg.totalOrderValue / days) : 0;
  const avgProducts = days > 0 ? Math.round(agg.totalProduct / days) : 0;
  const advanceRate = agg.totalOrderValue > 0 ? Math.round((agg.totalAdvance / agg.totalOrderValue) * 100) : 0;
  const customizeRate = agg.totalOrder > 0 ? Math.round((agg.customizeOrder / agg.totalOrder) * 100) : 0;
  const pendingAmount = Math.max(0, agg.totalOrderValue - agg.totalAdvance);

  // Top products aggregation
  const productMap = {};
  sorted.forEach(r => {
    (r.products || []).forEach(p => {
      if (!productMap[p.name]) productMap[p.name] = { name: p.name, qty: 0, category: p.category || 'Other' };
      productMap[p.name].qty += p.quantity || 0;
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 15);

  // Day with highest value
  const bestDay = sorted.reduce((best, r) => (r.totalOrderValue > (best?.totalOrderValue || 0)) ? r : best, null);
  const worstDay = sorted.reduce((worst, r) => (r.totalOrderValue < (worst?.totalOrderValue || Infinity)) ? r : worst, null);

  return (
    <div
      id="range-pdf-content"
      style={{
        width: '794px',
        background: '#FFFFFF',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        color: THEME.text,
        padding: '0',
        position: 'absolute',
        left: '-9999px',
        top: 0,
      }}
    >
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${THEME.gold}, ${THEME.gold}CC)`,
        padding: '28px 32px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '30%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Anzaar Islamic Lifestyle</h1>
              <p style={{ fontSize: '12px', opacity: 0.85, margin: '4px 0 0' }}>Sales Report · {rangeLabel || `${startDate} → ${endDate}`}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>{days} days</p>
              <p style={{ fontSize: '9px', opacity: 0.6, margin: '2px 0 0' }}>
                {formatDateShort(startDate)} – {formatDateShort(endDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 32px' }}>
        {/* Summary Stats */}
        <p style={{ fontSize: '9px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Summary</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <StatBox label="Total Orders" value={formatNumber(agg.totalOrder)} color={THEME.gold} />
          <StatBox label="Total Products" value={formatNumber(agg.totalProduct)} color={THEME.teal} />
          <StatBox label="Total Advance" value={formatBDT(agg.totalAdvance)} color={THEME.gold} />
          <StatBox label="Order Value" value={formatBDT(agg.totalOrderValue)} color={THEME.teal} />
        </div>

        {/* Daily Averages */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          <StatBox label="Avg Orders/Day" value={formatNumber(avgOrders)} color={THEME.blue} />
          <StatBox label="Avg Value/Day" value={formatBDT(avgValue)} color={THEME.gold} />
          <StatBox label="Avg Products/Day" value={formatNumber(avgProducts)} color={THEME.teal} />
        </div>

        {/* Order Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: THEME.goldLight, border: `1px solid ${THEME.gold}20`, borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase' }}>Regular</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: THEME.gold, fontFamily: 'monospace' }}>{formatNumber(agg.regularOrder)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: THEME.muted }}>
              <span>{formatNumber(agg.regularProduct)} products</span>
              <span style={{ fontWeight: 600, color: THEME.gold }}>{100 - customizeRate}%</span>
            </div>
            <div style={{ marginTop: '5px', height: '3px', background: `${THEME.gold}15`, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${100 - customizeRate}%`, background: THEME.gold, borderRadius: '2px' }} />
            </div>
          </div>
          <div style={{ background: THEME.roseLight, border: `1px solid ${THEME.rose}20`, borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase' }}>Customize</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: THEME.rose, fontFamily: 'monospace' }}>{formatNumber(agg.customizeOrder)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: THEME.muted }}>
              <span>{formatNumber(agg.customizeProduct)} products</span>
              <span style={{ fontWeight: 600, color: THEME.rose }}>{customizeRate}%</span>
            </div>
            <div style={{ marginTop: '5px', height: '3px', background: `${THEME.rose}15`, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${customizeRate}%`, background: THEME.rose, borderRadius: '2px' }} />
            </div>
          </div>
        </div>

        {/* Advance Details */}
        <div style={{ background: THEME.bg, borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', border: `1px solid ${THEME.border}40` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '3px' }}>
            <span style={{ color: THEME.muted }}>Advance Collected</span>
            <span style={{ fontWeight: 700, color: THEME.teal, fontFamily: 'monospace' }}>{formatBDT(agg.totalAdvance)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '3px' }}>
            <span style={{ color: THEME.muted }}>Pending Amount</span>
            <span style={{ fontWeight: 700, color: THEME.rose, fontFamily: 'monospace' }}>{formatBDT(pendingAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
            <span style={{ color: THEME.muted }}>Advance Rate</span>
            <span style={{ fontWeight: 700, color: THEME.gold, fontFamily: 'monospace' }}>{advanceRate}%</span>
          </div>
        </div>

        {/* Highlights */}
        {bestDay && worstDay && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: `${THEME.teal}08`, border: `1px solid ${THEME.teal}20`, borderRadius: '10px', padding: '10px 14px' }}>
              <p style={{ fontSize: '8px', fontWeight: 600, color: THEME.teal, textTransform: 'uppercase', margin: '0 0 4px' }}>Best Day</p>
              <p style={{ fontSize: '10px', fontWeight: 700, color: THEME.text, margin: 0 }}>{formatDateShort(bestDay.dateString)}</p>
              <p style={{ fontSize: '9px', color: THEME.muted, margin: '2px 0 0' }}>{formatBDT(bestDay.totalOrderValue)} · {bestDay.totalOrder} orders</p>
            </div>
            <div style={{ background: `${THEME.rose}08`, border: `1px solid ${THEME.rose}20`, borderRadius: '10px', padding: '10px 14px' }}>
              <p style={{ fontSize: '8px', fontWeight: 600, color: THEME.rose, textTransform: 'uppercase', margin: '0 0 4px' }}>Lowest Day</p>
              <p style={{ fontSize: '10px', fontWeight: 700, color: THEME.text, margin: 0 }}>{formatDateShort(worstDay.dateString)}</p>
              <p style={{ fontSize: '9px', color: THEME.muted, margin: '2px 0 0' }}>{formatBDT(worstDay.totalOrderValue)} · {worstDay.totalOrder} orders</p>
            </div>
          </div>
        )}

        {/* Daily Breakdown Table */}
        <p style={{ fontSize: '9px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Daily Breakdown</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${THEME.border}40`, borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
          <thead>
            <tr style={{ background: THEME.bg }}>
              <th style={{ padding: '6px 8px', fontSize: '8px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', textAlign: 'left', borderBottom: `1px solid ${THEME.border}40` }}>Date</th>
              <th style={{ padding: '6px 8px', fontSize: '8px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', textAlign: 'left', borderBottom: `1px solid ${THEME.border}40` }}>Day</th>
              <th style={{ padding: '6px 8px', fontSize: '8px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', textAlign: 'right', borderBottom: `1px solid ${THEME.border}40` }}>Orders</th>
              <th style={{ padding: '6px 8px', fontSize: '8px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', textAlign: 'right', borderBottom: `1px solid ${THEME.border}40` }}>Products</th>
              <th style={{ padding: '6px 8px', fontSize: '8px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', textAlign: 'right', borderBottom: `1px solid ${THEME.border}40` }}>Value</th>
              <th style={{ padding: '6px 8px', fontSize: '8px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', textAlign: 'right', borderBottom: `1px solid ${THEME.border}40` }}>Advance</th>
              <th style={{ padding: '6px 8px', fontSize: '8px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', textAlign: 'right', borderBottom: `1px solid ${THEME.border}40` }}>Reg/Cust</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <DailyRow key={r.dateString} report={r} index={i} odd={i % 2 === 0} />
            ))}
          </tbody>
        </table>

        {/* Top Products */}
        {topProducts.length > 0 && (
          <div>
            <p style={{ fontSize: '9px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Top Products ({topProducts.length})</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${THEME.border}40`, borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: THEME.bg }}>
                  <th style={{ padding: '5px 8px', fontSize: '8px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', textAlign: 'left', borderBottom: `1px solid ${THEME.border}40` }}>Product</th>
                  <th style={{ padding: '5px 8px', fontSize: '8px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', textAlign: 'left', borderBottom: `1px solid ${THEME.border}40` }}>Category</th>
                  <th style={{ padding: '5px 8px', fontSize: '8px', fontWeight: 600, color: THEME.muted, textTransform: 'uppercase', textAlign: 'right', borderBottom: `1px solid ${THEME.border}40` }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <ProductRow key={p.name} name={p.name} qty={p.qty} category={p.category} odd={i % 2 === 0} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${THEME.border}40`,
        padding: '12px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px',
      }}>
        <p style={{ fontSize: '8px', color: THEME.muted, margin: 0 }}>Anzaar Islamic Lifestyle · Sales Report System</p>
        <p style={{ fontSize: '8px', color: THEME.muted, margin: 0 }}>
          Generated {new Date().toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
