import { formatBDT, formatNumber } from '../../utils/formatters';

const T = {
  gold: '#C9A84C', teal: '#0D9488', rose: '#E11D48', blue: '#3B82F6', purple: '#8B5CF6',
  text: '#0F172A', muted: '#64748B', border: '#E2E8F0', bg: '#F8FAFC', white: '#FFFFFF',
};

function Box({ label, value, color = T.gold, large }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}0A, ${color}04)`,
      border: `1px solid ${color}22`, borderRadius: '12px',
      padding: large ? '14px 16px' : '10px 14px', textAlign: 'center',
    }}>
      <p style={{ fontSize: '9px', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, fontWeight: 700 }}>{label}</p>
      <p style={{ fontSize: large ? '22px' : '18px', fontWeight: 800, color: T.text, margin: '4px 0 0', fontFamily: 'monospace' }}>{value}</p>
    </div>
  );
}

function Row({ left, right, color, bg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: bg || 'transparent', borderRadius: '8px', marginBottom: '2px' }}>
      <span style={{ fontSize: '11px', color: T.muted }}>{left}</span>
      <span style={{ fontSize: '12px', fontWeight: 700, color: color || T.text, fontFamily: 'monospace' }}>{right}</span>
    </div>
  );
}

function SectionTitle({ icon, title, color = T.gold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', marginTop: '6px' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{icon}</div>
      <span style={{ fontSize: '11px', fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
    </div>
  );
}

function AlertItem({ icon, text, color = T.gold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', background: `${color}08`, border: `1px solid ${color}18`, borderRadius: '10px', marginBottom: '4px' }}>
      <span style={{ fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
      <span style={{ fontSize: '10px', color: T.text, lineHeight: '1.5' }}>{text}</span>
    </div>
  );
}

export default function ReportPDF({ report, allReports }) {
  if (!report) return null;

  const regularRate = report.totalOrder > 0 ? Math.round((report.regularOrder / report.totalOrder) * 100) : 0;
  const customizeRate = report.totalOrder > 0 ? Math.round((report.customizeOrder / report.totalOrder) * 100) : 0;
  const advanceRate = report.totalOrderValue > 0 ? Math.round((report.totalAdvance / report.totalOrderValue) * 100) : 0;
  const pendingAmount = Math.max(0, (report.totalOrderValue || 0) - (report.totalAdvance || 0));
  const avgOrderValue = report.totalOrder > 0 ? Math.round(report.totalOrderValue / report.totalOrder) : 0;

  // Dead products (from allReports)
  const deadProducts = (() => {
    if (!allReports || allReports.length === 0) return [];
    const productLastSeen = {};
    allReports.forEach(r => {
      (r.products || []).forEach(p => {
        if (!productLastSeen[p.name] || r.dateString > productLastSeen[p.name].date) {
          productLastSeen[p.name] = { date: r.dateString, qty: p.quantity || 0, category: p.category || 'Other' };
        }
      });
    });
    const reportDate = report.dateString;
    return Object.entries(productLastSeen)
      .filter(([name, data]) => {
        const daysDiff = Math.floor((new Date(reportDate) - new Date(data.date)) / 86400000);
        return daysDiff > 7;
      })
      .sort((a, b) => new Date(a[1].date) - new Date(b[1].date))
      .slice(0, 8)
      .map(([name, data]) => ({ name, lastSeen: data.date, category: data.category }));
  })();

  // Alerts & suggestions
  const alerts = [];
  if (advanceRate < 40) alerts.push({ icon: '⚠', text: `Advance rate is low at ${advanceRate}%. Target 60%+ to reduce pending risk.`, color: T.rose });
  if (advanceRate >= 60) alerts.push({ icon: '✅', text: `Good advance rate at ${advanceRate}%. Keep collecting advances upfront.`, color: T.teal });
  if (customizeRate > 50) alerts.push({ icon: '🎨', text: `${customizeRate}% orders are customize. May affect delivery timelines—plan production accordingly.`, color: T.purple });
  if (report.totalOrder < 5) alerts.push({ icon: '📉', text: `Low order day with only ${report.totalOrder} orders. Consider marketing push.`, color: T.rose });
  if (report.totalOrder > 15) alerts.push({ icon: '🚀', text: `Strong day! ${report.totalOrder} orders with ${formatBDT(report.totalOrderValue)} revenue.`, color: T.teal });
  if (pendingAmount > report.totalOrderValue * 0.5) alerts.push({ icon: '💳', text: `High pending: ${formatBDT(pendingAmount)} unpaid (${100 - advanceRate}%). Follow up with customers.`, color: T.rose });
  if (deadProducts.length > 3) alerts.push({ icon: '💀', text: `${deadProducts.length} products haven't been ordered in 7+ days. Consider promotions or discontinuing.`, color: T.rose });
  if (avgOrderValue > 3000) alerts.push({ icon: '💎', text: `High AOV of ${formatBDT(avgOrderValue)}. Premium product mix is performing well.`, color: T.gold });

  return (
    <div
      id="report-pdf-content"
      style={{
        width: '400px', maxWidth: '400px',
        background: T.white,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        color: T.text, padding: '0',
        position: 'absolute', left: '-9999px', top: 0,
      }}
    >
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.gold}DD)`, padding: '20px 18px', color: T.white, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: '-10px', left: '30%', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '17px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>Anzaar Islamic Lifestyle</h1>
          <p style={{ fontSize: '10px', opacity: 0.85, margin: '3px 0 0' }}>Daily Order Report</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700 }}>{report.dateString}</span>
            <span style={{ fontSize: '10px', opacity: 0.8 }}>{report.dayOfWeek}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 18px' }}>
        {/* KPI Cards - 2x2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <Box label="Total Orders" value={formatNumber(report.totalOrder)} color={T.gold} large />
          <Box label="Total Value" value={formatBDT(report.totalOrderValue)} color={T.teal} large />
          <Box label="Advance" value={formatBDT(report.totalAdvance)} color={T.gold} />
          <Box label="Products" value={formatNumber(report.totalProduct)} color={T.teal} />
        </div>

        {/* Quick Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '14px' }}>
          <div style={{ background: T.bg, borderRadius: '10px', padding: '8px', textAlign: 'center', border: `1px solid ${T.border}40` }}>
            <p style={{ fontSize: '8px', color: T.muted, margin: 0, textTransform: 'uppercase' }}>AOV</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, margin: '2px 0 0', fontFamily: 'monospace' }}>{formatBDT(avgOrderValue)}</p>
          </div>
          <div style={{ background: T.bg, borderRadius: '10px', padding: '8px', textAlign: 'center', border: `1px solid ${T.border}40` }}>
            <p style={{ fontSize: '8px', color: T.muted, margin: 0, textTransform: 'uppercase' }}>Advance %</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: advanceRate >= 50 ? T.teal : T.rose, margin: '2px 0 0', fontFamily: 'monospace' }}>{advanceRate}%</p>
          </div>
          <div style={{ background: T.bg, borderRadius: '10px', padding: '8px', textAlign: 'center', border: `1px solid ${T.border}40` }}>
            <p style={{ fontSize: '8px', color: T.muted, margin: 0, textTransform: 'uppercase' }}>Pending</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: T.rose, margin: '2px 0 0', fontFamily: 'monospace' }}>{formatBDT(pendingAmount)}</p>
          </div>
        </div>

        {/* Order Split */}
        <SectionTitle icon="📦" title="Order Split" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <div style={{ background: `${T.gold}0A`, border: `1px solid ${T.gold}20`, borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: T.muted, textTransform: 'uppercase' }}>Regular</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: T.gold, fontFamily: 'monospace' }}>{report.regularOrder}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: T.muted }}>
              <span>{formatNumber(report.regularProduct)} products</span>
              <span style={{ fontWeight: 600, color: T.gold }}>{regularRate}%</span>
            </div>
            <div style={{ marginTop: '6px', height: '4px', background: `${T.gold}15`, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${regularRate}%`, background: T.gold, borderRadius: '2px' }} />
            </div>
          </div>
          <div style={{ background: `${T.rose}0A`, border: `1px solid ${T.rose}20`, borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: T.muted, textTransform: 'uppercase' }}>Custom</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: T.rose, fontFamily: 'monospace' }}>{report.customizeOrder}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: T.muted }}>
              <span>{formatNumber(report.customizeProduct)} products</span>
              <span style={{ fontWeight: 600, color: T.rose }}>{customizeRate}%</span>
            </div>
            <div style={{ marginTop: '6px', height: '4px', background: `${T.rose}15`, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${customizeRate}%`, background: T.rose, borderRadius: '2px' }} />
            </div>
          </div>
        </div>

        {/* Advance Details */}
        <SectionTitle icon="💳" title="Payment" color={T.teal} />
        <div style={{ background: T.bg, borderRadius: '10px', padding: '10px 12px', marginBottom: '14px', border: `1px solid ${T.border}40` }}>
          <Row left="Collected" right={formatBDT(report.totalAdvance)} color={T.teal} />
          <Row left="Pending" right={formatBDT(pendingAmount)} color={T.rose} bg={`${T.rose}04`} />
          <Row left="Rate" right={`${advanceRate}%`} color={advanceRate >= 50 ? T.teal : T.rose} />
        </div>

        {/* Products */}
        {report.products && report.products.length > 0 && (
          <>
            <SectionTitle icon="🛒" title={`Products (${report.products.length})`} />
            <div style={{ border: `1px solid ${T.border}40`, borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              {report.products.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: i % 2 === 0 ? T.bg : T.white, borderBottom: i < report.products.length - 1 ? `1px solid ${T.border}30` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '6px', background: `${T.gold}12`, color: T.gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: '10px', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: T.gold, fontFamily: 'monospace', flexShrink: 0, marginLeft: '6px' }}>×{p.quantity}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Dead Products */}
        {deadProducts.length > 0 && (
          <>
            <SectionTitle icon="💀" title={`Dead Stock (${deadProducts.length})`} color={T.rose} />
            <div style={{ border: `1px solid ${T.rose}20`, borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              {deadProducts.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: i % 2 === 0 ? `${T.rose}04` : T.white, borderBottom: i < deadProducts.length - 1 ? `1px solid ${T.border}30` : 'none' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '10px', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{p.name}</span>
                    <span style={{ fontSize: '8px', color: T.muted }}>{p.category}</span>
                  </div>
                  <span style={{ fontSize: '8px', color: T.rose, fontFamily: 'monospace', flexShrink: 0 }}>Last: {p.lastSeen}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Alerts & Suggestions */}
        {alerts.length > 0 && (
          <>
            <SectionTitle icon="🔔" title="Alerts & Suggestions" color={T.rose} />
            <div style={{ marginBottom: '14px' }}>
              {alerts.map((a, i) => (
                <AlertItem key={i} icon={a.icon} text={a.text} color={a.color} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}40`, padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '7px', color: T.muted, margin: 0 }}>Anzaar Islamic Lifestyle</p>
        <p style={{ fontSize: '7px', color: T.muted, margin: 0 }}>
          {new Date().toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
