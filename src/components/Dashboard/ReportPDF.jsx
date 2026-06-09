import { formatBDT, formatNumber } from '../../utils/formatters';

const T = {
  gold: '#C9A84C', teal: '#0D9488', rose: '#E11D48', blue: '#3B82F6', purple: '#8B5CF6',
  text: '#0F172A', muted: '#64748B', border: '#E2E8F0', bg: '#F8FAFC', white: '#FFFFFF',
};

function StatCard({ label, value, color = T.gold }) {
  return (
    <div style={{
      background: `${color}0A`, border: `2px solid ${color}25`,
      borderRadius: '16px', padding: '16px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '13px', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 900, color: T.text, margin: '6px 0 0', fontFamily: 'monospace', lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value, color, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 16px', background: highlight ? `${color}08` : 'transparent',
      borderRadius: '12px', borderBottom: `1px solid ${T.border}30`,
    }}>
      <span style={{ fontSize: '15px', color: T.muted }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: 800, color: color || T.text, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function SectionHeader({ icon, title, color = T.gold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', marginTop: '8px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{icon}</div>
      <span style={{ fontSize: '15px', fontWeight: 800, color: T.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
    </div>
  );
}

function AlertBox({ icon, text, color = T.gold }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 14px', background: `${color}0A`, border: `2px solid ${color}20`,
      borderRadius: '14px', marginBottom: '6px',
    }}>
      <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '13px', color: T.text, lineHeight: '1.6' }}>{text}</span>
    </div>
  );
}

function SplitBar({ left, right, leftColor, rightColor, leftLabel, rightLabel }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
        <div style={{ flex: 1, background: `${leftColor}10`, border: `2px solid ${leftColor}25`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: T.muted, textTransform: 'uppercase', fontWeight: 700 }}>{leftLabel}</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: leftColor, margin: '4px 0 0', fontFamily: 'monospace' }}>{left}</div>
        </div>
        <div style={{ flex: 1, background: `${rightColor}10`, border: `2px solid ${rightColor}25`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: T.muted, textTransform: 'uppercase', fontWeight: 700 }}>{rightLabel}</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: rightColor, margin: '4px 0 0', fontFamily: 'monospace' }}>{right}</div>
        </div>
      </div>
      <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: `${rightColor}15` }}>
        <div style={{ width: `${left || 0}%`, background: leftColor, borderRadius: '4px 0 0 4px' }} />
        <div style={{ width: `${right || 0}%`, background: rightColor, borderRadius: '0 4px 4px 0' }} />
      </div>
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

  // Dead products
  const deadProducts = (() => {
    if (!allReports || allReports.length === 0) return [];
    const productLastSeen = {};
    allReports.forEach(r => {
      (r.products || []).forEach(p => {
        if (!productLastSeen[p.name] || r.dateString > productLastSeen[p.name].date) {
          productLastSeen[p.name] = { date: r.dateString, category: p.category || 'Other' };
        }
      });
    });
    return Object.entries(productLastSeen)
      .filter(([, d]) => Math.floor((new Date(report.dateString) - new Date(d.date)) / 86400000) > 7)
      .slice(0, 5)
      .map(([name, d]) => ({ name, lastSeen: d.date, category: d.category }));
  })();

  // Alerts
  const alerts = [];
  if (advanceRate < 40) alerts.push({ icon: '⚠️', text: `Advance rate is low at ${advanceRate}%. Collect 60%+ upfront.`, color: T.rose });
  if (advanceRate >= 60) alerts.push({ icon: '✅', text: `Good advance rate at ${advanceRate}%.`, color: T.teal });
  if (customizeRate > 50) alerts.push({ icon: '🎨', text: `${customizeRate}% orders are customize. Plan production time.`, color: T.purple });
  if (report.totalOrder > 15) alerts.push({ icon: '🚀', text: `Strong day! ${report.totalOrder} orders.`, color: T.teal });
  if (pendingAmount > report.totalOrderValue * 0.5) alerts.push({ icon: '💳', text: `High pending: ${formatBDT(pendingAmount)}. Follow up.`, color: T.rose });
  if (deadProducts.length > 2) alerts.push({ icon: '💀', text: `${deadProducts.length} products haven't sold in 7+ days.`, color: T.rose });

  return (
    <div
      id="report-pdf-content"
      style={{
        width: '375px', maxWidth: '375px',
        background: T.white,
        fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
        color: T.text, padding: '0',
        position: 'absolute', left: '-9999px', top: 0,
      }}
    >
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${T.gold}, ${T.gold}DD)`,
        padding: '28px 20px', color: T.white,
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, opacity: 0.85, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Anzaar Islamic Lifestyle</div>
        <div style={{ fontSize: '22px', fontWeight: 900, margin: '6px 0 0' }}>Daily Order Report</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <span style={{ fontSize: '24px', fontWeight: 800 }}>{report.dateString}</span>
          <span style={{ fontSize: '14px', opacity: 0.8 }}>{report.dayOfWeek}</span>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Main Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <StatCard label="Orders" value={formatNumber(report.totalOrder)} color={T.gold} />
          <StatCard label="Revenue" value={formatBDT(report.totalOrderValue)} color={T.teal} />
        </div>

        {/* Quick Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <div style={{ background: T.bg, borderRadius: '12px', padding: '12px', textAlign: 'center', border: `1px solid ${T.border}50` }}>
            <div style={{ fontSize: '11px', color: T.muted, textTransform: 'uppercase' }}>AOV</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: T.text, fontFamily: 'monospace' }}>{formatBDT(avgOrderValue)}</div>
          </div>
          <div style={{ background: T.bg, borderRadius: '12px', padding: '12px', textAlign: 'center', border: `1px solid ${T.border}50` }}>
            <div style={{ fontSize: '11px', color: T.muted, textTransform: 'uppercase' }}>Advance</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: advanceRate >= 50 ? T.teal : T.rose, fontFamily: 'monospace' }}>{advanceRate}%</div>
          </div>
          <div style={{ background: T.bg, borderRadius: '12px', padding: '12px', textAlign: 'center', border: `1px solid ${T.border}50` }}>
            <div style={{ fontSize: '11px', color: T.muted, textTransform: 'uppercase' }}>Products</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: T.text, fontFamily: 'monospace' }}>{formatNumber(report.totalProduct)}</div>
          </div>
        </div>

        {/* Order Split */}
        <SectionHeader icon="📦" title="Order Split" />
        <SplitBar
          left={report.regularOrder} right={report.customizeOrder}
          leftColor={T.gold} rightColor={T.rose}
          leftLabel={`Regular ${regularRate}%`} rightLabel={`Custom ${customizeRate}%`}
        />

        {/* Payment */}
        <SectionHeader icon="💳" title="Payment" color={T.teal} />
        <div style={{ background: T.bg, borderRadius: '14px', border: `1px solid ${T.border}40`, overflow: 'hidden', marginBottom: '20px' }}>
          <InfoRow label="Collected" value={formatBDT(report.totalAdvance)} color={T.teal} highlight />
          <InfoRow label="Pending" value={formatBDT(pendingAmount)} color={T.rose} />
          <InfoRow label="Rate" value={`${advanceRate}%`} color={advanceRate >= 50 ? T.teal : T.rose} />
        </div>

        {/* Products */}
        {report.products && report.products.length > 0 && (
          <>
            <SectionHeader icon="🛒" title={`Products (${report.products.length})`} />
            <div style={{ border: `2px solid ${T.border}40`, borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>
              {report.products.map((p, i) => (
                <div key={p.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', background: i % 2 === 0 ? T.bg : T.white,
                  borderBottom: i < report.products.length - 1 ? `1px solid ${T.border}30` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <span style={{
                      width: '24px', height: '24px', borderRadius: '8px',
                      background: `${T.gold}15`, color: T.gold,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 800, fontFamily: 'monospace', flexShrink: 0,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: '14px', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: T.gold, fontFamily: 'monospace', flexShrink: 0, marginLeft: '8px' }}>×{p.quantity}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Dead Products */}
        {deadProducts.length > 0 && (
          <>
            <SectionHeader icon="💀" title={`Dead Stock (${deadProducts.length})`} color={T.rose} />
            <div style={{ border: `2px solid ${T.rose}20`, borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>
              {deadProducts.map((p, i) => (
                <div key={p.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', background: i % 2 === 0 ? `${T.rose}05` : T.white,
                  borderBottom: i < deadProducts.length - 1 ? `1px solid ${T.border}30` : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: T.muted }}>{p.category}</div>
                  </div>
                  <span style={{ fontSize: '11px', color: T.rose, fontFamily: 'monospace', flexShrink: 0 }}>Last: {p.lastSeen}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <>
            <SectionHeader icon="🔔" title="Alerts" color={T.rose} />
            <div style={{ marginBottom: '20px' }}>
              {alerts.map((a, i) => (
                <AlertBox key={i} icon={a.icon} text={a.text} color={a.color} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `2px solid ${T.border}30`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: T.muted }}>Anzaar Sales Report</span>
        <span style={{ fontSize: '11px', color: T.muted }}>{new Date().toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
    </div>
  );
}
